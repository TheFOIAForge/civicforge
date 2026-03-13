"use client";

import { useState, useEffect } from "react";

interface ApiStatus {
  name: string;
  status: "up" | "down" | "no_key";
  latencyMs: number;
}

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testMessage, setTestMessage] = useState("");
  const [apis, setApis] = useState<ApiStatus[]>([]);
  const [apisLoading, setApisLoading] = useState(true);
  const [apisTimestamp, setApisTimestamp] = useState("");

  // Email service state
  const [emailProvider, setEmailProvider] = useState<"resend" | "sendgrid">("resend");
  const [emailApiKey, setEmailApiKey] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("citizenforge_api_key");
    if (stored) {
      setSavedKey(stored);
      setApiKey(stored);
    }
    // Load email config
    const emailConfig = localStorage.getItem("citizenforge_email_config");
    if (emailConfig) {
      const config = JSON.parse(emailConfig);
      setEmailProvider(config.provider || "resend");
      setEmailApiKey(config.apiKey || "");
      setSenderEmail(config.senderEmail || "");
      setEmailSaved(true);
    }
    fetchApiStatus();
  }, []);

  async function fetchApiStatus() {
    setApisLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setApis(data.apis);
      setApisTimestamp(data.timestamp);
    } catch {
      setApis([]);
    } finally {
      setApisLoading(false);
    }
  }

  function handleSave() {
    const trimmed = apiKey.trim();
    localStorage.setItem("citizenforge_api_key", trimmed);
    setSavedKey(trimmed);
    setTestResult(null);
  }

  function handleRemove() {
    localStorage.removeItem("citizenforge_api_key");
    setApiKey("");
    setSavedKey("");
    setTestResult(null);
  }

  async function handleTest() {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 10,
          messages: [{ role: "user", content: "Say OK" }],
        }),
      });

      if (response.ok) {
        setTestResult("success");
        setTestMessage("Connection successful. Your API key works.");
      } else {
        const data = await response.json().catch(() => ({}));
        setTestResult("error");
        setTestMessage(data.error?.message || `Error: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      setTestResult("error");
      setTestMessage(err instanceof Error ? err.message : "Connection failed.");
    } finally {
      setTesting(false);
    }
  }

  function handleClearContacts() {
    localStorage.removeItem("citizenforge_contacts");
  }

  function handleClearCampaigns() {
    localStorage.removeItem("citizenforge_campaigns");
  }

  const masked = savedKey ? savedKey.slice(0, 10) + "..." + savedKey.slice(-4) : "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-headline text-5xl md:text-6xl mb-2">Settings</h1>
      <p className="font-mono text-sm text-gray-mid mb-8 font-bold">
        YOUR API KEY. YOUR BROWSER. YOUR DATA. NOTHING LEAVES YOUR MACHINE.
      </p>

      {/* API Key Section */}
      <section className="border-3 border-border p-6 bg-surface mb-6">
        <h2 className="font-headline text-3xl mb-4">{"\u{1F511}"} Anthropic API Key</h2>
        <p className="font-body text-base text-gray-mid mb-5">
          CitizenForge uses your own Anthropic API key to power AI letter drafting,
          call scripts, and social posts. Your key is stored only in your
          browser&apos;s localStorage — it never touches our servers.
        </p>

        {savedKey && (
          <div className="mb-5 p-4 bg-green-light border-2 border-green">
            <p className="font-mono text-sm text-green font-bold mb-1">{"\u{2705}"} KEY SAVED</p>
            <p className="font-mono text-base text-gray-mid">{masked}</p>
          </div>
        )}

        <div className="mb-5">
          <label htmlFor="settings-apikey" className="font-mono text-sm text-gray-mid block mb-2 font-bold">API KEY</label>
          <input
            id="settings-apikey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-api03-..."
            aria-required="true"
            className="w-full px-4 py-3 border-2 border-border font-mono text-base focus:outline-none focus:border-red bg-cream"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-red text-white font-headline uppercase text-base cursor-pointer hover:bg-red-dark transition-colors border-3 border-red hover:border-red-dark"
          >
            Save Key
          </button>
          <button
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className={`px-6 py-3 font-headline uppercase text-base border-3 border-border cursor-pointer transition-colors ${
              testing ? "bg-gray-mid text-white" : "bg-black text-white hover:bg-gray-dark"
            }`}
          >
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {savedKey && (
            <button
              onClick={handleRemove}
              className="px-6 py-3 font-headline uppercase text-base border-3 border-border cursor-pointer hover:bg-status-red hover:text-white hover:border-status-red transition-colors"
            >
              Remove Key
            </button>
          )}
        </div>

        {testResult && (
          <div role="alert" className={`mt-5 p-4 border-2 font-mono text-base font-bold ${
            testResult === "success"
              ? "border-green bg-green-light text-green"
              : "border-status-red bg-status-red-light text-status-red"
          }`}>
            {testResult === "success" ? "\u{2705}" : "\u{274C}"} {testMessage}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 pt-6 border-t-2 border-border-light">
          <h3 className="font-headline text-xl mb-4">How to Get an API Key</h3>
          <ol className="font-body text-base text-gray-mid space-y-3 list-decimal list-inside">
            <li>
              Go to{" "}
              <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-red font-bold">
                console.anthropic.com
              </a>
            </li>
            <li>Create an account or sign in</li>
            <li>Add a payment method (pay-as-you-go, no subscription needed)</li>
            <li>Go to <strong>API Keys</strong> and create a new key</li>
            <li>Copy the key and paste it above</li>
          </ol>
          <div className="mt-4 p-4 bg-yellow-light border-2 border-yellow">
            <p className="font-mono text-sm font-bold text-gray-mid">
              TYPICAL COST: Each AI-drafted message costs roughly $0.01–0.05 via Claude Sonnet.
              Most users spend less than $1/month.
            </p>
          </div>
        </div>
      </section>

      {/* Email Service (Optional) */}
      <section className="border-3 border-border p-6 bg-surface mb-6">
        <h2 className="font-headline text-3xl mb-4">&#9993; Email Service (Optional)</h2>
        <p className="font-body text-base text-gray-mid mb-5">
          Enter your email service API key to send letters directly from CitizenForge
          without opening your email client. Your key is stored only in your
          browser&apos;s localStorage.
        </p>

        {emailSaved && (
          <div className="mb-5 p-4 bg-green-light border-2 border-green">
            <p className="font-mono text-sm text-green font-bold mb-1">{"\u{2705}"} EMAIL SERVICE CONFIGURED</p>
            <p className="font-mono text-base text-gray-mid">
              {emailProvider.toUpperCase()} &middot; {senderEmail}
            </p>
          </div>
        )}

        <div className="space-y-4 mb-5">
          <div>
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">PROVIDER</label>
            <select
              value={emailProvider}
              onChange={(e) => setEmailProvider(e.target.value as "resend" | "sendgrid")}
              className="w-full sm:w-auto px-4 py-3 border-2 border-border font-mono text-base bg-cream focus:outline-none focus:border-red"
            >
              <option value="resend">Resend</option>
              <option value="sendgrid">SendGrid</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">API KEY</label>
            <input
              type="password"
              value={emailApiKey}
              onChange={(e) => setEmailApiKey(e.target.value)}
              placeholder={emailProvider === "resend" ? "re_..." : "SG..."}
              className="w-full px-4 py-3 border-2 border-border font-mono text-base focus:outline-none focus:border-red bg-cream"
            />
          </div>

          <div>
            <label className="font-mono text-sm text-gray-mid block mb-2 font-bold">SENDER EMAIL</label>
            <input
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="you@yourdomain.com"
              className="w-full px-4 py-3 border-2 border-border font-mono text-base focus:outline-none focus:border-red bg-cream"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const config = {
                provider: emailProvider,
                apiKey: emailApiKey.trim(),
                senderEmail: senderEmail.trim(),
              };
              localStorage.setItem("citizenforge_email_config", JSON.stringify(config));
              setEmailSaved(true);
            }}
            disabled={!emailApiKey.trim() || !senderEmail.trim()}
            className={`px-6 py-3 font-headline uppercase text-base cursor-pointer transition-colors border-3 ${
              !emailApiKey.trim() || !senderEmail.trim()
                ? "bg-gray-mid text-white border-gray-mid"
                : "bg-red text-white border-red hover:bg-red-dark hover:border-red-dark"
            }`}
          >
            Save Email Config
          </button>
          {emailSaved && (
            <button
              onClick={() => {
                localStorage.removeItem("citizenforge_email_config");
                setEmailApiKey("");
                setSenderEmail("");
                setEmailSaved(false);
              }}
              className="px-6 py-3 font-headline uppercase text-base border-3 border-border cursor-pointer hover:bg-status-red hover:text-white hover:border-status-red transition-colors"
            >
              Remove Config
            </button>
          )}
        </div>

        <div className="mt-5 p-4 bg-yellow-light border-2 border-yellow">
          <p className="font-mono text-sm font-bold text-gray-mid">
            NOTE: You need a verified domain with your email provider. Resend offers a free
            tier (100 emails/day). SendGrid offers 100 emails/day free. Your API key never
            leaves your browser except when sending through our server-side relay.
          </p>
        </div>
      </section>

      {/* Data Management */}
      <section className="border-3 border-border p-6 bg-surface">
        <h2 className="font-headline text-3xl mb-4">{"\u{1F5C4}\u{FE0F}"} Data Management</h2>
        <p className="font-body text-base text-gray-mid mb-5">
          All your data is stored in your browser. Nothing is sent to external
          servers (except API calls to Anthropic when you generate content).
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-2 border-border p-4">
            <div>
              <p className="font-mono text-base font-bold">Contact Log</p>
              <p className="font-mono text-sm text-gray-mid">
                Your history of letters, calls, and posts
              </p>
            </div>
            <button
              onClick={handleClearContacts}
              className="px-5 py-2 font-mono text-sm border-2 border-border cursor-pointer hover:bg-status-red hover:text-white hover:border-status-red transition-colors font-bold"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center justify-between border-2 border-border p-4">
            <div>
              <p className="font-mono text-base font-bold">Campaigns</p>
              <p className="font-mono text-sm text-gray-mid">
                Your created campaigns and share links
              </p>
            </div>
            <button
              onClick={handleClearCampaigns}
              className="px-5 py-2 font-mono text-sm border-2 border-border cursor-pointer hover:bg-status-red hover:text-white hover:border-status-red transition-colors font-bold"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      {/* API Status */}
      <section className="border-3 border-border p-6 bg-surface mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-3xl">API Status</h2>
          <button
            onClick={fetchApiStatus}
            disabled={apisLoading}
            className="px-4 py-2 font-mono text-sm border-2 border-border cursor-pointer hover:bg-black hover:text-white transition-colors font-bold"
          >
            {apisLoading ? "Checking..." : "Refresh"}
          </button>
        </div>
        <p className="font-body text-base text-gray-mid mb-5">
          Real-time status of the data sources powering CitizenForge.
        </p>

        {apisLoading ? (
          <div className="font-mono text-sm text-gray-mid motion-safe:animate-pulse">
            Pinging APIs...
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {apis.map((api) => (
                <div
                  key={api.name}
                  className="flex items-center justify-between border-2 border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${
                        api.status === "up"
                          ? "bg-green"
                          : api.status === "no_key"
                          ? "bg-yellow"
                          : "bg-status-red"
                      }`}
                    />
                    <span className="font-mono text-base font-bold">
                      {api.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    {api.status === "up" && (
                      <span className="font-mono text-xs text-gray-mid">
                        {api.latencyMs}ms
                      </span>
                    )}
                    <span
                      className={`font-mono text-xs font-bold uppercase ${
                        api.status === "up"
                          ? "text-green"
                          : api.status === "no_key"
                          ? "text-yellow-dark"
                          : "text-status-red"
                      }`}
                    >
                      {api.status === "up"
                        ? "Operational"
                        : api.status === "no_key"
                        ? "No Key"
                        : "Down"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {apisTimestamp && (
              <p className="font-mono text-xs text-gray-mid mt-3">
                Last checked: {new Date(apisTimestamp).toLocaleString()}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
