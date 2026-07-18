import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { Alert } from "react-native";

import { supabase } from "./supabase";

// handle_new_user (supabase/migrations) falls back to `user_<8 hex chars>`
// when sign-up didn't supply a username (Apple sign-in's first-time case).
const PLACEHOLDER_USERNAME_RE = /^user_[0-9a-f]{8}$/i;

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  needsProfileCompletion: boolean;
  recheckProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  needsProfileCompletion: false,
  recheckProfile: async () => {},
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  const checkProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .single();
    setNeedsProfileCompletion(
      !!data && PLACEHOLDER_USERNAME_RE.test(data.username)
    );
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await checkProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          setLoading(true);
          checkProfile(newSession.user.id).finally(() => setLoading(false));
        } else {
          setNeedsProfileCompletion(false);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, [checkProfile]);

  // Email confirmation / password reset links deep-link back into the app
  // (gymmates://) carrying a PKCE `code` param — exchange it for a session;
  // onAuthStateChange above then picks up the resulting sign-in.
  useEffect(() => {
    function handleUrl(url: string) {
      if (!url.includes("code=")) return;
      supabase.auth.exchangeCodeForSession(url).catch(() => {
        Alert.alert(
          "Link expired",
          "That link is no longer valid. Request a new confirmation or reset email and try again."
        );
      });
    }

    Linking.getInitialURL().then((url) => url && handleUrl(url));
    const subscription = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const recheckProfile = useCallback(async () => {
    if (session) await checkProfile(session.user.id);
  }, [session, checkProfile]);

  return (
    <AuthContext.Provider
      value={{ session, loading, needsProfileCompletion, recheckProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
