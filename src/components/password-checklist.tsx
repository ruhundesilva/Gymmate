import { StyleSheet } from "react-native";

import { checkPassword, type PasswordRequirement } from "@/lib/password";
import { Spacing } from "@/constants/theme";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";

const REQUIREMENT_LABELS: Record<PasswordRequirement, string> = {
  minLength: "8+ characters",
  maxLength: "under 64 characters",
  notCommon: "not a commonly used password",
  notRepetitive: "no repeated or sequential characters (e.g. aaaa, 1234)",
  notPersonal: "not your username or email",
};

// maxLength omitted: a 64-char ceiling isn't a meaningful thing to checklist for users.
const CHECKLIST: PasswordRequirement[] = ["minLength", "notCommon", "notRepetitive", "notPersonal"];

type Props = {
  password: string;
  personalInfo?: string[];
};

export function PasswordChecklist({ password, personalInfo = [] }: Props) {
  if (password.length === 0) return null;

  const failed = checkPassword(password, personalInfo);

  return (
    <ThemedView style={styles.checklist}>
      {CHECKLIST.map((requirement) => {
        const passed = !failed.includes(requirement);
        return (
          <ThemedText
            key={requirement}
            type="small"
            style={{ color: passed ? "#22C55E" : "#EF4444" }}
          >
            {passed ? "✓" : "✗"} {REQUIREMENT_LABELS[requirement]}
          </ThemedText>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  checklist: {
    gap: Spacing.half,
  },
});
