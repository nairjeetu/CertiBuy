"use client";

import { useState } from "react";
import { useConfirmGrade } from "@/hooks/use-hub";

const CHECKLIST_ITEMS = [
  "battery",
  "screen",
  "speakers",
  "microphone",
  "cameras",
  "charging",
  "sensors",
  "wifi_bluetooth",
  "buttons_ports",
] as const;

const GRADES = ["A", "B", "C", "D"] as const;

interface Props {
  submissionId: string;
}

export function ChecklistStep({ submissionId }: Props) {
  const [checklist, setChecklist] = useState<Record<string, "pass" | "fail">>(
    Object.fromEntries(CHECKLIST_ITEMS.map((k) => [k, "pass"])),
  );
  const [battery, setBattery] = useState(80);
  const [cosmetic, setCosmetic] = useState<"A" | "B" | "C" | "D">("A");
  const confirm = useConfirmGrade();

  const toggle = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: prev[key] === "pass" ? "fail" : "pass" }));
  };

  const handleSubmit = () => {
    confirm.mutate({
      submissionId,
      checklist,
      batteryHealth: battery,
      cosmeticGrade: cosmetic,
      photos: [],
    });
  };

  return (
    <div>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Inspection checklist</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem", marginBottom: "1rem" }}>
        {CHECKLIST_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => toggle(item)}
            style={{
              padding: "0.5rem",
              border: "1px solid",
              borderColor: checklist[item] === "pass" ? "#16a34a" : "#dc2626",
              borderRadius: "0.375rem",
              backgroundColor: checklist[item] === "pass" ? "hsl(var(--success) / 0.05)" : "#fef2f2",
              cursor: "pointer",
              fontSize: "0.8125rem",
              textAlign: "left",
            }}
          >
            {item.replace("_", " ")} — {checklist[item]}
          </button>
        ))}
      </div>

      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Battery health: {battery}%
      </label>
      <input
        type="range"
        min={50}
        max={100}
        value={battery}
        onChange={(e) => setBattery(Number(e.target.value))}
        style={{ width: "100%", marginBottom: "1rem" }}
      />

      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Cosmetic grade
      </label>
      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem" }}>
        {GRADES.map((g) => (
          <button
            key={g}
            onClick={() => setCosmetic(g)}
            style={{
              width: 40,
              height: 40,
              border: cosmetic === g ? "2px solid #2563eb" : "1px solid hsl(var(--border))",
              borderRadius: "0.375rem",
              backgroundColor: cosmetic === g ? "hsl(var(--primary) / 0.04)" : "#fff",
              fontWeight: cosmetic === g ? 700 : 400,
              cursor: "pointer",
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={confirm.isPending}
        style={{ padding: "0.5rem 1rem", backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
      >
        {confirm.isPending ? "Confirming..." : "Confirm grade"}
      </button>

      {confirm.error && <p style={{ color: "hsl(var(--destructive))", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{(confirm.error as Error).message}</p>}
    </div>
  );
}
