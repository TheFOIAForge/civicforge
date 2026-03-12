import type { TimelineEvent } from "@/lib/mind-palace/block-parser";

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="my-4 pl-4 border-l-3 border-black space-y-4">
      {events.map((event, i) => (
        <div key={i} className="relative pl-4">
          <div className="absolute -left-[22px] top-1 w-3 h-3 bg-red border-2 border-black" />
          <div className="font-mono text-xs text-gray-mid uppercase">{event.date}</div>
          <div className="font-headline text-base mt-0.5">{event.title}</div>
          {event.description && (
            <div className="font-body text-sm text-gray-mid mt-0.5">{event.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
