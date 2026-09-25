import { access } from "./access";
import { adventurer } from "./adventurer";
import { common } from "./common";
import { guardian } from "./guardian";

export const pt = { ...common, access, guardian, adventurer };
