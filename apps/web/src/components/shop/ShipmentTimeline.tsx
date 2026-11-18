"use client";

interface TimelineEntry {
  status: string;
  notes: string | null;
  createdAt: string;
}

export function ShipmentTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No shipment updates yet.</p>;

  return (
    <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
      <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 2, backgroundColor: "#e5e7eb" }} />
      {entries.map((e, i) => (
        <div key={i} style={{ position: "relative", paddingBottom: "1rem" }}>
          <div
            style={{
              position: "absolute",
              left: "-1.5rem",
              top: 4,
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: i === entries.length - 1 ? "#2563eb" : "#d1d5db",
              border: "2px solid #fff",
            }}
          />
          <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>
            {e.status.replace(/_/g, " ")}
          </p>
          {e.notes && <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "#6b7280" }}>{e.notes}</p>}
          <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
            {new Date(e.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        </div>
      ))}
    </div>
  );
}
