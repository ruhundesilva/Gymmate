import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { checkPassword, isPasswordStrong, type PasswordRequirement } from "@/lib/password";
import { supabase } from "@/lib/supabase";
import { useUsernameStatus } from "@/lib/use-username-status";

const REQUIREMENT_LABELS: Record<PasswordRequirement, string> = {
  minLength: "8+ characters",
  maxLength: "under 64 characters",
  upper: "an uppercase letter",
  lower: "a lowercase letter",
  number: "a number",
  special: "a special character",
  notCommon: "not a commonly used password",
  notPersonal: "not your username or email",
};

export default function SignUp() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const usernameStatus = useUsernameStatus(username);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const failedRequirements = checkPassword(password, [username, email.split("@")[0]]);
  const canSubmit =
    email.length > 0 &&
    isPasswordStrong(password, [username, email.split("@")[0]]) &&
    passwordsMatch &&
    usernameStatus === "available";

  async function handleSignUp() {
    setError(null);
    setSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (signUpError) throw signUpError;
      if (!data.session) setCheckEmail(true);
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (checkEmail) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title">Check your email</ThemedText>
          <ThemedText themeColor="textSecondary">
            We sent a confirmation link to {email}. Log in once you’ve confirmed.
          </ThemedText>
          <Link href="/(auth)/log-in" asChild>
            <Pressable style={StyleSheet.flatten([styles.button, styles.primaryButton])}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Go to log in
              </ThemedText>
            </Pressable>
          </Link>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <ThemedText type="link">‹ Back</ThemedText>
        </Pressable>

        <ThemedText type="title">Sign up</ThemedText>

        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Username"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          textContentType="oneTimeCode"
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
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="oneTimeCode"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          textContentType="oneTimeCode"
          value={password}
          onChangeText={setPassword}
        />
        {password.length > 0 && failedRequirements.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            Needs {failedRequirements.map((r) => REQUIREMENT_LABELS[r]).join(", ")}.
          </ThemedText>
        )}
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Confirm password"
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
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        )}

        <Pressable
          disabled={!canSubmit || submitting}
          onPress={handleSignUp}
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
              Sign up
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
