"use client"

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react"
import { t as translate } from "@/lib/i18n/messages"
import {
  DEFAULT_LOCALE,
  getBrowserLocales,
  getInitialLocale,
  getPreferredLocale,
  getStoredLocale,
  isSupportedLocale,
  PREFERRED_LOCALE_STORAGE_KEY,
} from "@/lib/i18n/utils"
import type { SupportedLocale } from "@/lib/i18n/locale-registry"

export interface I18nContextValue {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(getInitialLocale)

  useEffect(() => {
    const stored = getStoredLocale()
    if (stored) {
      setLocaleState(stored)
      return
    }

    const browserLocales = getBrowserLocales()
    const preferred = getPreferredLocale(null, browserLocales)
    setLocaleState(preferred)
  }, [])

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREFERRED_LOCALE_STORAGE_KEY, newLocale)
    }
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(locale, key, params)
    },
    [locale],
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}
