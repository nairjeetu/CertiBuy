import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@certibuy/integrations/supabase/server";

export async function createClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(cookieStore);
}
