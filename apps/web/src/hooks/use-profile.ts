"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchView, runCommand } from "@/lib/api-client";

export function useMyProfile() {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: () => fetchView("myProfile"),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      fullName?: string;
      phone?: string;
      city?: string;
      deliveryAddress?: string;
      payoutAccount?: string;
    }) => runCommand("updateProfile", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });
}
