"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsPanel({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "POST" });
    router.refresh();
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    router.refresh();
  }

  if (notifications.length === 0) {
    return <p className="text-muted-foreground">No notifications yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount} unread
        </p>
        <Button size="sm" variant="outline" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-lg p-3 ${
            notification.readAt ? "bg-muted/20" : "border border-primary/30 bg-primary/5"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{notification.title}</p>
                {!notification.readAt && (
                  <Badge className="bg-primary/20 text-primary">New</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{notification.body}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
              {notification.href && (
                <a
                  href={notification.href}
                  className="text-sm text-secondary hover:underline"
                  onClick={() => markRead(notification.id)}
                >
                  Open
                </a>
              )}
            </div>
            {!notification.readAt && (
              <Button size="sm" variant="ghost" onClick={() => markRead(notification.id)}>
                Mark read
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
