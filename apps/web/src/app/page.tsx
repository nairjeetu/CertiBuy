import { getActor } from "@/server/actor";
import { homeFor } from "@certibuy/application";
import { redirect } from "next/navigation";

export default async function Home() {
  const actor = await getActor();
  redirect(homeFor(actor));
}
