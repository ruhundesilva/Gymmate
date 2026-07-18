// Baseline password policy most consumer apps enforce at sign-up: length +
// character-class composition, plus rejecting the passwords attackers try
// first (common/breached lists) and passwords built from the user's own
// identity. NIST 800-63B additionally recommends checking against a live
// breach corpus (e.g. the HaveIBeenPwned k-anonymity API) instead of a
// static list — worth adding if this needs to be production-grade later.
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

export type PasswordRequirement =
  | "minLength"
  | "maxLength"
  | "upper"
  | "lower"
  | "number"
  | "special"
  | "notCommon"
  | "notPersonal";

export function checkPassword(
  password: string,
  personalInfo: string[] = []
): PasswordRequirement[] {
  const failed: PasswordRequirement[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) failed.push("minLength");
  if (password.length > PASSWORD_MAX_LENGTH) failed.push("maxLength");
  if (!/[A-Z]/.test(password)) failed.push("upper");
  if (!/[a-z]/.test(password)) failed.push("lower");
  if (!/[0-9]/.test(password)) failed.push("number");
  if (!/[^A-Za-z0-9]/.test(password)) failed.push("special");
  if (COMMON_PASSWORDS.has(password.toLowerCase())) failed.push("notCommon");

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
