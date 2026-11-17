"use client";

import { useHubSlots, useBookInspection } from "@/hooks/use-seller";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HubData {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  distanceKm: number;
  slotTimes: string[];
  dailyCapacity: number;
  dates: Array<{ date: string; available: number }>;
}

export function HubBookingClient({ submissionId }: { submissionId: string }) {
  const { data, isLoading, error } = useHubSlots();
  const book = useBookInspection();
  const router = useRouter();
  const [selectedHub, setSelectedHub] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");

  if (isLoading) return <p>Loading hubs...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const hubs = ((data as { hubs?: HubData[] })?.hubs ?? []) as HubData[];

  const activeHub = hubs.find((h) => h.id === selectedHub);

  async function handleBook() {
    if (!selectedHub || !selectedDate || !selectedSlot) return;
    setSubmitError("");
    try {
      await book.mutateAsync({ submissionId, hubId: selectedHub, date: selectedDate, slot: selectedSlot });
      router.push(`/seller/deals/${submissionId}`);
    } catch (e) {
      setSubmitError((e as Error).message);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Book an inspection</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {hubs.map((hub) => (
          <button
            key={hub.id}
            onClick={() => { setSelectedHub(hub.id); setSelectedDate(null); setSelectedSlot(null); }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem 1rem",
              border: selectedHub === hub.id ? "2px solid #2563eb" : "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              backgroundColor: selectedHub === hub.id ? "#eff6ff" : "#fff",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div>
              <div style={{ fontWeight: 500 }}>{hub.name}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{hub.address}, {hub.city}</div>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              {hub.type} · {hub.distanceKm} km
            </div>
          </button>
        ))}
      </div>

      {activeHub && (
        <>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: "0.5rem" }}>
            Choose a date
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", marginBottom: "1rem" }}>
            {activeHub.dates.map((d) => {
              const dayLabel = new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
              return (
                <button
                  key={d.date}
                  onClick={() => { setSelectedDate(d.date); setSelectedSlot(null); }}
                  disabled={d.available <= 0}
                  style={{
                    padding: "0.5rem 0.75rem",
                    border: selectedDate === d.date ? "2px solid #2563eb" : "1px solid #d1d5db",
                    borderRadius: "0.375rem",
                    backgroundColor: selectedDate === d.date ? "#eff6ff" : d.available <= 0 ? "#f9fafb" : "#fff",
                    cursor: d.available > 0 ? "pointer" : "not-allowed",
                    opacity: d.available > 0 ? 1 : 0.5,
                    textAlign: "center",
                    minWidth: 80,
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{dayLabel}</div>
                  <div style={{ fontSize: "0.6875rem", color: "#6b7280" }}>{d.available} slots</div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeHub && selectedDate && (
        <>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: "0.5rem" }}>
            Choose a time
          </h3>
          <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {activeHub.slotTimes.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                style={{
                  padding: "0.375rem 0.75rem",
                  border: selectedSlot === slot ? "2px solid #2563eb" : "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  backgroundColor: selectedSlot === slot ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.8125rem",
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </>
      )}

      {submitError && <p style={{ color: "#991b1b", fontSize: "0.875rem" }}>{submitError}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button onClick={() => router.back()} style={{ padding: "0.5rem 1.25rem", backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}>
          Back
        </button>
        <button
          onClick={handleBook}
          disabled={!selectedHub || !selectedDate || !selectedSlot || book.isPending}
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: selectedHub && selectedDate && selectedSlot ? "#2563eb" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: selectedHub && selectedDate && selectedSlot ? "pointer" : "not-allowed",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {book.isPending ? "Booking..." : "Confirm booking"}
        </button>
      </div>

      {selectedHub && selectedDate && selectedSlot && (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", backgroundColor: "#f9fafb", borderRadius: "0.375rem", fontSize: "0.8125rem", color: "#374151" }}>
          <strong>What to bring:</strong> your device, a government-issued photo ID, and the charger.
        </div>
      )}
    </div>
  );
}
