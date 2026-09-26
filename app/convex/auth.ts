import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

import { PasswordReset } from "./passwordReset";

const password = Password({
  reset: PasswordReset,
  profile(params: Record<string, unknown>) {
    return {
      email: params.email as string,
      name: ((params.name as string) ?? "").trim().slice(0, 24) || "Guardião",
    };
  },
});

// "Esqueci minha senha" answers the same for unknown emails as for known ones (no code is
// sent), so the reset request can't be used to probe which emails have an account.
const authorizePassword = password.authorize;
password.authorize = async (params, ctx) => {
  try {
    return await authorizePassword(params, ctx);
  } catch (e) {
    if (params.flow === "reset" && e instanceof Error && e.message.includes("InvalidAccountId")) return null;
    throw e;
  }
};

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Guardians sign in with email + password; "Esqueci minha senha" emails a code (flow "reset").
    password,
    // A child's phone signs in anonymously, then claims a pairing code (family.claimPairingCode).
    Anonymous,
  ],
});
