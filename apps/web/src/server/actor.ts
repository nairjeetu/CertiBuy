import { createClient } from "@/lib/supabase-server";
import { prisma } from "@certibuy/db";
import type { Actor } from "@certibuy/application";
import { withActor, ForbiddenError } from "@certibuy/application";
import { redirect } from "next/navigation";

export async function getActor(): Promise<Actor> {
  try {
    return await withActor(
      async () => {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
      },
      async (userId) => {
        return prisma.profile.findUnique({ where: { id: userId } });
      },
      async (actor) => actor,
    );
  } catch (e) {
    if (e instanceof ForbiddenError) redirect("/login");
    throw e;
  }
}
