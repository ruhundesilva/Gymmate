import { Stack } from "expo-router";

import { useAuth } from "@/lib/auth-context";

export default function AuthLayout() {
  const { session, needsProfileCompletion } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="log-in" />
        <Stack.Screen name="verify-email" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && needsProfileCompletion}>
        <Stack.Screen name="complete-profile" />
      </Stack.Protected>
    </Stack>
  );
}
