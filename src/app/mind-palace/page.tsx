"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "@/components/mind-palace/ChatMessage";
import { PLANNER_SYSTEM_PROMPT } from "@/lib/mind-palace/planner-prompt";
import { buildAnswerPrompt } from "@/lib/mind-palace/answer-prompt";
import { executePlan, buildDataContext, parsePlanResponse } from "@/lib/mind-palace/data-fetcher";

interface Message {
  role: "user" | "assistant";
  content: string;
  tokens?: { input: number; output: number; cost: number };
}

type Phase = "idle" | "planning" | "fetching" | "answering";

const SUGGESTED_QUESTIONS = [
  { category: "MEMBERS", question: "Who are the least loyal Republicans in the Senate?" },
  { category: "MONEY", question: "Show me the top fundraisers in Congress" },
  { category: "LOBBYING", question: "What lobbying activity is connected to Chuck Schumer?" },
  { category: "SPENDING", question: "How much federal money goes to California?" },
  { category: "OVERSIGHT", question: "What are the latest GAO audit reports?" },
  { category: "RULES", question: "What federal rules are open for public comment right now?" },
];

export default function MindPalacePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [fetchProgress, setFetchProgress] = useState({ completed: 0, total: 0, current: "" });
  const [error, setError] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiKey = typeof window !== "undefined" ? localStorage.getItem("civicforge_api_key") : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  async function callClaude(
    systemPrompt: string,
    userMessages: { role: string; content: string }[],
    maxTokens: number,
    stream: boolean = false,
    onChunk?: (text: string) => void
  ): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
    if (!apiKey) throw new Error("No API key");

    const body = {
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: userMessages,
      stream,
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API error ${res.status}: ${errText}`);
    }

    if (stream && res.body) {
      let text = "";
      let inputTokens = 0;
      let outputTokens = 0;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const event = JSON.parse(data);
            if (event.type === "content_block_delta" && event.delta?.text) {
              text += event.delta.text;
              onChunk?.(text);
            }
            if (event.type === "message_start" && event.message?.usage) {
              inputTokens = event.message.usage.input_tokens || 0;
            }
            if (event.type === "message_delta" && event.usage) {
              outputTokens = event.usage.output_tokens || 0;
            }
          } catch {
            // Skip malformed events
          }
        }
      }

      return { text, inputTokens, outputTokens };
    }

    const data = await res.json();
    return {
      text: data.content?.[0]?.text || "",
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
    };
  }

  async function handleSubmit(question: string) {
    if (!question.trim() || phase !== "idle") return;
    setError("");
    setStreamingContent("");

    const newMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");

    try {
      // Pass 1: Plan
      setPhase("planning");
      const planResult = await callClaude(
        PLANNER_SYSTEM_PROMPT,
        [{ role: "user", content: question }],
        500
      );

      const plan = parsePlanResponse(planResult.text);

      // Pass 2: Fetch data
      let dataContext = "";
      if (plan.calls.length > 0) {
        setPhase("fetching");
        const results = await executePlan(plan, (completed, total, current) => {
          setFetchProgress({ completed, total, current });
        });
        dataContext = buildDataContext(results);
      }

      // Pass 3: Answer with streaming
      setPhase("answering");

      // Build conversation history (last 4 exchanges for context)
      const historyMessages = newMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const answerPrompt = buildAnswerPrompt(dataContext || "No specific data was fetched. Answer based on general knowledge about US government, but note that you don't have real-time data for this question.");

      const answerResult = await callClaude(
        answerPrompt,
        historyMessages,
        4000,
        true,
        (text) => setStreamingContent(text)
      );

      // Compute cost (Sonnet pricing: $3/M input, $15/M output)
      const totalInput = planResult.inputTokens + answerResult.inputTokens;
      const totalOutput = planResult.outputTokens + answerResult.outputTokens;
      const cost = (totalInput * 3 + totalOutput * 15) / 1_000_000;

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: answerResult.text,
          tokens: { input: totalInput, output: totalOutput, cost },
        },
      ]);
      setStreamingContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPhase("idle");
    }
  }

  if (!apiKey) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="font-headline text-5xl md:text-6xl mb-4">Mind Palace</h1>
        <p className="font-body text-lg text-gray-mid mb-8">
          AI-powered research across all government data sources.
        </p>
        <div className="border-3 border-border p-8 bg-surface inline-block">
          <p className="font-headline text-xl mb-4">API Key Required</p>
          <p className="font-body text-base text-gray-mid mb-6">
            Mind Palace uses your Anthropic API key to power AI analysis.<br />
            Add your key in Settings to get started.
          </p>
          <a
            href="/settings"
            className="inline-block no-underline px-6 py-3 bg-red text-white font-headline uppercase text-base border-3 border-red hover:bg-black hover:border-black transition-colors"
          >
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="border-b-3 border-border px-4 py-4 bg-surface">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl">
              Mind <span className="text-red">Palace</span>
            </h1>
            <p className="font-mono text-xs text-gray-mid uppercase tracking-wider">
              AI Research Assistant — All Data Sources
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                setStreamingContent("");
                setError("");
              }}
              className="px-4 py-2 border-2 border-border font-mono text-xs uppercase font-bold hover:bg-black hover:text-white transition-colors"
            >
              New Session
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {messages.length === 0 && phase === "idle" && (
            <div className="py-8">
              <p className="font-body text-lg text-gray-mid text-center mb-8">
                Ask anything about Congress, campaign finance, lobbying, federal spending, oversight, or legislation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {SUGGESTED_QUESTIONS.map((sq) => (
                  <button
                    key={sq.question}
                    onClick={() => handleSubmit(sq.question)}
                    className="text-left border-2 border-border p-4 bg-surface hover:bg-black hover:text-white transition-colors cursor-pointer group"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-gray-mid group-hover:text-white/60">
                      {sq.category}
                    </span>
                    <p className="font-body text-sm mt-1 group-hover:text-white">
                      {sq.question}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              tokens={msg.tokens}
            />
          ))}

          {/* Streaming content */}
          {streamingContent && (
            <ChatMessage role="assistant" content={streamingContent} />
          )}

          {/* Phase indicator */}
          {phase !== "idle" && !streamingContent && (
            <div className="mb-4">
              <div className="border-3 border-red bg-black text-white p-4 inline-block">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red animate-pulse" />
                  <span className="font-mono text-sm uppercase tracking-wider font-bold">
                    {phase === "planning" && "Analyzing question..."}
                    {phase === "fetching" &&
                      `Fetching data: ${fetchProgress.current} (${fetchProgress.completed}/${fetchProgress.total})`}
                    {phase === "answering" && "Composing answer..."}
                  </span>
                </div>
                {phase === "fetching" && fetchProgress.total > 0 && (
                  <div className="mt-2 h-1 bg-white/20">
                    <div
                      className="h-full bg-red transition-all"
                      style={{
                        width: `${(fetchProgress.completed / fetchProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 border-3 border-red bg-red/10 p-4">
              <p className="font-mono text-sm text-red font-bold">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t-3 border-border bg-surface px-4 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="max-w-5xl mx-auto flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Congress, spending, lobbying, oversight..."
            disabled={phase !== "idle"}
            className="flex-1 px-4 py-3 border-3 border-border font-body text-base focus:outline-none focus:border-red bg-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={phase !== "idle" || !input.trim()}
            className="px-6 py-3 bg-red text-white font-headline uppercase text-base border-3 border-red hover:bg-black hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
