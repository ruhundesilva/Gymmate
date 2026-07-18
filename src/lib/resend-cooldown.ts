// Matches Supabase's SMTP "minimum interval per user" setting.
export const RESEND_COOLDOWN_SECONDS = 60;

// GoTrue's rate-limit message: "For security purposes, you can only request
// this after 46 seconds." Prefer the server's actual remaining time over our
// local guess when it's available.
export function secondsFromRateLimitMessage(message: string): number | null {
  const match = message.match(/(\d+)\s*seconds?/i);
  return match ? Number(match[1]) : null;
}
