import { getActor } from "@/server/actor";
import { DemoBanner } from "@/components/DemoBanner";
import { AppNav } from "@/components/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  return (
    <>
      <DemoBanner />
      <AppNav actor={actor} />
      <main id="main-content" style={{ padding: "1rem" }}>{children}</main>
    </>
  );
}
