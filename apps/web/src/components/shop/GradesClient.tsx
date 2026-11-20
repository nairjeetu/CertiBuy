"use client";

import { useShopGrades } from "@/hooks/use-shop";
import Link from "next/link";

interface GradeInfo {
  grade: string; label: string; description: string;
  stock: number; warranty: string;
}

export function GradesClient() {
  const { data, isLoading, error } = useShopGrades();

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

  const grades = (data?.grades ?? []) as GradeInfo[];

  return (
    <div className="grades-page">
      <h1 className="grades-headline">A grade is a technician&apos;s verdict.</h1>
      <p className="grades-intro">
        No seller picks their own grade. A technician at a CertiBuy hub tests the device, measures the battery
        and records cosmetic condition. The worst of those three is the grade you see here.
      </p>

      {/* Three pillars */}
      <div className="pillars-grid">
        <div className="pillar-card surface">
          <div className="pillar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" /><path d="M12 3c-1.2 0-2.4.6-3 1.5A3.5 3.5 0 0 0 5 8v3c0 4 3 8 7 10 4-2 7-6 7-10V8a3.5 3.5 0 0 0-4-3.5A3.8 3.8 0 0 0 12 3z" />
            </svg>
          </div>
          <h3 className="pillar-title">Battery test</h3>
          <p className="pillar-desc">A device at 90% or better can still be Grade A. Below 80% it is a Grade D.</p>
        </div>
        <div className="pillar-card surface">
          <div className="pillar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <h3 className="pillar-title">Every function</h3>
          <p className="pillar-desc">Each checklist item is run in front of the seller. A single failure caps the device at Grade B.</p>
        </div>
        <div className="pillar-card surface">
          <div className="pillar-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
          </div>
          <h3 className="pillar-title">Cosmetic inspection</h3>
          <p className="pillar-desc">Glass and body are graded A to D in good light, on the same scale the checklist uses.</p>
        </div>
      </div>

      {/* Grade list */}
      <div className="grade-list surface">
        {grades.map((g) => (
          <Link key={g.grade} href={`/shop/browse?grade=${g.grade}`} className="grade-row">
            <span className="grade-row-letter">{g.grade}</span>
            <div className="grade-row-body">
              <span className="grade-row-label">{g.label}</span>
              <span className="grade-row-desc">{g.description}</span>
            </div>
            <div className="grade-row-meta">
              <span>{g.stock} in stock</span>
              <span className="meta">{g.warranty}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom cards */}
      <div className="bottom-cards">
        <div className="bottom-card surface">
          <div className="bottom-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 className="bottom-card-title">Warranty</h3>
          <p className="bottom-card-desc">
            Grade A to C devices carry 12 months, serviced by CertiBuy. At checkout you can add a second year for 5% of the price.
          </p>
        </div>
        <div className="bottom-card surface">
          <div className="bottom-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </div>
          <h3 className="bottom-card-title">Returns inside 7 days</h3>
          <p className="bottom-card-desc">
            Not as graded: full refund. Dead on arrival: refund or replacement. Changed your mind: ₹500 plus ₹300 logistics, always shown before you confirm.
          </p>
        </div>
      </div>

      <style jsx>{`
        .grades-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem 3rem;
        }
        .grades-headline {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 2rem;
          font-weight: 400;
          color: hsl(var(--foreground));
          margin: 0 0 0.75rem;
          line-height: 1.2;
        }
        .grades-intro {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: hsl(var(--muted));
          margin: 0 0 2rem;
          max-width: 600px;
        }

        /* Pillars */
        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .pillar-card { padding: 1.5rem; }
        .pillar-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: hsl(var(--primary) / 0.08); color: hsl(var(--primary));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.75rem;
        }
        .pillar-title {
          font-size: 0.9375rem; font-weight: 600;
          color: hsl(var(--foreground)); margin: 0 0 0.375rem;
        }
        .pillar-desc {
          font-size: 0.8125rem; line-height: 1.5;
          color: hsl(var(--muted)); margin: 0;
        }

        /* Grade list */
        .grade-list {
          margin-bottom: 2rem;
          overflow: hidden;
        }
        .grade-row {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          padding: 1.5rem 1.25rem;
          text-decoration: none;
          color: inherit;
          transition: background 0.15s;
        }
        .grade-row:not(:last-child) {
          border-bottom: 1px solid hsl(var(--border));
        }
        .grade-row:hover {
          background: hsl(var(--secondary));
        }
        .grade-row-letter {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 2rem;
          line-height: 1;
          color: hsl(var(--foreground));
          min-width: 2.5rem;
        }
        .grade-row-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .grade-row-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .grade-row-desc {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          line-height: 1.5;
        }
        .grade-row-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          white-space: nowrap;
        }

        /* Bottom cards */
        .bottom-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .bottom-card { padding: 1.25rem; }
        .bottom-card-icon {
          width: 36px; height: 36px; border-radius: 8px;
          background: hsl(var(--primary) / 0.08); color: hsl(var(--primary));
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 0.75rem;
        }
        .bottom-card-title {
          font-size: 0.9375rem; font-weight: 600;
          color: hsl(var(--foreground)); margin: 0 0 0.375rem;
        }
        .bottom-card-desc {
          font-size: 0.8125rem; line-height: 1.6;
          color: hsl(var(--muted)); margin: 0;
        }

        @media (max-width: 640px) {
          .pillars-grid { grid-template-columns: 1fr; }
          .bottom-cards { grid-template-columns: 1fr; }
          .grade-row { flex-wrap: wrap; }
          .grade-row-meta { flex-direction: row; gap: 0.5rem; }
          .grades-headline { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
