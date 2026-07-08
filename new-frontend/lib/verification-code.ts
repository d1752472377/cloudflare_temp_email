/**
 * Extract verification codes from email text content.
 * Returns an array of found codes with their context.
 */

const CODE_PATTERNS = [
  // Chinese: 验证码: 123456, 验证码：123456
  { regex: /验证码[：:\s]*([A-Za-z0-9]{4,8})/i, label: "验证码" },
  // English: verification code: ABC123, code: 123456
  { regex: /(?:verification\s*code|code|otp|pin)[：:\s]*([A-Za-z0-9]{4,8})\b/i, label: "验证码" },
  // Standalone 6-digit number (most common for verification codes)
  { regex: /(?<!\w)(\d{6})(?!\w)/, label: "验证码" },
]

export type VerificationCode = {
  code: string
  label: string
}

export function extractVerificationCodes(text: string): VerificationCode[] {
  const found = new Map<string, VerificationCode>()

  for (const { regex, label } of CODE_PATTERNS) {
    const match = text.match(regex)
    if (match && match[1]) {
      const code = match[1].trim()
      if (code.length >= 4 && !found.has(code)) {
        found.set(code, { code, label })
      }
    }
  }

  return Array.from(found.values())
}
