"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchView, runCommand } from "@/lib/api-client";

export function useSellerHome() {
  return useQuery({
    queryKey: ["sellerHome"],
    queryFn: () => fetchView<{ deals: unknown[] }>("sellerHome"),
  });
}

export function useSubmissionWizard(submissionId: string) {
  return useQuery({
    queryKey: ["submissionWizard", submissionId],
    queryFn: () => fetchView("submissionWizard", { submissionId }),
    enabled: !!submissionId,
  });
}

export function useOfferDetail(submissionId: string) {
  return useQuery({
    queryKey: ["offerDetail", submissionId],
    queryFn: () => fetchView("offerDetail", { submissionId }),
    enabled: !!submissionId,
  });
}

export function useHubSlots() {
  return useQuery({
    queryKey: ["hubSlots"],
    queryFn: () => fetchView("hubSlots"),
  });
}

export function useDealTracker(submissionId: string) {
  return useQuery({
    queryKey: ["dealTracker", submissionId],
    queryFn: () => fetchView("dealTracker", { submissionId }),
    enabled: !!submissionId,
  });
}

export function useSellerPayouts() {
  return useQuery({
    queryKey: ["sellerPayouts"],
    queryFn: () => fetchView("sellerPayouts"),
  });
}

export function useDeviceCatalogue() {
  return useQuery({
    queryKey: ["deviceCatalogue"],
    queryFn: () => fetchView("deviceCatalogue"),
  });
}

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspaceContext"],
    queryFn: () => fetchView("workspaceContext"),
    staleTime: 30_000,
  });
}

export function useSaveDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => runCommand("saveSubmissionDetails", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sellerHome"] }); },
  });
}

export function useSaveDiagnostics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => runCommand("saveDiagnostics", body),
    onSuccess: (_data, variables) => {
      const v = variables as { submissionId?: string };
      if (v.submissionId) qc.invalidateQueries({ queryKey: ["submissionWizard", v.submissionId] });
    },
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string }) => runCommand("gradeSubmission", body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["submissionWizard", variables.submissionId] });
      qc.invalidateQueries({ queryKey: ["sellerHome"] });
    },
  });
}

export function useAcceptOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string; option: string; consent: true }) =>
      runCommand("acceptOffer", body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["submissionWizard", variables.submissionId] });
      qc.invalidateQueries({ queryKey: ["sellerHome"] });
    },
  });
}

export function useBookInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string; hubId: string; date: string; slot: string }) =>
      runCommand("bookInspection", body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["submissionWizard", variables.submissionId] });
      qc.invalidateQueries({ queryKey: ["sellerHome"] });
      qc.invalidateQueries({ queryKey: ["hubSlots"] });
    },
  });
}

export function useManageBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { submissionId: string; action: string }) =>
      runCommand("manageBooking", body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["submissionWizard", variables.submissionId] });
      qc.invalidateQueries({ queryKey: ["sellerHome"] });
    },
  });
}
