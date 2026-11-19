"use client";

const STEPS = ["Choose device", "Details", "Photos", "Diagnostics", "Grade", "Offer", "Book hub", "Confirm"];

export function StepRail({ current }: { current: number }) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s} className={`step ${i < current ? "step-done" : ""} ${i === current ? "step-active" : ""}`}>
          <span className="step-num">
            {i < current ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
            ) : (
              i + 1
            )}
          </span>
          <span className="step-label">{s}</span>
        </div>
      ))}
      <style jsx>{`
        .stepper {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1.5rem;
          overflow-x: auto;
          padding-bottom: 0.25rem;
        }
        .step {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          white-space: nowrap;
        }
        .step-num {
          width: 22px; height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 600;
          background: hsl(var(--border));
          color: hsl(var(--muted));
          flex-shrink: 0;
        }
        .step-done .step-num {
          background: hsl(var(--success));
          color: white;
        }
        .step-active .step-num {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .step-label {
          font-size: 0.6875rem;
          color: hsl(var(--muted));
          margin-right: 0.5rem;
        }
        .step-done .step-label { color: hsl(var(--success)); }
        .step-active .step-label {
          color: hsl(var(--foreground));
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
