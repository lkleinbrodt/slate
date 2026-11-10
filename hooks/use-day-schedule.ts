import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { DayEvent } from "@/lib/services/calendarSync";
import {
  type Interval,
  freeGaps,
  taskInterval,
  workBlock,
} from "@/lib/logic/schedule";
import { useAppStore } from "@/lib/stores/appStore";
import { useCalendarStore } from "@/lib/stores/calendarStore";
import { useSettingsStore } from "@/lib/stores/settings";
import { useTimeStore } from "@/lib/stores/timeStore";

const NO_EVENTS: DayEvent[] = [];

/** Minutes after midnight on `date`, ticking each minute. Past midnight but before the
 * day start, the logical day is over: 24:00. */
function useNowOn(date: string) {
  const read = useCallback(() => {
    const now = dayjs();
    const day = now.format("YYYY-MM-DD");
    if (day > date) return 24 * 60;
    if (day < date) return 0;
    return now.hour() * 60 + now.minute();
  }, [date]);
  const [now, setNow] = useState(read);
  useEffect(() => {
    setNow(read());
    const timer = setInterval(() => setNow(read()), 60_000);
    return () => clearInterval(timer);
  }, [read]);
  return now;
}

/**
 * Today's shape for time slots: the work block, your calendar events, and the free
 * gaps a task could go in (lib/logic/schedule.ts).
 */
export function useDaySchedule() {
  const today = useTimeStore((s) => s.currentDate);
  const schedule = useSettingsStore((s) => s.schedule);
  const dayOff = useSettingsStore((s) => s.workDayOff) === today;
  const events = useCalendarStore((s) => (s.eventsDate === today ? s.events : NO_EVENTS));
  const todayTasks = useAppStore((s) => s.todayTasks);
  const now = useNowOn(today);

  const work = useMemo(() => workBlock(today, schedule, dayOff), [today, schedule, dayOff]);

  /** Free gaps from now on, leaving out one task's own slot (when moving it) and any
   * tasks about to be placed */
  const gapsFor = useCallback(
    (exclude: string[] = []): Interval[] => {
      const busy: Interval[] = events.filter((e) => !e.allDay);
      for (const t of todayTasks) {
        const slot = taskInterval(t);
        if (slot && !exclude.includes(t.id)) busy.push(slot);
      }
      return freeGaps(busy, schedule, work, now);
    },
    [events, todayTasks, schedule, work, now]
  );

  return { today, schedule, work, dayOff, events, now, gapsFor };
}
