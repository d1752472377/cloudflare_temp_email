import { MESSAGE_REGISTRY } from "./message-registry"
import type { SupportedLocale } from "./locale-registry"
import { deMessages } from "@/lib/i18n/locales/de"
import { esMessages } from "@/lib/i18n/locales/es"
import { jaMessages } from "@/lib/i18n/locales/ja"
import { ptBRMessages } from "@/lib/i18n/locales/ptBR"

type LocaleTree = Record<string, unknown>

type SourceLocale = "zh" | "en"
type AdditionalLocale = Exclude<SupportedLocale, SourceLocale>

const additionalLocaleSources: Record<AdditionalLocale, Record<string, string>> = {
  es: esMessages,
  "pt-BR": ptBRMessages,
  ja: jaMessages,
  de: deMessages,
}

const setNestedValue = (target: LocaleTree, path: string, value: unknown) => {
  const segments = path.split(".")
  let current: LocaleTree = target

  for (const segment of segments.slice(0, -1)) {
    const existing = current[segment]
    if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
      current = existing as LocaleTree
      continue
    }
    current[segment] = {}
    current = current[segment] as LocaleTree
  }

  current[segments.at(-1) as string] = value
}

const buildSourceLocaleMessages = (locale: SourceLocale) => {
  const messages: LocaleTree = {}
  const namespaces = Object.keys(MESSAGE_REGISTRY) as Array<keyof typeof MESSAGE_REGISTRY>

  for (const namespace of namespaces) {
    const keys = Object.keys(MESSAGE_REGISTRY[namespace]) as Array<
      keyof (typeof MESSAGE_REGISTRY)[typeof namespace]
    >
    for (const key of keys) {
      const entry = MESSAGE_REGISTRY[namespace][key]
      const message = entry[locale]
      if (message === undefined) continue
      setNestedValue(messages, `${namespace}.${key}`, message)
    }
  }

  return messages
}

const buildAdditionalLocaleMessages = (locale: AdditionalLocale) => {
  const messages: LocaleTree = {}

  for (const [key, value] of Object.entries(additionalLocaleSources[locale])) {
    setNestedValue(messages, key, value)
  }

  return messages
}

export const I18N_MESSAGES: Record<SupportedLocale, LocaleTree> = {
  zh: buildSourceLocaleMessages("zh"),
  en: buildSourceLocaleMessages("en"),
  es: buildAdditionalLocaleMessages("es"),
  "pt-BR": buildAdditionalLocaleMessages("pt-BR"),
  ja: buildAdditionalLocaleMessages("ja"),
  de: buildAdditionalLocaleMessages("de"),
}

function resolveNestedValue(obj: LocaleTree, path: string): string | undefined {
  const segments = path.split(".")
  let current: unknown = obj

  for (const segment of segments) {
    if (typeof current !== "object" || current === null) return undefined
    current = (current as LocaleTree)[segment]
  }

  return typeof current === "string" ? current : undefined
}

export function t(
  locale: SupportedLocale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const messages = I18N_MESSAGES[locale]
  let message = resolveNestedValue(messages, key)

  if (message === undefined && locale !== "zh") {
    message = resolveNestedValue(I18N_MESSAGES.zh, key)
  }

  if (message === undefined) {
    // Return the last segment of the key as a readable fallback
    const segments = key.split(".")
    return segments[segments.length - 1] || key
  }

  if (params) {
    return message.replace(/\{(\w+)\}/g, (_, name) => {
      return params[name] !== undefined ? String(params[name]) : `{${name}}`
    })
  }

  return message
}
