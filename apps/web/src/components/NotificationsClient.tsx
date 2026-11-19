"use client";

import { useMyNotifications, useMarkNotificationsRead } from "@/hooks/use-notifications";
import Link from "next/link";

interface Notification {
  id: string;
  event: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsClient() {
  const { data, isLoading } = useMyNotifications();
  const markRead = useMarkNotificationsRead();

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading notifications...</p>;

  const notifications = (data as { notifications: Notification[] })?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "hsl(var(--foreground))" }}>Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={() => markRead.mutate(undefined)}
            disabled={markRead.isPending}
            style={{
              border: "none",
              background: "none",
              color: "hsl(var(--primary))",
              fontSize: "0.8125rem",
              fontWeight: 500,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="surface" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "hsl(var(--muted))", margin: 0 }}>No notifications yet.</p>
          <p className="meta" style={{ marginTop: "0.5rem" }}>
            You will see updates about your orders and deals here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {notifications.map((n) => {
            const content = (
              <div
                className="surface"
                style={{
                  padding: "0.75rem 1rem",
                  borderLeft: n.read ? "none" : "3px solid hsl(var(--primary))",
                  opacity: n.read ? 0.7 : 1,
                }}
              >
                <p style={{ margin: 0, fontWeight: n.read ? 400 : 600, fontSize: "0.875rem", color: "hsl(var(--foreground))" }}>
                  {n.title}
                </p>
                {n.body && (
                  <p className="meta" style={{ margin: "0.25rem 0 0" }}>{n.body}</p>
                )}
                <p className="meta" style={{ margin: "0.25rem 0 0", fontSize: "0.75rem" }}>
                  {new Date(n.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            );

            if (n.link) {
              return (
                <Link key={n.id} href={n.link} style={{ textDecoration: "none", color: "inherit" }}
                  onClick={() => { if (!n.read) markRead.mutate([n.id]); }}
                >
                  {content}
                </Link>
              );
            }
            return <div key={n.id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}
