"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchView, runCommand } from "@/lib/api-client";

// ─── Views ─────────────────────────────────────────────────────────────────

export function useOpsOverview() {
  return useQuery({ queryKey: ["opsOverview"], queryFn: () => fetchView("opsOverview") });
}

export function useOpsAlerts(params?: Record<string, string>) {
  return useQuery({ queryKey: ["opsAlerts", params], queryFn: () => fetchView("opsAlerts", params) });
}

export function useOpsCatalogue() {
  return useQuery({ queryKey: ["opsCatalogue"], queryFn: () => fetchView("opsCatalogue") });
}

export function useOpsPricing() {
  return useQuery({ queryKey: ["opsPricing"], queryFn: () => fetchView("opsPricing") });
}

export function useOpsLiquidity() {
  return useQuery({ queryKey: ["opsLiquidity"], queryFn: () => fetchView("opsLiquidity") });
}

export function useOpsInventory(params?: Record<string, string>) {
  return useQuery({ queryKey: ["opsInventory", params], queryFn: () => fetchView("opsInventory", params) });
}

export function useOpsExceptions(params?: Record<string, string>) {
  return useQuery({ queryKey: ["opsExceptions", params], queryFn: () => fetchView("opsExceptions", params) });
}

export function useOpsHubs() {
  return useQuery({ queryKey: ["opsHubs"], queryFn: () => fetchView("opsHubs") });
}

export function useOpsUsers(params?: Record<string, string>) {
  return useQuery({ queryKey: ["opsUsers", params], queryFn: () => fetchView("opsUsers", params) });
}

export function useOpsMetrics() {
  return useQuery({ queryKey: ["opsMetrics"], queryFn: () => fetchView("opsMetrics") });
}

export function useOpsDemoControls() {
  return useQuery({ queryKey: ["opsDemoControls"], queryFn: () => fetchView("opsDemoControls") });
}

export function useOpsJobHistory() {
  return useQuery({ queryKey: ["opsJobHistory"], queryFn: () => fetchView("opsJobHistory") });
}

export function useOpsSupportInbox(params?: Record<string, string>) {
  return useQuery({ queryKey: ["opsSupportInbox", params], queryFn: () => fetchView("opsSupportInbox", params) });
}

export function useOpsAuditLog(params?: Record<string, string>) {
  return useQuery({ queryKey: ["opsAuditLog", params], queryFn: () => fetchView("opsAuditLog", params) });
}

export function useOpsMailLog() {
  return useQuery({ queryKey: ["opsMailLog"], queryFn: () => fetchView("opsMailLog") });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function useRunDailyJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { date?: string }) => runCommand("runDailyJobs", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsOverview"] });
      qc.invalidateQueries({ queryKey: ["opsJobHistory"] });
      qc.invalidateQueries({ queryKey: ["opsInventory"] });
    },
  });
}

export function useAdvanceDemoClock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { days: number }) => runCommand("advanceDemoClock", body),
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function useRecalcLiquidity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => runCommand("recalcLiquidity", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsLiquidity"] });
      qc.invalidateQueries({ queryKey: ["opsCatalogue"] });
    },
  });
}

export function useComputeMetrics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => runCommand("computeMetrics", {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsMetrics"] });
    },
  });
}

export function useResolveException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { exceptionId: string; resolution: string }) =>
      runCommand("resolveException", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsExceptions"] });
      qc.invalidateQueries({ queryKey: ["opsAlerts"] });
      qc.invalidateQueries({ queryKey: ["opsOverview"] });
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, number>) => runCommand("updateSettings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsPricing"] });
      qc.invalidateQueries({ queryKey: ["opsDemoControls"] });
    },
  });
}

export function useTogglePayoutFailure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { enabled: boolean }) => runCommand("togglePayoutFailure", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsDemoControls"] });
    },
  });
}

export function useSaveDeviceModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => runCommand("saveDeviceModel", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsCatalogue"] });
    },
  });
}

export function useMarkRefurbished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { deviceId: string; partsReplaced: string[] }) =>
      runCommand("markRefurbishedAndList", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsInventory"] });
      qc.invalidateQueries({ queryKey: ["opsOverview"] });
    },
  });
}

export function useLiquidateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { deviceId: string }) => runCommand("liquidateDevice", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsInventory"] });
      qc.invalidateQueries({ queryKey: ["opsAlerts"] });
      qc.invalidateQueries({ queryKey: ["opsOverview"] });
    },
  });
}

export function useRepriceListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { listingId: string; newPrice: number }) =>
      runCommand("repriceListing", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsInventory"] });
      qc.invalidateQueries({ queryKey: ["opsAlerts"] });
    },
  });
}

export function useSetOverridePrice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { listingId: string; overridePrice: number | null }) =>
      runCommand("setOverridePrice", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsInventory"] });
    },
  });
}

export function usePauseIcForModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { deviceModelId: string; paused: boolean }) =>
      runCommand("pauseIcForModel", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opsCatalogue"] });
      qc.invalidateQueries({ queryKey: ["opsLiquidity"] });
    },
  });
}
