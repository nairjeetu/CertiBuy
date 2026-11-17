"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchView, runCommand } from "@/lib/api-client";

export function useHubQueue(date?: string) {
  return useQuery({
    queryKey: ["hubQueue", date],
    queryFn: () => fetchView("hubQueue", date ? { date } : undefined),
  });
}

export function useHubJob(submissionId: string) {
  return useQuery({
    queryKey: ["hubJob", submissionId],
    queryFn: () => fetchView("hubJob", { submissionId }),
    enabled: !!submissionId,
  });
}

export function useVerifyIdentity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string; scannedImei: string; activationLockOff: boolean }) =>
      runCommand("verifyIdentity", body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["hubJob", v.submissionId] }); },
  });
}

export function useConfirmGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => runCommand("confirmGrade", body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["hubJob", (v as { submissionId: string }).submissionId] }); },
  });
}

export function useReviseOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string }) => runCommand("reviseOffer", body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["hubJob", v.submissionId] }); },
  });
}

export function useAcceptRevised() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string }) => runCommand("acceptRevised", body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["hubJob", v.submissionId] }); },
  });
}

export function useDeclineRevised() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string }) => runCommand("declineRevised", body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["hubJob", v.submissionId] }); },
  });
}

export function useRejectForMismatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string; feePaid?: boolean }) =>
      runCommand("rejectForMismatch", body),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: ["hubJob", v.submissionId] }); },
  });
}

export function useRejectDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string; reasonCode: string; note?: string }) =>
      runCommand("rejectDevice", body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["hubJob", v.submissionId] });
      qc.invalidateQueries({ queryKey: ["hubQueue"] });
    },
  });
}

export function useCompleteHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string; sealed: true; tagId: string; signatureUrl: string }) =>
      runCommand("completeHandover", body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["hubJob", v.submissionId] });
      qc.invalidateQueries({ queryKey: ["hubQueue"] });
    },
  });
}
