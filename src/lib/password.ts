// Password policy per NIST SP 800-63B §5.1.1 (Memorized Secrets), the
// current industry-standard guidance (also reflected in the OWASP
// Authentication Cheat Sheet). Key departures from older "complexity rule"
// policies, deliberate per the standard:
//   - No required mix of upper/lower/number/special — composition rules
//     push users toward predictable patterns (Password1!) without adding
//     real entropy, and NIST explicitly recommends against them.
//   - No periodic expiry/rotation — not implemented here, and shouldn't be.
//   - Length is the primary strength signal: 8 min, 64 max allowed.
//   - Verifiers SHALL check against a list of commonly-used, expected, or
//     compromised passwords; repetitive/sequential characters; and
//     context-specific words (service name, username, email). A static
//     blocklist is the offline stand-in for NIST's "compromised passwords"
//     check — the production-grade version is a live breach corpus (e.g.
//     the HaveIBeenPwned k-anonymity API).
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64; // bcrypt silently truncates past 72 bytes

// Top of every real-world breach-frequency list (RockYou, HaveIBeenPwned, NCSC).
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789",
  "1234567890", "qwerty123", "qwertyuiop", "letmein123", "welcome123",
  "iloveyou1", "admin1234", "changeme1", "trustno1", "monkey123",
  "dragon123", "football1", "baseball1", "sunshine1", "princess1",
  "abc123456", "passw0rd", "p@ssw0rd", "starwars1", "superman1",
]);

// NIST's own examples of what to reject: "aaaaaa" (repeated), "1234abcd"
// (sequential). Catches runs of 4+ identical or consecutive-ascending/
// -descending characters (numeric or alphabetic).
function hasRepeatedOrSequentialRun(password: string, minRun = 4): boolean {
  if (new RegExp(`(.)\\1{${minRun - 1},}`).test(password)) return true;

  let asc = 1;
  let desc = 1;
  for (let i = 1; i < password.length; i++) {
    const delta = password.charCodeAt(i) - password.charCodeAt(i - 1);
    asc = delta === 1 ? asc + 1 : 1;
    desc = delta === -1 ? desc + 1 : 1;
    if (asc >= minRun || desc >= minRun) return true;
  }
  return false;
}

export type PasswordRequirement =
  | "minLength"
  | "maxLength"
  | "notCommon"
  | "notRepetitive"
  | "notPersonal";

export function checkPassword(
  password: string,
  personalInfo: string[] = []
): PasswordRequirement[] {
  const failed: PasswordRequirement[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) failed.push("minLength");
  if (password.length > PASSWORD_MAX_LENGTH) failed.push("maxLength");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) failed.push("notCommon");
  if (hasRepeatedOrSequentialRun(password)) failed.push("notRepetitive");

  const lower = password.toLowerCase();
  if (
    personalInfo.some((info) => info.length >= 3 && lower.includes(info.toLowerCase()))
  ) {
    failed.push("notPersonal");
  }

  return failed;
}

export function isPasswordStrong(password: string, personalInfo: string[] = []): boolean {
  return checkPassword(password, personalInfo).length === 0;
}
