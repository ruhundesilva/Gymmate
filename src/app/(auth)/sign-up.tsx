import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PasswordChecklist } from "@/components/password-checklist";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { isPasswordStrong } from "@/lib/password";
import { supabase } from "@/lib/supabase";
import { useUsernameStatus } from "@/lib/use-username-status";

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

  const passwordsMatch = password === confirmPassword;
  const personalInfo = [username, email.split("@")[0]];
  const canSubmit =
    email.length > 0 &&
    isPasswordStrong(password, personalInfo) &&
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
      if (!data.session) router.push({ pathname: "/(auth)/verify-email", params: { email } });
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
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
        <PasswordChecklist password={password} personalInfo={personalInfo} />
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
          <ThemedText type="small" themeColor="error">
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
