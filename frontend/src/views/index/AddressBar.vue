<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { User, ExchangeAlt, Copy } from '@vicons/fa'
import {
  KeyOutline,
  GridOutline,
  SettingsOutline,
  LanguageOutline,
  MoonOutline,
  SunnyOutline,
  GlobeOutline,
} from '@vicons/ionicons5'
import useClipboard from 'vue-clipboard3'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import Login from '../common/Login.vue'
import TelegramAddress from './TelegramAddress.vue'
import LocalAddress from './LocalAddress.vue'
import AddressManagement from '../user/AddressManagement.vue'
import { getRouterPathWithLang } from '../../utils'
import AddressSelect from '../../components/AddressSelect.vue'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  showSimpleToggle: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-simple'])

const router = useRouter()
const route = useRoute()
const message = useMessage()
const { toClipboard } = useClipboard()

const {
  jwt,
  settings,
  showAddressCredential,
  userJwt,
  isTelegram,
  addressPassword,
  openSettings,
  isDark,
  toggleDark,
  showAdminPage,
} = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      ok: 'OK',
      fetchAddressError: 'Mail address credential is invalid or account not exist, it may be network connection issue, please try again later.',
      addressCredential: 'Mailbox Credential',
      linkWithAddressCredential: 'Open to auto login email link',
      addressCredentialTip: 'Please save the mailbox credential if you need a direct login token.',
      addressPassword: 'Address Password',
      userLogin: 'User Login',
      addressManage: 'Manage',
      copyAddress: 'Copy address',
      simpleMode: 'Simple Mode',
      accountEntry: 'Account',
      workspace: 'Mailbox Workspace',
      appearance: 'Appearance',
      status: 'Status',
      inboxAddress: 'Current mailbox',
    },
    zh: {
      ok: '确定',
      fetchAddressError: '邮箱地址凭证无效或邮箱地址不存在，也可能是网络连接异常，请稍后再尝试。',
      addressCredential: '邮箱凭据',
      linkWithAddressCredential: '打开即可自动登录邮箱的链接',
      addressCredentialTip: '如果你需要直接登录令牌，请保存好邮箱凭据。',
      addressPassword: '地址密码',
      userLogin: '用户登录',
      addressManage: '管理',
      copyAddress: '复制地址',
      simpleMode: '极简模式',
      accountEntry: '账户',
      workspace: '邮箱工作台',
      appearance: '外观',
      status: '状态',
      inboxAddress: '当前邮箱',
    },
  },
})

const showAddressManage = ref(false)

const getUrlWithJwt = () => `${window.location.origin}/?jwt=${jwt.value}`

const onUserLogin = async () => {
  await router.push(getRouterPathWithLang('/user', locale.value))
}

const copyAddress = async () => {
  try {
    if (!settings.value.address) return
    await toClipboard(settings.value.address)
    message.success(t('copyAddress'))
  } catch (e) {
    message.error(e.message || 'error')
  }
}

const headerTitle = computed(() => props.title || t('workspace'))
const avatarLetter = computed(() => (settings.value.address || 'M').slice(0, 1).toUpperCase())
const languageLabel = computed(() => (locale.value === 'zh' ? 'EN' : '中'))

const changeLocale = async () => {
  if (locale.value === 'zh') {
    await router.push(route.fullPath.replace(/^\//, '/en/'))
    return
  }
  await router.push(route.fullPath.replace(/^\/en/, '') || '/')
}

const openAppearance = () => {
  emit('toggle-simple')
}

const openStatus = () => {
  if (openSettings.value?.statusUrl) {
    window.open(openSettings.value.statusUrl, '_blank', 'noopener,noreferrer')
  } else if (showAdminPage.value) {
    router.push(getRouterPathWithLang('/admin', locale.value))
  }
}

onMounted(async () => {
  await api.getSettings()
})
</script>

<template>
  <div class="workspace-header">
    <div class="workspace-header-left">
      <template v-if="settings.address">
        <div class="workspace-title-group">
          <div class="workspace-title">{{ headerTitle }}</div>
        </div>

        <button class="address-pill" @click="copyAddress">
          <span class="address-pill-label">{{ t('inboxAddress') }}</span>
          <span class="address-pill-value">{{ settings.address }}</span>
          <n-icon class="address-pill-icon" :component="Copy" />
        </button>
      </template>
      <div v-else class="workspace-title-group">
        <div class="workspace-title">{{ t('workspace') }}</div>
      </div>
    </div>

    <div class="workspace-header-tools">
      <n-tooltip trigger="hover">
        <template #trigger>
          <button class="tool-button" @click="openStatus">
            <n-icon :component="GlobeOutline" />
          </button>
        </template>
        {{ t('status') }}
      </n-tooltip>

      <n-tooltip trigger="hover">
        <template #trigger>
          <button class="tool-button" @click="toggleDark()">
            <n-icon :component="isDark ? SunnyOutline : MoonOutline" />
          </button>
        </template>
        {{ t('appearance') }}
      </n-tooltip>

      <n-tooltip trigger="hover">
        <template #trigger>
          <button class="tool-button" @click="changeLocale">
            <n-icon :component="LanguageOutline" />
          </button>
        </template>
        {{ languageLabel }}
      </n-tooltip>

      <n-popover trigger="click" placement="bottom-end">
        <template #trigger>
          <button class="tool-button">
            <n-icon :component="SettingsOutline" />
          </button>
        </template>
        <div class="header-popover-actions">
          <n-button v-if="settings.address" tertiary block @click="showAddressCredential = true">
            <template #icon>
              <n-icon :component="KeyOutline" />
            </template>
            {{ t('addressCredential') }}
          </n-button>
          <n-button tertiary block @click="showAddressManage = true">
            <template #icon>
              <n-icon :component="ExchangeAlt" />
            </template>
            {{ t('addressManage') }}
          </n-button>
          <n-button v-if="userJwt" tertiary block @click="onUserLogin">
            <template #icon>
              <n-icon :component="GridOutline" />
            </template>
            {{ t('accountEntry') }}
          </n-button>
          <n-button v-if="showSimpleToggle" tertiary block @click="openAppearance">
            {{ t('simpleMode') }}
          </n-button>
        </div>
      </n-popover>

      <button class="avatar-chip" @click="onUserLogin">
        <n-icon :component="User" />
      </button>
    </div>

    <!-- Modals -->
    <n-modal v-model:show="showAddressCredential" preset="dialog" :title="t('addressCredential')">
      <span>
        <p>{{ t('addressCredentialTip') }}</p>
      </span>
      <n-card embedded>
        <b>{{ jwt }}</b>
      </n-card>
      <n-card embedded v-if="addressPassword">
        <p><b>{{ settings.address }}</b></p>
        <p>{{ t('addressPassword') }}: <b>{{ addressPassword }}</b></p>
      </n-card>
      <n-card embedded>
        <n-collapse>
          <n-collapse-item :title="t('linkWithAddressCredential')">
            <n-card embedded>
              <b>{{ getUrlWithJwt() }}</b>
            </n-card>
          </n-collapse-item>
        </n-collapse>
      </n-card>
    </n-modal>

    <n-modal v-model:show="showAddressManage" preset="card" :title="t('addressManage')">
      <TelegramAddress v-if="isTelegram" />
      <AddressManagement v-else-if="userJwt" />
      <LocalAddress v-else />
    </n-modal>
  </div>
</template>

<style scoped>
.workspace-header {
  height: 64px;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 24px;
}

.workspace-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.workspace-title-group {
  min-width: fit-content;
}

.workspace-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.address-pill {
  min-width: 0;
  max-width: 520px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
}

.address-pill-label {
  flex-shrink: 0;
  font-size: 12px;
  color: #9ca3af;
}

.address-pill-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 600;
}

.address-pill-icon {
  flex-shrink: 0;
  color: #64748b;
}

.workspace-header-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-button,
.avatar-chip {
  border: 0;
  background: #fff;
  cursor: pointer;
}

.tool-button {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.15s ease;
}

.tool-button:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #111827;
}

.avatar-chip {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  color: #64748b;
  font-size: 18px;
  transition: all 0.2s;
}

.avatar-chip:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.header-popover-actions {
  display: grid;
  gap: 8px;
  min-width: 180px;
}

.login-shell,
.manage-card {
  width: 100%;
  max-width: 640px;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 20px;
}

.login-center {
  min-height: 100vh;
  background: #f0f2f5;
}

.user-login-link-row {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .workspace-header {
    height: auto;
    padding: 12px;
    flex-wrap: wrap;
  }

  .workspace-header-left,
  .workspace-header-tools {
    width: 100%;
  }

  .workspace-header-tools {
    justify-content: flex-end;
  }

  .address-pill {
    max-width: 100%;
    width: 100%;
  }
}
</style>
