import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/lib/supabase";

export default function LogIn() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogIn() {
    setError(null);
    setSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      Alert.alert("Enter your email first", "Type your email above, then tap Forgot password again.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
      Alert.alert("Couldn't send reset email", resetError.message);
    } else {
      Alert.alert("Check your email", `We sent a password reset link to ${email}.`);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Log in</ThemedText>

        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable onPress={handleForgotPassword}>
          <ThemedText type="link" themeColor="textSecondary">
            Forgot password?
          </ThemedText>
        </Pressable>

        {error && (
          <ThemedText type="small" themeColor="textSecondary">
            {error}
          </ThemedText>
        )}

        <Pressable
          disabled={!email || !password || submitting}
          onPress={handleLogIn}
          style={[
            styles.button,
            styles.primaryButton,
            (!email || !password || submitting) && styles.buttonDisabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText type="smallBold" style={styles.primaryButtonText}>
              Log in
            </ThemedText>
          )}
        </Pressable>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <ThemedText type="link" themeColor="textSecondary">
              Don’t have an account? Sign up
            </ThemedText>
          </Pressable>
        </Link>
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
    backgroundColor: "#3c87f7",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
