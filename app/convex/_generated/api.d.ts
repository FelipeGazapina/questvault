/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as apps from "../apps.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as family from "../family.js";
import type * as http from "../http.js";
import type * as missions from "../missions.js";
import type * as notify from "../notify.js";
import type * as push from "../push.js";
import type * as pushActions from "../pushActions.js";
import type * as pushMessages from "../pushMessages.js";
import type * as rewards from "../rewards.js";
import type * as rules from "../rules.js";
import type * as tick from "../tick.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  apps: typeof apps;
  auth: typeof auth;
  crons: typeof crons;
  family: typeof family;
  http: typeof http;
  missions: typeof missions;
  notify: typeof notify;
  push: typeof push;
  pushActions: typeof pushActions;
  pushMessages: typeof pushMessages;
  rewards: typeof rewards;
  rules: typeof rules;
  tick: typeof tick;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
