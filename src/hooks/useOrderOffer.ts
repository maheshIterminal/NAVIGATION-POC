import { useEffect, useState } from 'react';

function remainingSeconds(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return 0;
  return Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000));
}

export function useOfferCountdown(expiresAt: string | null): number {
  const [secondsLeft, setSecondsLeft] = useState(() => remainingSeconds(expiresAt));

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(0);
      return;
    }

    function tick() {
      setSecondsLeft(remainingSeconds(expiresAt));
    }

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return secondsLeft;
}
