"use client"

import { useContext } from "react"
import { I18nContext, type I18nContextValue } from "@/contexts/i18n-context"

export function useScopedI18n(
  namespace: string,
): {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: I18nContextValue["locale"]
} {
  const { t: globalT, locale } = useContext(I18nContext)

  const t = (key: string, params?: Record<string, string | number>) => {
    return globalT(`${namespace}.${key}`, params)
  }

  return { t, locale }
}
