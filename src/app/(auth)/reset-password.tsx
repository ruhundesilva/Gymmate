import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PasswordChecklist } from "@/components/password-checklist";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useCountdown } from "@/hooks/use-countdown";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";
import { isPasswordStrong } from "@/lib/password";
import { RESEND_COOLDOWN_SECONDS, secondsFromRateLimitMessage } from "@/lib/resend-cooldown";
import { supabase } from "@/lib/supabase";

export default function ResetPassword() {
  const theme = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { clearPasswordReset } = useAuth();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useCountdown(RESEND_COOLDOWN_SECONDS);

  const passwordsMatch = password === confirmPassword;
  const personalInfo = [email.split("@")[0]];
  const canSubmit = code.length > 0 && isPasswordStrong(password, personalInfo) && passwordsMatch;

  async function handleReset() {
    setError(null);
    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      clearPasswordReset();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    // resend() only supports "signup" | "email_change" — recovery emails are
    // re-sent by calling resetPasswordForEmail again.
    const { error: resendError } = await supabase.auth.resetPasswordForEmail(email);
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

        <ThemedText type="title">Reset your password</ThemedText>
        <ThemedText themeColor="textSecondary">
          Enter the code we sent to {email} and choose a new password.
        </ThemedText>

        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="123456"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
        />

        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="New password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          textContentType="oneTimeCode"
          value={password}
          onChangeText={setPassword}
        />
        <PasswordChecklist password={password} personalInfo={personalInfo} />
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Confirm new password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          textContentType="oneTimeCode"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {confirmPassword.length > 0 && !passwordsMatch && (
          <ThemedText type="small" themeColor="textSecondary">
            Passwords don’t match.
          </ThemedText>
        )}

        {error && (
          <ThemedText type="small" themeColor="error">
            {error}
          </ThemedText>
        )}

        <Pressable
          disabled={!canSubmit || submitting}
          onPress={handleReset}
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
              Reset password
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
