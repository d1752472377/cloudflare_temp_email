<script setup>
import { computed, ref } from 'vue'
import { useMessage } from 'naive-ui'
import { KeyFilled } from '@vicons/material'
import { startAuthentication } from '@simplewebauthn/browser'

import { api } from '../../api'
import { useGlobalState } from '../../store'
import { hashPassword } from '../../utils'
import Turnstile from '../../components/Turnstile.vue'

const {
  userJwt, userOpenSettings, openSettings,
  userOauth2SessionState, userOauth2SessionClientID,
  jwt, addressPassword,
} = useGlobalState()
const message = useMessage()

const tabValue = ref('signin')
const showModal = ref(false)
const user = ref({
  email: '',
  password: '',
  code: '',
})
const signupCfToken = ref('')
const resetCfToken = ref('')
const loginCfToken = ref('')
const signupTurnstileRef = ref(null)
const resetTurnstileRef = ref(null)
const loginTurnstileRef = ref(null)
const verifyCodeExpire = ref(0)
const verifyCodeTimeout = ref(0)

const oauthProviders = computed(() => userOpenSettings.value.oauth2ClientIDs || [])
const hasQuickMethods = computed(() => userOpenSettings.value.enablePasskeyLogin || oauthProviders.value.length > 0)
const registrationEnabled = computed(() => !!userOpenSettings.value.enable)
const statusText = computed(() => (registrationEnabled.value ? '登录或注册后继续使用完整工作区' : '当前实例仅开放登录入口'))
const copy = computed(() => ({
  title: '欢迎回来',
  subtitle: registrationEnabled.value
    ? '通过邮箱、Passkey 或第三方身份提供商进入工作区。'
    : '通过邮箱、Passkey 或第三方身份提供商登录后继续进入工作区。',
  badge: '安全访问',
  login: '登录',
  register: '注册',
  email: '邮箱',
  password: '密码',
  code: '验证码',
  send: '发送验证码',
  forgot: '忘记密码',
  passkey: '使用 Passkey 登录',
  quickTitle: '快捷方式',
  quickDesc: '如果当前实例已启用，可以直接使用 Passkey 或 OAuth2 登录。',
  createAccount: '创建账户',
  resetTitle: '重置密码',
  resetDesc: '通过邮箱验证码完成密码重置。',
  resetUnavailable: '当前暂时无法重置密码。',
  needEmail: '请输入邮箱',
  needCode: '请输入验证码',
  needLogin: '请输入邮箱和密码',
  needTurnstile: '请先完成人机验证',
  loginLater: '请先登录',
}))

const getVerifyCodeTimeout = () => {
  if (!verifyCodeExpire.value || verifyCodeExpire.value < Date.now()) return 0
  return Math.round((verifyCodeExpire.value - Date.now()) / 1000)
}

const emailLogin = async () => {
  if (!user.value.email || !user.value.password) {
    message.error(copy.value.needLogin)
    return
  }
  try {
    const res = await api.fetch('/user_api/login', {
      method: 'POST',
      body: JSON.stringify({
        email: user.value.email,
        password: await hashPassword(user.value.password),
        cf_token: loginCfToken.value,
      }),
    })
    userJwt.value = res.jwt
    jwt.value = ''
    addressPassword.value = ''
    location.reload()
  } catch (error) {
    message.error(error.message || 'login failed')
    loginTurnstileRef.value?.refresh?.()
  }
}

const sendVerificationCode = async () => {
  if (!user.value.email) {
    message.error(copy.value.needEmail)
    return
  }
  const currentCfToken = showModal.value ? resetCfToken.value : signupCfToken.value
  if (openSettings.value.cfTurnstileSiteKey && !currentCfToken && userOpenSettings.value.enableMailVerify) {
    message.error(copy.value.needTurnstile)
    return
  }
  try {
    const res = await api.fetch('/user_api/verify_code', {
      method: 'POST',
      body: JSON.stringify({
        email: user.value.email,
        cf_token: currentCfToken,
      }),
    })
    if (res?.expirationTtl) {
      message.success(`验证码已发送，${res.expirationTtl} 秒后失效`)
      verifyCodeExpire.value = Date.now() + res.expirationTtl * 1000
      verifyCodeTimeout.value = res.expirationTtl
      const intervalId = setInterval(() => {
        verifyCodeTimeout.value = getVerifyCodeTimeout()
        if (verifyCodeTimeout.value <= 0) {
          clearInterval(intervalId)
          verifyCodeTimeout.value = 0
        }
      }, 1000)
    }
  } catch (error) {
    message.error(error.message || 'send verification code failed')
  }
  if (showModal.value) {
    resetTurnstileRef.value?.refresh?.()
  } else {
    signupTurnstileRef.value?.refresh?.()
  }
}

const emailSignup = async () => {
  if (!user.value.email || !user.value.password) {
    message.error(copy.value.needLogin)
    return
  }
  if (!user.value.code && userOpenSettings.value.enableMailVerify) {
    message.error(copy.value.needCode)
    return
  }
  try {
    const res = await api.fetch('/user_api/register', {
      method: 'POST',
      body: JSON.stringify({
        email: user.value.email,
        password: await hashPassword(user.value.password),
        code: user.value.code,
        cf_token: showModal.value ? resetCfToken.value : signupCfToken.value,
      }),
      message,
    })
    if (res) {
      tabValue.value = 'signin'
      message.success(copy.value.loginLater)
    }
    showModal.value = false
  } catch (error) {
    message.error(error.message || 'register failed')
  }
}

const passkeyLogin = async () => {
  try {
    const options = await api.fetch('/user_api/passkey/authenticate_request', {
      method: 'POST',
      body: JSON.stringify({ domain: location.hostname }),
    })
    const credential = await startAuthentication({ optionsJSON: options })
    const res = await api.fetch('/user_api/passkey/authenticate_response', {
      method: 'POST',
      body: JSON.stringify({
        origin: location.origin,
        domain: location.hostname,
        credential,
      }),
    })
    userJwt.value = res.jwt
    jwt.value = ''
    addressPassword.value = ''
    location.reload()
  } catch (error) {
    console.error(error)
    message.error(error.message)
  }
}

const oauth2Login = async (clientID) => {
  try {
    userOauth2SessionClientID.value = clientID
    userOauth2SessionState.value = Math.random().toString(36).substring(2)
    const res = await api.fetch(`/user_api/oauth2/login_url?clientID=${clientID}&state=${userOauth2SessionState.value}`)
    location.href = res.url
  } catch (error) {
    message.error(error.message || 'login failed')
  }
}
</script>

<template>
  <div class="center">
    <div class="auth-card">
      <div class="auth-card-glow auth-card-glow-a"></div>
      <div class="auth-card-glow auth-card-glow-b"></div>
      <div class="auth-card-mesh"></div>
      <div class="auth-card-header">
        <span class="auth-badge">{{ copy.badge }}</span>
        <h2 class="auth-title">{{ copy.title }}</h2>
        <p class="auth-subtitle">{{ copy.subtitle }}</p>
        <div class="auth-status-pill">{{ statusText }}</div>
      </div>

      <n-tabs v-if="userOpenSettings.fetched" v-model:value="tabValue" type="segment" animated class="auth-tabs">
        <n-tab-pane name="signin" :tab="copy.login">
          <div class="auth-section">
            <n-form>
              <n-form-item-row :label="copy.email" required>
                <n-input v-model:value="user.email" size="large" placeholder="name@example.com" />
              </n-form-item-row>
              <n-form-item-row :label="copy.password" required>
                <n-input v-model:value="user.password" size="large" type="password" show-password-on="click" />
              </n-form-item-row>
              <Turnstile ref="loginTurnstileRef" v-if="openSettings.enableGlobalTurnstileCheck" v-model:value="loginCfToken" />
              <n-button class="hero-button" @click="emailLogin" type="primary" block strong size="large">{{ copy.login }}</n-button>
              <n-button class="secondary-button" @click="showModal = true" block secondary>{{ copy.forgot }}</n-button>
            </n-form>

            <div v-if="hasQuickMethods" class="quick-methods">
              <strong>{{ copy.quickTitle }}</strong>
              <span>{{ copy.quickDesc }}</span>
              <n-button v-if="userOpenSettings.enablePasskeyLogin" class="method-button" @click="passkeyLogin" block secondary strong>
                <template #icon>
                  <n-icon :component="KeyFilled" />
                </template>
                {{ copy.passkey }}
              </n-button>
              <n-button
                v-for="item in oauthProviders"
                :key="item.clientID"
                class="method-button"
                @click="oauth2Login(item.clientID)"
                block
                secondary
                strong
              >
                <template #icon v-if="item.icon">
                  <span class="oauth2-icon" v-html="item.icon"></span>
                </template>
                {{ item.name }}
              </n-button>
            </div>
          </div>
        </n-tab-pane>

        <n-tab-pane v-if="registrationEnabled" name="signup" :tab="copy.register">
          <div class="auth-section">
            <n-form>
              <n-form-item-row :label="copy.email" required>
                <n-input v-model:value="user.email" size="large" placeholder="name@example.com" />
              </n-form-item-row>
              <n-form-item-row :label="copy.password" required>
                <n-input v-model:value="user.password" size="large" type="password" show-password-on="click" />
              </n-form-item-row>
              <Turnstile ref="signupTurnstileRef" v-if="userOpenSettings.enableMailVerify" v-model:value="signupCfToken" />
              <n-form-item-row v-if="userOpenSettings.enableMailVerify" :label="copy.code" required>
                <n-input-group>
                  <n-input v-model:value="user.code" size="large" />
                  <n-button @click="sendVerificationCode" type="primary" ghost :disabled="verifyCodeTimeout > 0">
                    {{ verifyCodeTimeout > 0 ? verifyCodeTimeout + 's' : copy.send }}
                  </n-button>
                </n-input-group>
              </n-form-item-row>
              <Turnstile ref="signupTurnstileRef" v-if="!userOpenSettings.enableMailVerify" v-model:value="signupCfToken" />
            </n-form>
            <n-button class="hero-button" @click="emailSignup" type="primary" block strong size="large">{{ copy.createAccount }}</n-button>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>

    <n-modal v-model:show="showModal" style="max-width: 560px;" preset="card" :title="copy.resetTitle">
      <p class="modal-copy">{{ copy.resetDesc }}</p>
      <n-form v-if="userOpenSettings.enable && userOpenSettings.enableMailVerify">
        <n-form-item-row :label="copy.email" required>
          <n-input v-model:value="user.email" size="large" />
        </n-form-item-row>
        <n-form-item-row :label="copy.password" required>
          <n-input v-model:value="user.password" size="large" type="password" show-password-on="click" />
        </n-form-item-row>
        <Turnstile ref="resetTurnstileRef" v-model:value="resetCfToken" />
        <n-form-item-row :label="copy.code" required>
          <n-input-group>
            <n-input v-model:value="user.code" size="large" />
            <n-button @click="sendVerificationCode" type="primary" ghost :disabled="verifyCodeTimeout > 0">
              {{ verifyCodeTimeout > 0 ? verifyCodeTimeout + 's' : copy.send }}
            </n-button>
          </n-input-group>
        </n-form-item-row>
        <n-button class="hero-button" @click="emailSignup" type="primary" block strong size="large">{{ copy.resetTitle }}</n-button>
      </n-form>
      <n-alert v-else :show-icon="false" :bordered="false">
        {{ copy.resetUnavailable }}
      </n-alert>
    </n-modal>
  </div>
</template>

<style scoped>
.center {
  display: flex;
  justify-content: center;
  width: 100%;
}

.auth-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: 26px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.82);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
  animation: cardRise 620ms ease both;
}

.auth-card-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  pointer-events: none;
  opacity: 0.55;
}

.auth-card-glow-a {
  width: 120px;
  height: 120px;
  top: -18px;
  right: 8px;
  background: radial-gradient(circle, rgba(249, 115, 22, 0.28), rgba(249, 115, 22, 0));
}

.auth-card-glow-b {
  width: 150px;
  height: 150px;
  bottom: -44px;
  left: -20px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.22), rgba(14, 165, 233, 0));
}

.auth-card-mesh {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), transparent 75%);
  pointer-events: none;
}

.auth-card-header {
  position: relative;
  margin-bottom: 22px;
}

.auth-badge {
  display: inline-flex;
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.1);
  color: #0f766e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.auth-title {
  margin: 12px 0 8px;
  font-size: 32px;
  line-height: 1.05;
  color: #0f172a;
}

.auth-subtitle,
.quick-methods span,
.modal-copy {
  color: #64748b;
  line-height: 1.7;
}

.auth-status-pill {
  display: inline-flex;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: #475569;
  font-size: 13px;
  line-height: 1.4;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.auth-section {
  display: grid;
  gap: 18px;
}

.hero-button {
  margin-top: 8px;
  height: 48px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #f97316, #0ea5e9);
  box-shadow: 0 16px 30px rgba(14, 165, 233, 0.18);
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

.hero-button:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 20px 34px rgba(14, 165, 233, 0.24);
  filter: saturate(1.08);
}

.secondary-button,
.method-button {
  margin-top: 10px;
  border-radius: 16px;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.secondary-button:hover,
.method-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.quick-methods {
  margin-top: 6px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px solid rgba(226, 232, 240, 0.95);
  display: grid;
  gap: 10px;
  transition: transform 220ms ease, border-color 220ms ease;
}

.quick-methods:hover {
  transform: translateY(-4px);
  border-color: rgba(14, 165, 233, 0.24);
}

.quick-methods strong {
  color: #0f172a;
}

.oauth2-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
}

.oauth2-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

@keyframes cardRise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .auth-card {
    padding: 20px;
    border-radius: 24px;
  }

  .auth-title {
    font-size: 28px;
  }
}
</style>
