"use client";

import { GradeChip } from "../ui/GradeChip";

export function GradeBadge({ grade, className }: { grade: string; className?: string }) {
  return (
    <span className={className} style={{ position: "relative" }}>
      <GradeChip grade={grade} />
    </span>
  );
}
