import { SUPPORTED_LOCALES } from "./locale-registry"
import type { SupportedLocale } from "./locale-registry"

export const DEFAULT_LOCALE: SupportedLocale = "zh"
export const FALLBACK_LOCALE: SupportedLocale = "zh"
export const PREFERRED_LOCALE_STORAGE_KEY = "preferredLocale"

export const isSupportedLocale = (
  locale: unknown,
): locale is SupportedLocale => {
  return (
    typeof locale === "string" &&
    SUPPORTED_LOCALES.includes(locale as SupportedLocale)
  )
}

export const resolveSupportedLocale = (
  locale: string | null | undefined,
): SupportedLocale | null => {
  if (!locale) return null
  const normalizedLocale = locale.trim().toLowerCase()

  for (const supportedLocale of SUPPORTED_LOCALES) {
    if (supportedLocale.toLowerCase() === normalizedLocale) {
      return supportedLocale
    }
  }

  return null
}

export const matchSupportedLocale = (
  locale: string | null | undefined,
): SupportedLocale | null => {
  if (!locale) return null
  const normalizedLocale = locale.trim().toLowerCase()

  const matchMap: Record<string, SupportedLocale> = {
    zh: "zh",
    en: "en",
    es: "es",
    pt: "pt-BR",
    ja: "ja",
    de: "de",
  }

  const primary = normalizedLocale.split("-")[0]
  return matchMap[primary] ?? null
}

export const getBrowserLocales = (): string[] => {
  if (typeof navigator === "undefined") return []

  const locales =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language]

  return locales.filter(Boolean)
}

export const getStoredLocale = (): SupportedLocale | "" => {
  if (typeof window === "undefined") return ""

  const locale = window.localStorage.getItem(PREFERRED_LOCALE_STORAGE_KEY)
  return isSupportedLocale(locale) ? locale : ""
}

export const getPreferredLocale = (
  storedLocale: string | null | undefined,
  browserLocales: string[] = [],
): SupportedLocale => {
  if (isSupportedLocale(storedLocale)) return storedLocale

  for (const browserLocale of browserLocales) {
    const matchedLocale = matchSupportedLocale(browserLocale)
    if (matchedLocale) return matchedLocale
  }

  return FALLBACK_LOCALE
}

export const getInitialLocale = () => DEFAULT_LOCALE
