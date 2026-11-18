"use client";

import { useShopGrades } from "@/hooks/use-shop";
import { GradeBadge } from "./GradeBadge";

interface GradeInfo { grade: string; label: string; description: string; batteryMin: number }

export function GradesClient() {
  const { data, isLoading, error } = useShopGrades();

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const grades = (data?.grades ?? []) as GradeInfo[];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>How grades work</h2>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
        Every device is inspected by a technician at a CertiBuy hub. The grade reflects physical condition and battery health.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {grades.map((g) => (
          <div key={g.grade} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <GradeBadge grade={g.grade} />
              <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{g.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>{g.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
