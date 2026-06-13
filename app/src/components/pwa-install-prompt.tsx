import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { C, FONT } from "@/lib/palette";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Web-only stub — native builds omit the install UI. */
export function PwaInstallPrompt() {
  return null;
}
