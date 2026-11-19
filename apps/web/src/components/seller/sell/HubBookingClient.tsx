"use client";

import { useHubSlots, useBookInspection } from "@/hooks/use-seller";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepRail } from "./StepRail";

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

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading hubs...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

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
    <div className="hub-page">
      <StepRail current={6} />
      <h1 className="hub-title">Book an inspection</h1>
      <p className="meta" style={{ marginBottom: "1.25rem" }}>Choose a hub, pick a date and time. Bring the device, your ID and the charger.</p>

      {/* Hub list */}
      <div className="hub-list">
        {hubs.map((hub) => (
          <button
            key={hub.id}
            onClick={() => { setSelectedHub(hub.id); setSelectedDate(null); setSelectedSlot(null); }}
            className={`hub-card surface ${selectedHub === hub.id ? "hub-active" : ""}`}
          >
            <div className="hub-card-info">
              <span className="hub-card-name">{hub.name}</span>
              <span className="meta">{hub.address}, {hub.city}</span>
            </div>
            <span className="meta">{hub.type} · {hub.distanceKm} km</span>
          </button>
        ))}
      </div>

      {/* Date picker */}
      {activeHub && (
        <div className="section">
          <h3 className="section-heading">Choose a date</h3>
          <div className="date-row">
            {activeHub.dates.map((d) => {
              const dayLabel = new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
              return (
                <button
                  key={d.date}
                  onClick={() => { setSelectedDate(d.date); setSelectedSlot(null); }}
                  disabled={d.available <= 0}
                  className={`date-chip ${selectedDate === d.date ? "date-active" : ""} ${d.available <= 0 ? "date-full" : ""}`}
                >
                  <span className="date-chip-day">{dayLabel}</span>
                  <span className="meta">{d.available} slots</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Time picker */}
      {activeHub && selectedDate && (
        <div className="section">
          <h3 className="section-heading">Choose a time</h3>
          <div className="time-row">
            {activeHub.slotTimes.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`time-chip ${selectedSlot === slot ? "time-active" : ""}`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {submitError && <p className="error-msg">{submitError}</p>}

      <div className="actions">
        <button onClick={() => router.back()} className="btn-secondary">← Back</button>
        <button
          onClick={handleBook}
          disabled={!selectedHub || !selectedDate || !selectedSlot || book.isPending}
          className="btn-primary"
        >
          {book.isPending ? "Booking..." : "Confirm booking →"}
        </button>
      </div>

      {selectedHub && selectedDate && selectedSlot && (
        <div className="reminder surface">
          <strong>What to bring:</strong> your device, a government-issued photo ID, and the charger.
        </div>
      )}

      <style jsx>{`
        .hub-page {
          max-width: 640px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .hub-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }

        .hub-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .hub-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1.25rem;
          cursor: pointer;
          text-align: left;
          width: 100%;
          border: none;
          transition: all 0.15s;
        }
        .hub-active {
          outline: 2px solid hsl(var(--primary));
          outline-offset: -2px;
          background: hsl(var(--primary) / 0.04);
        }
        .hub-card:hover:not(.hub-active) { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .hub-card-info { display: flex; flex-direction: column; gap: 0.125rem; }
        .hub-card-name { font-weight: 600; font-size: 0.9375rem; color: hsl(var(--foreground)); }

        .section { margin-bottom: 1.5rem; }
        .section-heading {
          font-size: 0.9375rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 0 0 0.5rem;
        }

        .date-row {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }
        .date-chip {
          padding: 0.5rem 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          background: hsl(var(--card));
          cursor: pointer;
          text-align: center;
          min-width: 80px;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .date-active {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.04);
        }
        .date-full { opacity: 0.4; cursor: not-allowed; }
        .date-chip-day { display: block; font-size: 0.8125rem; font-weight: 600; color: hsl(var(--foreground)); }

        .time-row {
          display: flex;
          gap: 0.375rem;
          flex-wrap: wrap;
        }
        .time-chip {
          padding: 0.375rem 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          background: hsl(var(--card));
          cursor: pointer;
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          transition: all 0.15s;
        }
        .time-active {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        .error-msg { color: hsl(var(--destructive)); font-size: 0.875rem; margin-top: 0.75rem; }

        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5rem;
        }
        .btn-primary {
          padding: 0.625rem 1.5rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: default; }
        .btn-secondary {
          padding: 0.625rem 1.25rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .btn-secondary:hover { background: hsl(var(--secondary)); }

        .reminder {
          margin-top: 1rem;
          padding: 0.875rem 1.25rem;
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
