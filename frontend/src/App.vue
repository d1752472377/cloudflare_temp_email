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
const gateCopy = computed(() => (
  locale.value === 'zh'
    ? {
      badge: 'DOVISLAB WORKSPACE',
      title: openSettings.value.title || '临时邮箱工作台',
      desc: '先登录用户账户，再统一管理邮箱地址、收件流程、发送权限与账户安全设置。',
      points: [
        '统一入口，避免匿名状态下的功能割裂',
        '登录后继续创建、绑定和管理邮箱地址',
        'Passkey、OAuth2 与验证码流程集中在一个界面',
      ],
      stats: [
        { title: '账户优先', text: '登录后进入完整工作区' },
        { title: '安全验证', text: '支持 Turnstile、Passkey 和 OAuth2' },
      ],
      asideTitle: '统一访问入口',
      asideDesc: '完成身份验证后，再进入完整的 Cloudflare Workers 邮箱工作区。',
    }
    : {
      badge: 'DOVISLAB WORKSPACE',
      title: openSettings.value.title || 'Temp Mail Workspace',
      desc: 'Sign in first, then manage addresses, inbox workflows, sending access, and account security in one place.',
      points: [
        'One account-first entry instead of fragmented anonymous flows',
        'Create, bind, and manage mailbox addresses after authentication',
        'Passkey, OAuth2, and verification flows in one consistent workspace',
      ],
      stats: [
        { title: 'Account First', text: 'Unlock the full workspace after login' },
        { title: 'Security Ready', text: 'Turnstile, Passkey, and OAuth2 supported' },
      ],
      asideTitle: 'Unified Access',
      asideDesc: 'Authenticate once and continue with the full Cloudflare Workers mail workspace.',
    }
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
              <div class="auth-gate-blob auth-gate-blob-a"></div>
              <div class="auth-gate-blob auth-gate-blob-b"></div>
              <div class="auth-gate-panel auth-gate-copy">
                <div class="auth-gate-badge">{{ gateCopy.badge }}</div>
                <h1 class="auth-gate-title">{{ gateCopy.title }}</h1>
                <p class="auth-gate-desc">{{ gateCopy.desc }}</p>
                <div class="auth-gate-stats">
                  <div v-for="item in gateCopy.stats" :key="item.title" class="auth-gate-stat">
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.text }}</span>
                  </div>
                </div>
                <ul class="auth-gate-points">
                  <li v-for="point in gateCopy.points" :key="point">{{ point }}</li>
                </ul>
                <div class="auth-gate-aside">
                  <span class="auth-gate-aside-label">{{ gateCopy.asideTitle }}</span>
                  <p>{{ gateCopy.asideDesc }}</p>
                </div>
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
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 500px);
  gap: 28px;
  padding: 28px;
  background:
    radial-gradient(circle at top left, rgba(249, 115, 22, 0.16), transparent 32%),
    radial-gradient(circle at bottom right, rgba(14, 165, 233, 0.18), transparent 28%),
    linear-gradient(135deg, #f8fafc 0%, #fff7ed 42%, #eff6ff 100%);
  align-items: stretch;
}

.auth-gate-blob {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  opacity: 0.55;
  pointer-events: none;
}

.auth-gate-blob-a {
  width: 360px;
  height: 360px;
  top: -120px;
  right: 22%;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.28), rgba(249, 115, 22, 0));
  animation: gateFloat 11s ease-in-out infinite;
}

.auth-gate-blob-b {
  width: 420px;
  height: 420px;
  bottom: -180px;
  left: -80px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.26), rgba(14, 165, 233, 0));
  animation: gateFloat 14s ease-in-out infinite reverse;
}

.auth-gate-panel {
  position: relative;
  z-index: 1;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(20px);
  animation: riseIn 700ms ease both;
}

.auth-gate-copy {
  padding: 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: linear-gradient(160deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.88));
  color: #e2e8f0;
}

.auth-gate-badge {
  display: inline-flex;
  width: fit-content;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.auth-gate-title {
  margin: 24px 0 14px;
  font-size: clamp(2.4rem, 3.8vw, 4.5rem);
  line-height: 0.98;
  color: #f8fafc;
  letter-spacing: -0.04em;
}

.auth-gate-desc {
  margin: 0;
  max-width: 600px;
  font-size: 18px;
  line-height: 1.8;
  color: rgba(226, 232, 240, 0.78);
}

.auth-gate-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 28px;
}

.auth-gate-stat {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: transform 220ms ease, border-color 220ms ease, background 220ms ease;
}

.auth-gate-stat:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.12);
}

.auth-gate-stat strong,
.auth-gate-stat span {
  display: block;
}

.auth-gate-stat strong {
  font-size: 17px;
  color: #ffffff;
}

.auth-gate-stat span {
  margin-top: 8px;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.72);
}

.auth-gate-points {
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 14px;
  color: #e2e8f0;
  font-size: 16px;
}

.auth-gate-points li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  line-height: 1.8;
}

.auth-gate-points li::before {
  content: '';
  width: 10px;
  height: 10px;
  margin-top: 9px;
  border-radius: 999px;
  flex: none;
  background: linear-gradient(135deg, #fb923c, #38bdf8);
  box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.06);
}

.auth-gate-aside {
  margin-top: 32px;
  padding: 20px 22px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.18), rgba(56, 189, 248, 0.12));
  border: 1px solid rgba(255, 255, 255, 0.14);
  transition: transform 220ms ease, border-color 220ms ease;
}

.auth-gate-aside:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.28);
}

.auth-gate-aside-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.auth-gate-aside p {
  margin: 12px 0 0;
  line-height: 1.7;
  color: rgba(241, 245, 249, 0.88);
}

.auth-gate-form {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.72);
}

.auth-gate-form :deep(.center),
.auth-gate-form :deep(.auth-card),
.auth-gate-form :deep(.n-tabs) {
  width: 100%;
}

.workspace-root {
  min-height: 100vh;
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

@keyframes gateFloat {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(0, 18px, 0) scale(1.06);
  }
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .auth-gate-shell {
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 16px;
  }

  .auth-gate-copy {
    padding: 30px 22px;
  }

  .auth-gate-stats {
    grid-template-columns: 1fr;
  }

  .auth-gate-form {
    padding: 18px;
  }
}
</style>
