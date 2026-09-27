import { useEffect, useState } from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';

type HitRecoveryCountdownProps = {
  recoveryAt: number;
  style?: StyleProp<TextStyle>;
};

function getRemainingMs(recoveryAt: number): number {
  return Math.max(0, recoveryAt - Date.now());
}

export function formatHitRecoveryTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function HitRecoveryCountdown({
  recoveryAt,
  style,
}: HitRecoveryCountdownProps) {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(recoveryAt));

  useEffect(() => {
    const updateCountdown = () => setRemainingMs(getRemainingMs(recoveryAt));
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [recoveryAt]);

  return <Text style={style}>{formatHitRecoveryTime(remainingMs)}</Text>;
}

