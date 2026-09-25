import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export { requireUser } from "./access";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId ? await ctx.db.get(userId) : null;
  },
});
