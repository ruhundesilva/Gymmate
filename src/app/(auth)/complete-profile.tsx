import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useUsernameStatus } from "@/lib/use-username-status";

export default function CompleteProfile() {
  const theme = useTheme();
  const { session, recheckProfile } = useAuth();
  const [username, setUsername] = useState("");
  const usernameStatus = useUsernameStatus(username);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = usernameStatus === "available";

  async function handleSave() {
    if (!session) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", session.user.id);
      if (updateError) throw updateError;
      await recheckProfile();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Finish your profile</ThemedText>
        <ThemedText themeColor="textSecondary">
          Pick a username to continue.
        </ThemedText>

        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Username"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          value={username}
          onChangeText={(text) => setUsername(text.toLowerCase())}
        />
        {usernameStatus === "checking" && <ActivityIndicator />}
        {usernameStatus === "invalid" && (
          <ThemedText type="small" themeColor="textSecondary">
            3-20 characters: lowercase letters, numbers, underscore.
          </ThemedText>
        )}
        {usernameStatus === "taken" && (
          <ThemedText type="small" themeColor="textSecondary">
            That username is taken.
          </ThemedText>
        )}

        {error && (
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        )}

        <Pressable
          disabled={!canSubmit || submitting}
          onPress={handleSave}
          style={[
            styles.button,
            styles.primaryButton,
            (!canSubmit || submitting) && styles.buttonDisabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText type="smallBold" style={styles.primaryButtonText}>
              Continue
            </ThemedText>
          )}
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
  },
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: "#2E86A6",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
