import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "convex/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export type Me = NonNullable<ReturnType<typeof useMeQuery>>;
export type AdventurerSummary = Me["adventurers"][number];

function useMeQuery() {
  return useQuery(api.family.me, {});
}

/**
 * Which profile this device is playing as.
 * - "guardian": the parent's admin screens.
 * - an adventurer id: that child's screens (on the parent's phone, via "Quem está jogando",
 *   or permanently on a paired child phone).
 */
export type ActiveProfile = "guardian" | Id<"adventurers">;

type Ctx = {
  me: Me | undefined;
  active: ActiveProfile | null;
  ready: boolean;
  enterGuardian: () => void;
  enterAdventurer: (id: Id<"adventurers">) => void;
  leaveProfile: () => void;
};

const ProfileContext = createContext<Ctx | null>(null);
const KEY = "questvault.profile";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const me = useMeQuery();
  const [stored, setStored] = useState<ActiveProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setStored((v as ActiveProfile | null) ?? null))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback((p: ActiveProfile | null) => {
    setStored(p);
    if (p) void AsyncStorage.setItem(KEY, p).catch(() => {});
    else void AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  // A paired child phone is always that child; a guardian's choice must still exist.
  const active: ActiveProfile | null = useMemo(() => {
    if (!me) return null;
    if (me.user.role === "adventurer") return me.deviceAdventurerId;
    if (stored === "guardian") return "guardian";
    if (stored && me.adventurers.some((a) => a._id === stored)) return stored;
    return null;
  }, [me, stored]);

  const value = useMemo<Ctx>(
    () => ({
      me,
      active,
      ready: me !== undefined && loaded,
      enterGuardian: () => persist("guardian"),
      enterAdventurer: (id) => persist(id),
      leaveProfile: () => persist(null),
    }),
    [me, active, loaded, persist],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Ctx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile outside ProfileProvider");
  return ctx;
}

/** The adventurer currently being played (child screens only). */
export function useAdventurer(): AdventurerSummary | null {
  const { me, active } = useProfile();
  if (!me || !active || active === "guardian") return null;
  return me.adventurers.find((a) => a._id === active) ?? null;
}

/** Map a Convex error to a user-facing i18n key under `errors.*` (falls back to generic). */
export function errorKey(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  for (const code of ["NOT_ENOUGH_COINS", "NOT_ENOUGH_TIME", "DAILY_CAP", "SESSION_ACTIVE", "PHOTO_REQUIRED", "REPORT_REQUIRED", "TOO_MANY_ATTEMPTS"]) {
    if (msg.includes(code)) return `errors.${code}`;
  }
  return "errors.generic";
}
