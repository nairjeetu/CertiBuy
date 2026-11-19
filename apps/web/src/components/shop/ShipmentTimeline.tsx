"use client";

interface TimelineEntry {
  status: string;
  notes: string | null;
  createdAt: string;
}

export function ShipmentTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p className="meta">No shipment updates yet.</p>;

  return (
    <div className="timeline-list">
      {entries.map((e, i) => {
        const isLast = i === entries.length - 1;
        return (
          <div key={i} className="timeline-entry">
            <div className={`entry-dot ${isLast ? "entry-dot-active" : ""}`} />
            <div className="entry-content">
              <p className="entry-status">{e.status.replace(/_/g, " ")}</p>
              {e.notes && <p className="meta">{e.notes}</p>}
              <p className="meta">
                {new Date(e.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
              </p>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .timeline-list { position: relative; padding-left: 1.5rem; }
        .timeline-list::before {
          content: ""; position: absolute; left: 5px; top: 6px; bottom: 6px;
          width: 2px; background: hsl(var(--border));
        }
        .timeline-entry { position: relative; padding-bottom: 1rem; }
        .timeline-entry:last-child { padding-bottom: 0; }
        .entry-dot {
          position: absolute; left: -1.5rem; top: 4px;
          width: 12px; height: 12px; border-radius: 50%;
          background: hsl(var(--border)); border: 2px solid hsl(var(--card));
        }
        .entry-dot-active { background: hsl(var(--primary)); }
        .entry-status {
          margin: 0; font-size: 0.875rem; font-weight: 600;
          color: hsl(var(--foreground)); text-transform: capitalize;
        }
        .entry-content { display: flex; flex-direction: column; gap: 0.125rem; }
      `}</style>
    </div>
  );
}
