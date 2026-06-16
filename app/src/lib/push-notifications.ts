export type PushSubscriptionPayload = {
  endpoint: string;
  p256dh: string;
  auth: string;
  locale?: string;
};

export function isPushSupported(): boolean {
  return false;
}

export async function getCurrentPushSubscription(): Promise<PushSubscriptionPayload | null> {
  return null;
}

export async function subscribeToPush(_locale?: string): Promise<PushSubscriptionPayload | null> {
  return null;
}

export async function unsubscribeFromPush(): Promise<void> {
  /* native: no-op */
}
