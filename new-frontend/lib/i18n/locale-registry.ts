export const LOCALE_REGISTRY = [
  { locale: "zh", label: "中文", browserMatches: ["zh"] },
  { locale: "en", label: "English", browserMatches: ["en"] },
  { locale: "es", label: "Español", browserMatches: ["es"] },
  { locale: "pt-BR", label: "Português (Brasil)", browserMatches: ["pt"] },
  { locale: "ja", label: "日本語", browserMatches: ["ja"] },
  { locale: "de", label: "Deutsch", browserMatches: ["de"] },
] as const

export type SupportedLocale = (typeof LOCALE_REGISTRY)[number]["locale"]

export const SUPPORTED_LOCALES = LOCALE_REGISTRY.map(
  ({ locale }) => locale,
) as SupportedLocale[]

const localeRegistryMap = Object.fromEntries(
  LOCALE_REGISTRY.map((entry) => [entry.locale, entry]),
) as Record<SupportedLocale, (typeof LOCALE_REGISTRY)[number]>

export const getLocaleRegistryEntry = (locale: SupportedLocale) => {
  return localeRegistryMap[locale]
}

export const getLocaleLabel = (locale: SupportedLocale) => {
  return getLocaleRegistryEntry(locale).label
}

export const getLocaleOptions = () => {
  return LOCALE_REGISTRY.map(({ locale, label }) => ({
    label,
    value: locale,
    key: locale,
  }))
}
