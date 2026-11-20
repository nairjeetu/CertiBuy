"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchView } from "@/lib/api-client";

export function useMyProfile() {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: () => fetchView("myProfile"),
  });
}
