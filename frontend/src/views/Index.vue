<script setup>
import { defineAsyncComponent, computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  MailOutline,
  SendOutline,
  CreateOutline,
  PersonCircleOutline,
  ColorPaletteOutline,
  InformationCircleOutline,
  CloudUploadOutline,
  LinkOutline,
  RefreshOutline,
  SparklesOutline,
  MegaphoneOutline,
  DocumentTextOutline,
  HelpCircleOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'
import { FullscreenExitOutlined } from '@vicons/material'
import { GithubAlt } from '@vicons/fa'

import { useGlobalState } from '../store'
import { api } from '../api'
import { useIsMobile } from '../utils/composables'

import AddressBar from './index/AddressBar.vue'
import MailBox from '../components/MailBox.vue'
import SendBox from '../components/SendBox.vue'
import AutoReply from './index/AutoReply.vue'
import AccountSettings from './index/AccountSettings.vue'
import Appearance from './common/Appearance.vue'
import Webhook from './index/Webhook.vue'
import Attachment from './index/Attachment.vue'
import About from './common/About.vue'
import SimpleIndex from './index/SimpleIndex.vue'

const { loading, settings, openSettings, indexTab, useSimpleIndex, userSettings } = useGlobalState()
const message = useMessage()
const route = useRoute()
const isMobile = useIsMobile()

const SendMail = defineAsyncComponent(() => {
  loading.value = true
  return import('./index/SendMail.vue').finally(() => {
    loading.value = false
  })
})

const { t } = useI18n({
  messages: {
    en: {
      mailbox: 'Inbox',
      sendbox: 'Sent',
      sendmail: 'Compose',
      auto_reply: 'Auto Reply',
      accountSettings: 'Account',
      appearance: 'Appearance',
      about: 'About',
      s3Attachment: 'Attachments',
      saveToS3Success: 'save to s3 success',
      webhookSettings: 'Webhook',
      query: 'Query',
      enterSimpleMode: 'Simple Mode',
      appName: 'Temp Mail',
      navTitle: 'Workspace',
      navSupport: 'Resources',
      updateNotice: 'Update Notice',
      apiDocs: 'API Docs',
      faq: 'FAQ',
      privacy: 'Privacy',
      github: 'GitHub',
      copyright: 'Copyright',
      noUpdates: 'No update notice',
    },
    zh: {
      mailbox: '收件箱',
      sendbox: '发件箱',
      sendmail: '写邮件',
      auto_reply: '自动回复',
      accountSettings: '账户',
      appearance: '外观',
      about: '关于',
      s3Attachment: '附件',
      saveToS3Success: '保存到s3成功',
      webhookSettings: 'Webhook',
      query: '查询',
      enterSimpleMode: '极简模式',
      appName: '临时邮件',
      navTitle: '工作区',
      navSupport: '资源链接',
      updateNotice: '更新通知',
      apiDocs: 'API 文档',
      faq: '常见问题',
      privacy: '隐私政策',
      github: 'GitHub',
      copyright: '版权所有',
      noUpdates: '暂无更新通知',
    },
  },
})

const fetchMailData = async (limit, offset) => {
  if (mailIdQuery.value > 0) {
    const singleMail = await api.fetch(`/api/mail/${mailIdQuery.value}`)
    if (singleMail) return { results: [singleMail], count: 1 }
    return { results: [], count: 0 }
  }
  return await api.fetch(`/api/mails?limit=${limit}&offset=${offset}`)
}

const deleteMail = async (curMailId) => {
  await api.fetch(`/api/mails/${curMailId}`, { method: 'DELETE' })
}

const deleteSenboxMail = async (curMailId) => {
  await api.fetch(`/api/sendbox/${curMailId}`, { method: 'DELETE' })
}

const fetchSenboxData = async (limit, offset) => {
  return await api.fetch(`/api/sendbox?limit=${limit}&offset=${offset}`)
}

const saveToS3 = async (mail_id, filename, blob) => {
  try {
    const { url } = await api.fetch('/api/attachment/put_url', {
      method: 'POST',
      body: JSON.stringify({ key: `${mail_id}/${filename}` }),
    })
    const formData = new FormData()
    formData.append(filename, blob)
    await fetch(url, {
      method: 'PUT',
      body: formData,
    })
    message.success(t('saveToS3Success'))
  } catch (error) {
    console.error(error)
    message.error(error.message || 'save to s3 error')
  }
}

const mailBoxKey = ref('')
const mailIdQuery = ref('')
const showMailIdQuery = ref(false)

const queryMail = () => {
  mailBoxKey.value = Date.now()
}

watch(route, () => {
  if (!route.query.mail_id) {
    showMailIdQuery.value = false
    mailIdQuery.value = ''
    queryMail()
  }
})

onMounted(() => {
  if (route.query.mail_id) {
    showMailIdQuery.value = true
    mailIdQuery.value = route.query.mail_id
    queryMail()
  }
})

const navItems = computed(() => {
  const items = [
    { key: 'mailbox', label: t('mailbox'), icon: MailOutline, show: true },
    { key: 'sendbox', label: t('sendbox'), icon: SendOutline, show: !!settings.value.address && openSettings.value.enableSendMail },
    { key: 'sendmail', label: t('sendmail'), icon: CreateOutline, show: !!settings.value.address && openSettings.value.enableSendMail },
    { key: 'accountSettings', label: t('accountSettings'), icon: PersonCircleOutline, show: !!settings.value.address },
    { key: 'appearance', label: t('appearance'), icon: ColorPaletteOutline, show: !!settings.value.address },
    { key: 'auto_reply', label: t('auto_reply'), icon: RefreshOutline, show: !!settings.value.address && openSettings.value.enableAutoReply },
    { key: 'webhook', label: t('webhookSettings'), icon: LinkOutline, show: !!settings.value.address && openSettings.value.enableWebhook },
    { key: 's3_attachment', label: t('s3Attachment'), icon: CloudUploadOutline, show: !!settings.value.address && openSettings.value.isS3Enabled },
    { key: 'about', label: t('about'), icon: InformationCircleOutline, show: openSettings.value.enableIndexAbout },
  ]
  return items.filter((item) => item.show)
})

const primaryNavItems = computed(() => navItems.value.filter((item) => ['mailbox', 'sendbox', 'sendmail', 'accountSettings'].includes(item.key)))
const utilityNavItems = computed(() => navItems.value.filter((item) => !['mailbox', 'sendbox', 'sendmail', 'accountSettings'].includes(item.key)))
const activeNavLabel = computed(() => navItems.value.find((item) => item.key === indexTab.value)?.label || t('mailbox'))

const showWorkspace = computed(() => !openSettings.value.requireUserLogin || !!userSettings.value.user_email)
const supportLinks = computed(() => [
  {
    key: 'update',
    label: t('updateNotice'),
    icon: MegaphoneOutline,
    action: () => message.info(openSettings.value.announcement || t('noUpdates')),
  },
  {
    key: 'api-docs',
    label: t('apiDocs'),
    icon: DocumentTextOutline,
    action: () => window.open('https://github.com/dreamhunter2333/cloudflare_temp_email/tree/main/vitepress-docs', '_blank', 'noopener,noreferrer'),
  },
  {
    key: 'faq',
    label: t('faq'),
    icon: HelpCircleOutline,
    action: () => {
      if (navItems.value.some((item) => item.key === 'about')) {
        indexTab.value = 'about'
      } else {
        message.info(openSettings.value.announcement || t('noUpdates'))
      }
    },
  },
  {
    key: 'privacy',
    label: t('privacy'),
    icon: ShieldCheckmarkOutline,
    action: () => {
      if (navItems.value.some((item) => item.key === 'about')) {
        indexTab.value = 'about'
      } else {
        message.info(openSettings.value.announcement || t('noUpdates'))
      }
    },
  },
  {
    key: 'github',
    label: t('github'),
    icon: GithubAlt,
    action: () => window.open('https://github.com/dreamhunter2333/cloudflare_temp_email', '_blank', 'noopener,noreferrer'),
  },
])
</script>

<template>
  <div>
    <div v-if="useSimpleIndex">
      <SimpleIndex />
    </div>

    <div v-else-if="showWorkspace" class="workspace-shell" :class="{ authenticated: settings.address }">
      <aside v-if="!isMobile" class="workspace-sidebar">
        <div class="sidebar-top">
          <div class="sidebar-brand">
            <img src="/logo.png" alt="Logo" class="sidebar-logo-img" />
            <div class="brand-title">dovislab.com</div>
          </div>
        </div>

        <div class="sidebar-body">
          <div class="sidebar-section">
            <button
              v-for="item in primaryNavItems"
              :key="item.key"
              class="sidebar-link primary-link"
              :class="{ active: indexTab === item.key }"
              @click="indexTab = item.key"
            >
              <n-icon :component="item.icon" />
              <span>{{ item.label }}</span>
            </button>
            <button class="sidebar-link primary-link" @click="queryMail">
              <n-icon :component="RefreshOutline" />
              <span>{{ t('mailbox') == 'Inbox' ? 'Refresh' : '刷新' }}</span>
            </button>
          </div>

          <div v-if="settings.address && utilityNavItems.length > 0" class="sidebar-section secondary-section">
            <button
              v-for="item in utilityNavItems"
              :key="item.key"
              class="sidebar-link subtle-link"
              :class="{ active: indexTab === item.key }"
              @click="indexTab = item.key"
            >
              <n-icon :component="item.icon" />
              <span>{{ item.label }}</span>
            </button>
          </div>
        </div>

        <div class="sidebar-bottom">
          <div class="sidebar-meta-title">{{ t('navSupport') }}</div>
          <button
            v-for="item in supportLinks"
            :key="item.key"
            class="sidebar-meta-link"
            @click="item.action"
          >
            <n-icon :component="item.icon" />
            <span>{{ item.label }}</span>
          </button>
          <button class="sidebar-meta-link" @click="useSimpleIndex = true">
            <n-icon :component="FullscreenExitOutlined" />
            <span>{{ t('enterSimpleMode') }}</span>
          </button>
          <div class="sidebar-copyright">
            {{ t('copyright') }} © 2023-{{ new Date().getFullYear() }}
          </div>
        </div>
      </aside>

      <main class="workspace-main">
        <AddressBar :title="activeNavLabel" :show-simple-toggle="!isMobile" @toggle-simple="useSimpleIndex = true" />

        <div v-if="isMobile && settings.address" class="mobile-nav">
          <button
            v-for="item in primaryNavItems"
            :key="item.key"
            class="mobile-nav-item"
            :class="{ active: indexTab === item.key }"
            @click="indexTab = item.key"
          >
            <n-icon :component="item.icon" />
            <span>{{ item.label }}</span>
          </button>
        </div>

        <section class="workspace-content">
          <div v-if="!settings.address" class="workspace-page boxed-page empty-workspace-state">
            <n-empty :description="route.query.mail_id ? '' : (t('mailbox') === 'Inbox' ? 'Select or bind a mailbox address in Account.' : '请先在账户中绑定或创建邮箱地址。')" />
          </div>
          <template v-else>
            <div v-if="indexTab === 'mailbox'" class="workspace-page mailbox-page">
              <div v-if="showMailIdQuery" class="mail-query-row">
                <n-input-group>
                  <n-input v-model:value="mailIdQuery" />
                  <n-button @click="queryMail" type="primary">
                    {{ t('query') }}
                  </n-button>
                </n-input-group>
              </div>
              <MailBox
                :key="mailBoxKey"
                :showEMailTo="false"
                :showReply="openSettings.enableSendMail"
                :showSaveS3="openSettings.isS3Enabled"
                :saveToS3="saveToS3"
                :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
                :fetchMailData="fetchMailData"
                :deleteMail="deleteMail"
                :showFilterInput="true"
              />
            </div>

            <div v-else-if="indexTab === 'sendbox'" class="workspace-page boxed-page">
              <SendBox :fetchMailData="fetchSenboxData" :enableUserDeleteEmail="openSettings.enableUserDeleteEmail" :deleteMail="deleteSenboxMail" />
            </div>

            <div v-else-if="indexTab === 'sendmail'" class="workspace-page boxed-page">
              <SendMail />
            </div>

            <div v-else-if="indexTab === 'accountSettings'" class="workspace-page boxed-page">
              <AccountSettings />
            </div>

            <div v-else-if="indexTab === 'appearance'" class="workspace-page boxed-page">
              <Appearance :showUseSimpleIndex="true" />
            </div>

            <div v-else-if="indexTab === 'auto_reply'" class="workspace-page boxed-page">
              <AutoReply />
            </div>

            <div v-else-if="indexTab === 'webhook'" class="workspace-page boxed-page">
              <Webhook />
            </div>

            <div v-else-if="indexTab === 's3_attachment'" class="workspace-page boxed-page">
              <Attachment />
            </div>

            <div v-else-if="indexTab === 'about'" class="workspace-page boxed-page">
              <About />
            </div>
          </template>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.workspace-shell {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

.workspace-sidebar {
  position: sticky;
  top: 0;
  width: 240px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-top {
  padding: 18px 16px 14px;
  border-bottom: 1px solid #eef2f7;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-logo-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.brand-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.brand-subtitle {
  margin-top: 2px;
  font-size: 14px;
  color: #94a3b8;
}

.sidebar-body {
  flex: 1;
  padding: 14px 10px;
  overflow: auto;
}

.sidebar-section + .sidebar-section {
  margin-top: 16px;
}

.secondary-section {
  padding-top: 16px;
  border-top: 1px solid #eef2f7;
}

.sidebar-link,
.mobile-nav-item,
.sidebar-meta-link {
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  cursor: pointer;
}

.sidebar-link {
  padding: 11px 12px;
  border-radius: 12px;
  color: #6b7280;
  transition: all 0.15s ease;
}

.sidebar-link + .sidebar-link {
  margin-top: 6px;
}

.sidebar-link:hover,
.mobile-nav-item:hover,
.sidebar-meta-link:hover {
  background: #f8fafc;
  color: #1f2937;
}

.sidebar-link.active,
.mobile-nav-item.active {
  background: #ede9fe;
  color: #6366f1;
  font-weight: 600;
}

.primary-link {
  font-size: 16px;
}

.subtle-link {
  font-size: 15px;
}

.sidebar-bottom {
  padding: 14px 14px 18px;
  border-top: 1px solid #eef2f7;
}

.sidebar-meta-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #9ca3af;
}

.sidebar-meta-link {
  padding: 8px 4px;
  border-radius: 8px;
  color: #6b7280;
  font-size: 14px;
}

.sidebar-copyright {
  margin-top: 14px;
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.5;
}

.workspace-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mobile-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 12px 0;
}

.mobile-nav-item {
  width: auto;
  white-space: nowrap;
  padding: 10px 14px;
  border: 1px solid #dbe3f1;
  border-radius: 999px;
  background: #fff;
  flex-shrink: 0;
  color: #64748b;
}

.workspace-content {
  flex: 1;
  min-height: 0;
  padding: 18px;
}

.workspace-page {
  min-height: calc(100vh - 88px);
}

.boxed-page {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 32px rgba(15, 23, 42, 0.04);
}

.mailbox-page {
  min-height: calc(100vh - 88px);
}

.mail-query-row {
  margin-bottom: 14px;
}

.empty-workspace-state {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .workspace-shell {
    display: block;
  }

  .workspace-content {
    padding: 12px;
  }

  .workspace-page {
    min-height: auto;
  }

  .boxed-page {
    border-radius: 16px;
    padding: 14px;
  }
}
</style>
