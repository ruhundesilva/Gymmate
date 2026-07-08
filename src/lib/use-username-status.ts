import { useEffect, useState } from "react";

import { isUsernameAvailable, USERNAME_RE } from "./username";

export type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type AsyncStatus = "idle" | "checking" | "available" | "taken";

export function useUsernameStatus(username: string): UsernameStatus {
  const [asyncStatus, setAsyncStatus] = useState<AsyncStatus>("idle");
  const formatValid = username.length > 0 && USERNAME_RE.test(username);

  useEffect(() => {
    if (!formatValid) return;
    const handle = setTimeout(async () => {
      const available = await isUsernameAvailable(username);
      setAsyncStatus(available ? "available" : "taken");
    }, 400);
    return () => {
      clearTimeout(handle);
      setAsyncStatus("idle");
    };
  }, [username, formatValid]);

  if (username.length === 0) return "idle";
  if (!formatValid) return "invalid";
  return asyncStatus === "idle" ? "checking" : asyncStatus;
}
