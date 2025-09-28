import React, { useEffect, useRef } from "react";

import ConfettiCannon from "react-native-confetti-cannon";

interface ConfettiCannonProps {
  fire: boolean;
  count?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  fadeOut?: boolean;
  autoStart?: boolean;
}

export function ConfettiCannonComponent({
  fire,
  count = 180,
  origin = { x: 0, y: 0 },
  colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
  fadeOut = true,
  autoStart = true,
}: ConfettiCannonProps) {
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (fire && confettiRef.current) {
      confettiRef.current.start();
    }
  }, [fire]);

  if (!fire) return null;

  return (
    <ConfettiCannon
      ref={confettiRef}
      count={count}
      origin={origin}
      colors={colors}
      fadeOut={fadeOut}
      autoStart={autoStart}
    />
  );
}
