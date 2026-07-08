/**
 * SHA-256 哈希工具
 * 与旧前端 frontend/src/utils/index.ts 中的 hashPassword 保持一致的实现
 * 使用 Web Crypto API，输出小写十六进制字符串
 */

/**
 * 对密码进行 SHA-256 哈希
 * 与后端存储密码的格式保持一致（后端 normalizePasswordForStorage 对十六进制摘要原样存储）
 */
export async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  )
  const hashArray = Array.from(new Uint8Array(digest))
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("")
}
