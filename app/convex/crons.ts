import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/** Spawn missions at their appear time, deadline warnings, delivery reminders, daily summary. */
crons.interval("family mission tick", { minutes: 5 }, internal.tick.run);

export default crons;
