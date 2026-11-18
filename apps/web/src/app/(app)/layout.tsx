import { getActor } from "@/server/actor";
import { DemoBanner } from "@/components/DemoBanner";
import { SiteHeader } from "@/components/SiteHeader";
import { prisma } from "@certibuy/db";
import { businessDate } from "@certibuy/domain";
import type { Settings } from "@certibuy/domain";

async function getHeaderData(actorId: string) {
  try {
    const [settings, unread] = await Promise.all([
      prisma.settings.findUnique({ where: { id: 1 } }),
      prisma.notification.count({ where: { user_id: actorId, read: false } }),
    ]);
    const bDate = settings
      ? businessDate(settings as unknown as Settings, new Date())
      : new Date().toISOString().slice(0, 10);
    return { businessDate: bDate, unreadCount: unread };
  } catch {
    return { businessDate: undefined, unreadCount: 0 };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await getActor();
  const { businessDate: bDate, unreadCount } = await getHeaderData(actor.id);
  return (
    <>
      <DemoBanner />
      <SiteHeader actor={actor} businessDate={bDate} unreadCount={unreadCount} />
      <main id="main-content">{children}</main>
    </>
  );
}
