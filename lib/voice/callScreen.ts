// Whether the call screen (app/voice.tsx) is still up. The review sheet is a native modal
// too, and iOS won't present it over a full-screen modal that's still on its way out:
// that left a black screen when the plan landed in the background (2026-11-09). So the
// watcher waits for the call screen to be fully gone before it opens the review.

let open = false;
let waiters: (() => void)[] = [];

/** The call screen calls this when it mounts (true), and once it has finished closing (false). */
export function setCallScreenOpen(value: boolean) {
  open = value;
  if (!value) {
    const run = waiters;
    waiters = [];
    run.forEach((f) => f());
  }
}

/** Resolves once the call screen is gone, or after `timeoutMs` in case the close went unseen. */
export function whenCallScreenClosed(timeoutMs = 3000): Promise<void> {
  if (!open) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      waiters = waiters.filter((f) => f !== done);
      resolve();
    }, timeoutMs);
    waiters.push(done);
  });
}
