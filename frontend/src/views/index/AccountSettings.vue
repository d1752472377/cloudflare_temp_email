<script setup>
import { ref } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useRouter } from 'vue-router'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { hashPassword, getRouterPathWithLang } from '../../utils'

const {
  jwt, settings, showAddressCredential, loading, openSettings,
} = useGlobalState()
const router = useRouter()
const message = useMessage()

const showLogout = ref(false)
const showDeleteAccount = ref(false)
const showClearInbox = ref(false)
const showClearSentItems = ref(false)
const showChangePassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const { locale, t } = useScopedI18n('views.index.AccountSettings')

const logout = async () => {
  jwt.value = ''
  await router.push(getRouterPathWithLang('/', locale.value))
  location.reload()
}

const deleteAccount = async () => {
  try {
    await api.fetch('/api/delete_address', {
      method: 'DELETE',
    })
    jwt.value = ''
    await router.push(getRouterPathWithLang('/', locale.value))
    location.reload()
  } catch (error) {
    message.error(error.message || 'error')
  }
}

const clearInbox = async () => {
  try {
    await api.fetch('/api/clear_inbox', {
      method: 'DELETE',
    })
    message.success(t('success'))
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    showClearInbox.value = false
  }
}

const clearSentItems = async () => {
  try {
    await api.fetch('/api/clear_sent_items', {
      method: 'DELETE',
    })
    message.success(t('success'))
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    showClearSentItems.value = false
  }
}

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    message.error(t('passwordMismatch'))
    return
  }
  try {
    await api.fetch('/api/address_change_password', {
      method: 'POST',
      body: JSON.stringify({
        new_password: await hashPassword(newPassword.value),
      }),
    })
    message.success(t('passwordChanged'))
    newPassword.value = ''
    confirmPassword.value = ''
    showChangePassword.value = false
  } catch (error) {
    message.error(error.message || 'error')
  }
}
</script>

<template>
  <div v-if="settings.address" class="account-page">
    <section class="account-section">
      <div class="section-heading">{{ t('mailboxInfo') }}</div>
      <div class="section-title-row">
        <div>
          <div class="section-title">{{ t('mailboxInfo') }}</div>
          <div class="section-desc">{{ t('mailboxInfoDesc') }}</div>
        </div>
      </div>
      <div class="section-grid">
        <n-button type="primary" @click="showAddressCredential = true">{{ t('showAddressCredential') }}</n-button>
        <n-button v-if="openSettings?.enableAddressPassword" type="info" secondary @click="showChangePassword = true">{{ t('changePassword') }}</n-button>
      </div>
    </section>

    <section class="account-section" v-if="openSettings.enableUserDeleteEmail">
      <div class="section-heading">{{ t('dataManagement') }}</div>
      <div class="section-title-row">
        <div>
          <div class="section-title">{{ t('dataManagement') }}</div>
          <div class="section-desc">{{ t('dataManagementDesc') }}</div>
        </div>
      </div>
      <div class="section-grid">
        <n-button type="warning" secondary @click="showClearInbox = true">{{ t('clearInbox') }}</n-button>
        <n-button type="warning" secondary @click="showClearSentItems = true">{{ t('clearSentItems') }}</n-button>
      </div>
    </section>

    <section class="account-section">
      <div class="section-heading">{{ t('session') }}</div>
      <div class="section-title-row">
        <div>
          <div class="section-title">{{ t('session') }}</div>
          <div class="section-desc">{{ t('sessionDesc') }}</div>
        </div>
      </div>
      <div class="section-grid">
        <n-button secondary @click="showLogout = true">{{ t('logout') }}</n-button>
      </div>
    </section>

    <section v-if="openSettings.enableUserDeleteEmail" class="account-section danger-section">
      <div class="section-heading">{{ t('dangerZone') }}</div>
      <div class="section-title-row">
        <div>
          <div class="section-title">{{ t('dangerZone') }}</div>
          <div class="section-desc">{{ t('dangerZoneDesc') }}</div>
        </div>
      </div>
      <div class="section-grid">
        <n-button type="error" secondary @click="showDeleteAccount = true">{{ t('deleteAccount') }}</n-button>
      </div>
    </section>

    <n-modal v-model:show="showLogout" preset="dialog" :title="t('logout')">
      <p>{{ t('logoutConfirm') }}</p>
      <template #action>
        <n-button :loading="loading" @click="logout" size="small" tertiary type="warning">{{ t('logout') }}</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showDeleteAccount" preset="dialog" :title="t('deleteAccount')">
      <p>{{ t('deleteAccountConfirm') }}</p>
      <template #action>
        <n-button :loading="loading" @click="deleteAccount" size="small" tertiary type="error">{{ t('deleteAccount') }}</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showClearInbox" preset="dialog" :title="t('clearInbox')">
      <p>{{ t('clearInboxConfirm') }}</p>
      <template #action>
        <n-button :loading="loading" @click="clearInbox" size="small" tertiary type="warning">{{ t('clearInbox') }}</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showClearSentItems" preset="dialog" :title="t('clearSentItems')">
      <p>{{ t('clearSentItemsConfirm') }}</p>
      <template #action>
        <n-button :loading="loading" @click="clearSentItems" size="small" tertiary type="warning">{{ t('clearSentItems') }}</n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showChangePassword" preset="dialog" :title="t('changePassword')">
      <n-form :model="{ newPassword, confirmPassword }">
        <n-form-item :label="t('newPassword')">
          <n-input v-model:value="newPassword" type="password" placeholder="" show-password-on="click" />
        </n-form-item>
        <n-form-item :label="t('confirmPassword')">
          <n-input v-model:value="confirmPassword" type="password" placeholder="" show-password-on="click" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button :loading="loading" @click="changePassword" size="small" tertiary type="info">{{ t('changePassword') }}</n-button>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.account-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.account-section {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 22px;
}

.danger-section {
  border: 1px dashed #ef4444;
}

.section-heading {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
}

.section-title-row {
  margin-top: 10px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.section-desc {
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 768px) {
  .account-section {
    padding: 16px;
    border-radius: 16px;
  }

  .section-grid {
    grid-template-columns: 1fr;
  }
}
}

</style>
