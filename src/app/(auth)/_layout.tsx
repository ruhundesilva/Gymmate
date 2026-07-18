import { Stack } from "expo-router";

import { useAuth } from "@/lib/auth-context";

export default function AuthLayout() {
  const { session, needsProfileCompletion, needsPasswordReset } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="log-in" />
        <Stack.Screen name="verify-email" />
      </Stack.Protected>
      {/* Reachable pre-session (navigated to from Log In) and while a
          recovery session exists but the password hasn't been set yet. */}
      <Stack.Protected guard={!session || needsPasswordReset}>
        <Stack.Screen name="reset-password" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !needsPasswordReset && needsProfileCompletion}>
        <Stack.Screen name="complete-profile" />
      </Stack.Protected>
    </Stack>
  );
}
