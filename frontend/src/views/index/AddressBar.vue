<script setup>
import { computed, onMounted, ref } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useRoute, useRouter } from 'vue-router'
import { User, ExchangeAlt, Copy } from '@vicons/fa'
import {
  KeyOutline,
  SettingsOutline,
  LanguageOutline,
  MoonOutline,
  SunnyOutline,
  GlobeOutline,
  GridOutline,
} from '@vicons/ionicons5'
import useClipboard from 'vue-clipboard3'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import TelegramAddress from './TelegramAddress.vue'
import LocalAddress from './LocalAddress.vue'
import AddressManagement from '../user/AddressManagement.vue'
import { getRouterPathWithLang } from '../../utils'

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
  userSettings,
  isTelegram,
  addressPassword,
  openSettings,
  isDark,
  toggleDark,
  showAdminPage,
} = useGlobalState()

const { locale, t } = useScopedI18n('views.index.AddressBar')

const showAddressManage = ref(false)

const getUrlWithJwt = () => `${window.location.origin}/?jwt=${jwt.value}`

const onUserLogin = async () => {
  if (!shouldRouteToUserSettings.value) {
    await router.push(getRouterPathWithLang('/', locale.value))
    return
  }
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
const languageLabel = computed(() => (locale.value === 'zh' ? 'EN' : '中'))
const currentMailboxEmail = computed(() => settings.value.address || t('notAvailable'))
const currentMailboxPassword = computed(() => addressPassword.value || t('notAvailable'))
const hasUserAccount = computed(() => !!userSettings.value.user_email)
const requireUserLogin = computed(() => !!openSettings.value.requireUserLogin)
const shouldRouteToUserSettings = computed(() => !requireUserLogin.value || hasUserAccount.value)

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

const openMailboxAccountManage = () => {
  showAddressManage.value = true
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
          <n-button v-if="showSimpleToggle" tertiary block @click="openAppearance">
            {{ t('simpleMode') }}
          </n-button>
        </div>
      </n-popover>

      <n-popover trigger="click" placement="bottom-end">
        <template #trigger>
          <button class="avatar-chip">
            <n-icon :component="User" />
          </button>
        </template>
        <div class="account-popover">
          <div class="account-section">
            <div class="account-section-title">{{ t('mailboxAccount') }}</div>
            <div class="account-info-row">
              <span class="account-info-label">{{ t('mailboxEmail') }}</span>
              <span class="account-info-value">{{ currentMailboxEmail }}</span>
            </div>
            <div class="account-info-row">
              <span class="account-info-label">{{ t('mailboxPasswordLabel') }}</span>
              <span class="account-info-value">{{ currentMailboxPassword }}</span>
            </div>
          </div>

          <div class="account-section">
            <n-button tertiary block @click="openMailboxAccountManage">
              <template #icon>
                <n-icon :component="ExchangeAlt" />
              </template>
              {{ t('loginAnotherMailboxAccount') }}
            </n-button>
            <n-button tertiary block @click="openMailboxAccountManage">
              <template #icon>
                <n-icon :component="ExchangeAlt" />
              </template>
              {{ t('createNewMailboxAccount') }}
            </n-button>
          </div>

          <div v-if="hasUserAccount || requireUserLogin" class="account-section">
            <n-button tertiary block @click="onUserLogin">
              <template #icon>
                <n-icon :component="GridOutline" />
              </template>
              {{ t('userSettings') }}
            </n-button>
          </div>
        </div>
      </n-popover>
    </div>

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

.account-popover {
  display: grid;
  gap: 12px;
  min-width: 280px;
}

.account-section {
  display: grid;
  gap: 8px;
}

.account-section + .account-section {
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.account-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.account-info-row {
  display: grid;
  gap: 4px;
}

.account-info-label {
  font-size: 12px;
  color: #6b7280;
}

.account-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  word-break: break-all;
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
