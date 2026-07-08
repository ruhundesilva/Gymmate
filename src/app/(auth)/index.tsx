import * as AppleAuthentication from "expo-apple-authentication";
import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

export default function Welcome() {
  const [appleBusy, setAppleBusy] = useState(false);

  async function handleAppleSignIn() {
    setAppleBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("No identity token returned by Apple");

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (error) throw error;
    } catch (err: any) {
      if (err.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Sign in with Apple failed", err.message ?? String(err));
      }
    } finally {
      setAppleBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.hero}>
          <ThemedText type="title">GymMates</ThemedText>
          <ThemedText type="subtitle" themeColor="textSecondary" style={styles.tagline}>
            Strava for the gym.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.actions}>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={[styles.button, styles.primaryButton]}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Sign up
              </ThemedText>
            </Pressable>
          </Link>

          <Link href="/(auth)/log-in" asChild>
            <Pressable style={[styles.button, styles.secondaryButton]}>
              <ThemedText type="smallBold">Log in</ThemedText>
            </Pressable>
          </Link>

          {Platform.OS === "ios" && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={appleBusy ? () => {} : handleAppleSignIn}
            />
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
  },
  tagline: {
    textAlign: "center",
  },
  actions: {
    gap: Spacing.three,
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#3c87f7",
  },
  appleButton: {
    height: 48,
  },
});
