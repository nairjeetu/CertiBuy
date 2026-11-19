"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchView, runCommand } from "@/lib/api-client";

export function useMyNotifications() {
  return useQuery({
    queryKey: ["myNotifications"],
    queryFn: () => fetchView("myNotifications"),
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => runCommand("markNotificationsRead", { ids }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myNotifications"] });
    },
  });
}
