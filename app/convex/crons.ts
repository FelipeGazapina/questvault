import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/** Check for new daily / weekly / monthly quest hands and notify PWA subscribers. */
crons.hourly(
  "period quest push notifications",
  { minuteUTC: 5 },
  internal.push.runPeriodPushCron,
);

export default crons;
