<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { locale, t } = useI18n({
  messages: {
    en: {
      logout: 'Logout',
      deleteAccount: 'Delete Account',
      showAddressCredential: 'Show Address Credential',
      logoutConfirm: 'Are you sure to logout?',
      deleteAccountConfirm: 'Are you sure to delete your account and all emails for this account?',
      clearInbox: 'Clear Inbox',
      clearSentItems: 'Clear Sent Items',
      clearInboxConfirm: 'Are you sure to clear all emails in your inbox?',
      clearSentItemsConfirm: 'Are you sure to clear all emails in your sent items?',
      success: 'Success',
      changePassword: 'Change Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      passwordMismatch: 'Passwords do not match',
      passwordChanged: 'Password changed successfully',
      mailboxInfo: 'Mailbox Info',
      mailboxInfoDesc: 'View credentials or update your mailbox password.',
      dataManagement: 'Data Management',
      dataManagementDesc: 'Clean inbox or sent mail without leaving the current session.',
      session: 'Session',
      sessionDesc: 'Logout from the current mailbox session.',
      dangerZone: 'Danger Zone',
      dangerZoneDesc: 'These operations are destructive and cannot be undone.',
    },
    zh: {
      logout: '退出登录',
      deleteAccount: '删除账户',
      showAddressCredential: '查看邮箱地址凭证',
      logoutConfirm: '确定要退出登录吗？',
      deleteAccountConfirm: '确定要删除你的账户和其中的所有邮件吗?',
      clearInbox: '清空收件箱',
      clearSentItems: '清空发件箱',
      clearInboxConfirm: '确定要清空你收件箱中的所有邮件吗？',
      clearSentItemsConfirm: '确定要清空你发件箱中的所有邮件吗？',
      success: '成功',
      changePassword: '修改密码',
      newPassword: '新密码',
      confirmPassword: '确认密码',
      passwordMismatch: '密码不匹配',
      passwordChanged: '密码修改成功',
      mailboxInfo: '邮箱信息',
      mailboxInfoDesc: '查看邮箱凭据或修改邮箱密码。',
      dataManagement: '数据管理',
      dataManagementDesc: '清空收件箱或发件箱，不影响当前登录状态。',
      session: '会话',
      sessionDesc: '退出当前邮箱登录会话。',
      dangerZone: '危险区域',
      dangerZoneDesc: '以下操作具有破坏性且不可撤销。',
    },
  },
})

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
</style>
