import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

import { PasswordReset } from "./passwordReset";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Guardians sign in with email + password; "Esqueci minha senha" emails a code (flow "reset").
    Password({
      reset: PasswordReset,
      profile(params: Record<string, unknown>) {
        return {
          email: params.email as string,
          name: ((params.name as string) ?? "").trim().slice(0, 24) || "Guardião",
        };
      },
    }),
    // A child's phone signs in anonymously, then claims a pairing code (family.claimPairingCode).
    Anonymous,
  ],
});
