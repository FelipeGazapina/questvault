import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, type ReactNode } from "react";

import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

/** Initializes game state (starter quests, balances) once after sign-in. */
export function UserProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const ensure = useMutation(api.users.ensureGameUser);

  useEffect(() => {
    if (isAuthenticated) {
      void ensure({});
    }
  }, [isAuthenticated, ensure]);

  return <>{children}</>;
}

export function useUser(): Doc<"users"> | null | undefined {
  return useQuery(api.users.current, {});
}
