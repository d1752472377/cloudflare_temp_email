<script setup>
import { darkTheme, NGlobalStyle, zhCN } from 'naive-ui'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useScript } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from './store'
import { useIsMobile } from './utils/composables'
import Header from './views/Header.vue'
import Footer from './views/Footer.vue'
import UserLogin from './views/user/UserLogin.vue'
import { api } from './api'

const {
  isDark, loading, useSideMargin, telegramApp, isTelegram,
  openSettings, userSettings,
} = useGlobalState()
const adClient = import.meta.env.VITE_GOOGLE_AD_CLIENT
const adSlot = import.meta.env.VITE_GOOGLE_AD_SLOT
const { locale } = useI18n({})
const route = useRoute()
const theme = computed(() => (isDark.value ? darkTheme : null))
const localeConfig = computed(() => (locale.value === 'zh' ? zhCN : null))
const isMobile = useIsMobile()
const themeOverrides = computed(() => ({
  common: {
    fontSize: '16px',
    fontSizeMedium: '16px',
    fontSizeLarge: '18px',
    fontSizeSmall: '14px',
    fontSizeTiny: '12px',
  },
}))
const showSideMargin = computed(() => !isMobile.value && useSideMargin.value)
const showAd = computed(() => !isMobile.value && adClient && adSlot)
const gridMaxCols = computed(() => (showAd.value ? 8 : 12))
const isHomeWorkspaceRoute = computed(() => /^\/(?:en|zh)?\/?$/.test(route.path))
const isOauthCallbackRoute = computed(() => /^\/(?:en|zh)?\/user\/oauth2\/callback\/?$/.test(route.path))
const isAdminRoute = computed(() => /^\/(?:en|zh)?\/admin\/?$/.test(route.path))
const shouldShowUserLoginGate = computed(() => (
  openSettings.value.fetched
  && userSettings.value.fetched
  && openSettings.value.requireUserLogin
  && !userSettings.value.user_email
  && !isAdminRoute.value
  && !isOauthCallbackRoute.value
))

if (showAd.value) {
  useScript({
    src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`,
    async: true,
    crossorigin: 'anonymous',
  })
}

onMounted(async () => {
  try {
    await api.getOpenSettings()
    await api.getUserOpenSettings()
    await api.getUserSettings()
  } catch (error) {
    console.error(error)
  }

  const token = import.meta.env.VITE_CF_WEB_ANALY_TOKEN
  const exist = document.querySelector('script[src="https://static.cloudflareinsights.com/beacon.min.js"]') !== null
  if (token && !exist) {
    const script = document.createElement('script')
    script.defer = true
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    script.dataset.cfBeacon = `{ token: ${token} }`
    document.body.appendChild(script)
  }

  if (showAd.value) {
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    ;(window.adsbygoogle = window.adsbygoogle || []).push({})
  }

  const enableTelegram = import.meta.env.VITE_IS_TELEGRAM
  if (
    (typeof enableTelegram === 'boolean' && enableTelegram === true)
    || (typeof enableTelegram === 'string' && enableTelegram === 'true')
  ) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://telegram.org/js/telegram-web-app.js'
      script.onload = resolve
      script.onerror = reject
      document.body.appendChild(script)
    })
    telegramApp.value = window.Telegram?.WebApp || {}
    isTelegram.value = !!window.Telegram?.WebApp?.initData
  }
})
</script>

<template>
  <n-config-provider :locale="localeConfig" :theme="theme" :theme-overrides="themeOverrides">
    <n-global-style />
    <n-spin description="loading..." :show="loading">
      <n-notification-provider container-style="margin-top: 60px;">
        <n-message-provider container-style="margin-top: 20px;">
          <template v-if="shouldShowUserLoginGate">
            <div class="auth-gate-shell">
              <div class="auth-gate-panel auth-gate-copy">
                <div class="auth-gate-badge">DOVISLAB</div>
                <h1 class="auth-gate-title">{{ openSettings.title || 'Temp Mail Workspace' }}</h1>
                <p class="auth-gate-desc">
                  {{ locale === 'zh'
                    ? '请先登录用户账号，再创建、绑定和管理邮箱地址。'
                    : 'Sign in with your user account first, then create, bind, and manage mailbox addresses.' }}
                </p>
                <ul class="auth-gate-points">
                  <li>{{ locale === 'zh' ? '统一入口，先登录用户账号' : 'One entry point with user account login first' }}</li>
                  <li>{{ locale === 'zh' ? '邮箱地址改为登录后创建或绑定' : 'Mailbox addresses are created or bound after login' }}</li>
                  <li>{{ locale === 'zh' ? '登录后进入完整工作区' : 'Enter the full workspace after login' }}</li>
                </ul>
              </div>
              <div class="auth-gate-panel auth-gate-form">
                <UserLogin />
              </div>
            </div>
          </template>
          <template v-else-if="isHomeWorkspaceRoute">
            <div class="workspace-root">
              <router-view />
            </div>
          </template>
          <template v-else>
            <n-grid x-gap="12" :cols="gridMaxCols">
              <n-gi v-if="showSideMargin" span="1">
                <div class="side" v-if="showAd">
                  <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                    data-ad-format="auto" data-full-width-responsive="true"></ins>
                </div>
              </n-gi>
              <n-gi :span="!showSideMargin ? gridMaxCols : (gridMaxCols - 2)">
                <div class="main">
                  <n-space vertical>
                    <n-layout style="min-height: 80vh;">
                      <Header />
                      <router-view />
                    </n-layout>
                    <Footer />
                  </n-space>
                </div>
              </n-gi>
              <n-gi v-if="showSideMargin" span="1">
                <div class="side" v-if="showAd">
                  <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
                    data-ad-format="auto" data-full-width-responsive="true"></ins>
                </div>
              </n-gi>
            </n-grid>
          </template>
          <n-back-top />
        </n-message-provider>
      </n-notification-provider>
    </n-spin>
  </n-config-provider>
</template>

<style>
.n-switch {
  margin-left: 10px;
  margin-right: 10px;
}
</style>

<style scoped>
.auth-gate-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 460px);
  gap: 24px;
  padding: 32px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  align-items: stretch;
}

.auth-gate-panel {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}

.auth-gate-copy {
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.auth-gate-badge {
  display: inline-flex;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.auth-gate-title {
  margin: 20px 0 12px;
  font-size: 42px;
  line-height: 1.1;
  color: #0f172a;
}

.auth-gate-desc {
  margin: 0;
  max-width: 560px;
  font-size: 18px;
  line-height: 1.7;
  color: #475569;
}

.auth-gate-points {
  margin: 28px 0 0;
  padding-left: 20px;
  color: #334155;
  line-height: 1.9;
  font-size: 16px;
}

.auth-gate-form {
  padding: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-gate-form :deep(.center) {
  width: 100%;
}

.auth-gate-form :deep(.n-tabs) {
  width: 100%;
}

.workspace-root {
  height: 100vh;
  overflow: hidden;
}

.side {
  height: 100vh;
}

.main {
  height: 100vh;
  text-align: center;
}

.n-grid,
.n-gi,
.n-space {
  height: 100%;
}

@media (max-width: 900px) {
  .auth-gate-shell {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .auth-gate-copy {
    padding: 28px 22px;
  }

  .auth-gate-title {
    font-size: 30px;
  }

  .auth-gate-form {
    padding: 18px;
  }
}
</style>
