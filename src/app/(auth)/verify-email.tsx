import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

// Matches Supabase's SMTP "minimum interval per user" setting — the signup
// email was just sent moments before this screen mounts, so start the
// cooldown immediately instead of waiting for a rate-limit error to reveal it.
const RESEND_COOLDOWN_SECONDS = 60;

// GoTrue's rate-limit message: "For security purposes, you can only request
// this after 46 seconds." Prefer the server's actual remaining time over our
// local guess when it's available.
function secondsFromRateLimitMessage(message: string): number | null {
  const match = message.match(/(\d+)\s*seconds?/i);
  return match ? Number(match[1]) : null;
}

export default function VerifyEmail() {
  const theme = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown === 0) return;
    const id = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleVerify() {
    setError(null);
    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (verifyError) throw verifyError;
      // Success updates the session; AuthProvider routes into the app from here.
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    if (resendError) {
      setError(resendError.message);
      setCooldown(secondsFromRateLimitMessage(resendError.message) ?? RESEND_COOLDOWN_SECONDS);
    } else {
      setResent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <ThemedText type="link">‹ Back</ThemedText>
        </Pressable>

        <ThemedText type="title">Enter your code</ThemedText>
        <ThemedText themeColor="textSecondary">
          We sent a confirmation code to {email}.
        </ThemedText>

        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Code"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
        />

        {error && (
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        )}

        <Pressable
          disabled={code.length === 0 || submitting}
          onPress={handleVerify}
          style={[
            styles.button,
            styles.primaryButton,
            (code.length === 0 || submitting) && styles.buttonDisabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText type="smallBold" style={styles.primaryButtonText}>
              Verify
            </ThemedText>
          )}
        </Pressable>

        <Pressable onPress={handleResend} disabled={cooldown > 0}>
          <ThemedText type="link" themeColor="textSecondary">
            {cooldown > 0
              ? `Resend available in ${cooldown}s`
              : resent
                ? "Code resent — check your email"
                : "Didn't get a code? Resend"}
          </ThemedText>
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
  backButton: {
    alignSelf: "flex-start",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: "center",
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
