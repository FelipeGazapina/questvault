import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params: Record<string, unknown>) {
        return {
          email: params.email as string,
          name: ((params.name as string) ?? "HERO").trim().slice(0, 12).toUpperCase() || "HERO",
        };
      },
    }),
  ],
});
