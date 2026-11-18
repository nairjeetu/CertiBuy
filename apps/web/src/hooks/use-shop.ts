"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchView, runCommand } from "@/lib/api-client";

// ─── Views ─────────────────────────────────────────────────────────────────

export function useShopHome() {
  return useQuery({
    queryKey: ["shopHome"],
    queryFn: () => fetchView("shopHome"),
  });
}

export function useShopCatalogue(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["shopCatalogue", params],
    queryFn: () => fetchView("shopCatalogue", params),
  });
}

export function useListingDetail(listingId: string) {
  return useQuery({
    queryKey: ["listingDetail", listingId],
    queryFn: () => fetchView("listingDetail", { listingId }),
    enabled: !!listingId,
  });
}

export function useCheckout(listingId: string) {
  return useQuery({
    queryKey: ["checkout", listingId],
    queryFn: () => fetchView("checkout", { listingId }),
    enabled: !!listingId,
  });
}

export function useShopGrades() {
  return useQuery({
    queryKey: ["shopGrades"],
    queryFn: () => fetchView("shopGrades"),
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: ["myOrders"],
    queryFn: () => fetchView("myOrders"),
  });
}

export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: ["orderTracking", orderId],
    queryFn: () => fetchView("orderTracking", { orderId }),
    enabled: !!orderId,
  });
}

export function useOrderReceipt(orderId: string) {
  return useQuery({
    queryKey: ["orderReceipt", orderId],
    queryFn: () => fetchView("orderReceipt", { orderId }),
    enabled: !!orderId,
  });
}

export function useReturnOptions(orderId: string) {
  return useQuery({
    queryKey: ["returnOptions", orderId],
    queryFn: () => fetchView("returnOptions", { orderId }),
    enabled: !!orderId,
  });
}

// ─── Mutations ─────────────────────────────────────────────────────────────

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      listingId: string;
      deliveryName: string;
      deliveryPhone: string;
      deliveryAddress: string;
      paymentMethod: string;
      warrantyAddon?: boolean;
    }) => runCommand("placeOrder", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myOrders"] });
      qc.invalidateQueries({ queryKey: ["shopHome"] });
      qc.invalidateQueries({ queryKey: ["shopCatalogue"] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { orderId: string; reason?: string }) =>
      runCommand("cancelOrder", body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["orderTracking", v.orderId] });
      qc.invalidateQueries({ queryKey: ["myOrders"] });
      qc.invalidateQueries({ queryKey: ["shopHome"] });
      qc.invalidateQueries({ queryKey: ["shopCatalogue"] });
    },
  });
}

export function useAdvanceShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { orderId: string }) =>
      runCommand("advanceShipment", body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["orderTracking", v.orderId] });
      qc.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useRaiseReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      orderId: string;
      reason: string;
      note?: string;
      doaPreference?: string;
    }) => runCommand("raiseReturn", body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["orderTracking", v.orderId] });
      qc.invalidateQueries({ queryKey: ["returnOptions", v.orderId] });
      qc.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}

export function useResolveReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { returnId: string; outcome: string; reason?: string }) =>
      runCommand("resolveReturn", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myOrders"] });
    },
  });
}
