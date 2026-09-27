import * as Haptics from 'expo-haptics';

export const { ImpactFeedbackStyle, NotificationFeedbackType } = Haptics;

let hapticsEnabled = false;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
}

export function playImpact(style: Haptics.ImpactFeedbackStyle): void {
  if (!hapticsEnabled) return;
  void Haptics.impactAsync(style).catch(() => {});
}

export function playNotification(type: Haptics.NotificationFeedbackType): void {
  if (!hapticsEnabled) return;
  void Haptics.notificationAsync(type).catch(() => {});
}
