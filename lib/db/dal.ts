import type { Event, NewEvent } from "./schema";
import { eq, gt } from "drizzle-orm";
import { events, meta } from "./schema";

import { db } from "./connection";

export async function addEvent(
  eventData: Omit<NewEvent, "id" | "timestamp">
): Promise<void> {
  await db.insert(events).values(eventData);
}

export async function getAllEvents(): Promise<Event[]> {
  return await db.select().from(events).orderBy(events.id);
}

export async function getEventsSince(lastEventId: number): Promise<Event[]> {
  return await db
    .select()
    .from(events)
    .where(gt(events.id, lastEventId))
    .orderBy(events.id);
}

export async function getMeta(key: string): Promise<string | null> {
  const result = await db.select().from(meta).where(eq(meta.key, key)).limit(1);
  return result[0]?.value || null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await db.insert(meta).values({ key, value }).onConflictDoUpdate({
    target: meta.key,
    set: { value },
  });
}
