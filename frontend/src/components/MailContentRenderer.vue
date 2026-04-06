<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CloudDownloadRound,
  ReplyFilled,
  ForwardFilled,
  FullscreenRound,
  DeleteForeverRound,
} from '@vicons/material'
import { MailOutline, CalendarOutline } from '@vicons/ionicons5'
import ShadowHtmlComponent from './ShadowHtmlComponent.vue'
import AiExtractInfo from './AiExtractInfo.vue'
import { getDownloadEmlUrl } from '../utils/email-parser'
import { utcToLocalDate } from '../utils'
import { useGlobalState } from '../store'

const { preferShowTextMail, useIframeShowMail, useUTCDate, isDark } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: {
      delete: 'Delete',
      deleteMailTip: 'Are you sure you want to delete mail?',
      attachments: 'Attachments',
      downloadMail: 'Download .eml',
      reply: 'Reply',
      forward: 'Forward',
      showTextMail: 'Text',
      showHtmlMail: 'HTML',
      saveToS3: 'Save to S3',
      size: 'Size',
      fullscreen: 'Fullscreen',
      from: 'From',
      to: 'To',
      received: 'Received',
      messageId: 'Message ID',
    },
    zh: {
      delete: '删除',
      deleteMailTip: '确定要删除邮件吗?',
      attachments: '附件',
      downloadMail: '下载 .eml',
      reply: '回复',
      forward: '转发',
      showTextMail: '文本',
      showHtmlMail: 'HTML',
      saveToS3: '保存到S3',
      size: '大小',
      fullscreen: '全屏',
      from: '发件人',
      to: '收件地址',
      received: '接收时间',
      messageId: '邮件 ID',
    },
  },
})

const props = defineProps({
  mail: {
    type: Object,
    required: true,
  },
  showEMailTo: {
    type: Boolean,
    default: true,
  },
  enableUserDeleteEmail: {
    type: Boolean,
    default: false,
  },
  showReply: {
    type: Boolean,
    default: false,
  },
  showSaveS3: {
    type: Boolean,
    default: false,
  },
  onDelete: {
    type: Function,
    default: () => {},
  },
  onReply: {
    type: Function,
    default: () => {},
  },
  onForward: {
    type: Function,
    default: () => {},
  },
  onSaveToS3: {
    type: Function,
    default: () => {},
  },
})

const showTextMail = ref(preferShowTextMail.value)
const showAttachments = ref(false)
const curAttachments = ref([])
const attachmentLoding = ref(false)
const showFullscreen = ref(false)

const handleDelete = () => props.onDelete()
const handleViewAttachments = () => {
  curAttachments.value = props.mail.attachments
  showAttachments.value = true
}
const handleReply = () => props.onReply()
const handleForward = () => props.onForward()

const handleSaveToS3 = async (filename, blob) => {
  attachmentLoding.value = true
  try {
    await props.onSaveToS3(filename, blob)
  } finally {
    attachmentLoding.value = false
  }
}
</script>

<template>
  <div class="mail-detail-shell">
    <div class="mail-detail-actions secondary-actions">
      <div class="action-left">
        <n-button v-if="showReply" quaternary class="detail-action-btn" @click="handleReply">
          <template #icon>
            <n-icon :component="ReplyFilled" />
          </template>
          {{ t('reply') }}
        </n-button>
        <n-button v-if="showReply" quaternary class="detail-action-btn" @click="handleForward">
          <template #icon>
            <n-icon :component="ForwardFilled" />
          </template>
          {{ t('forward') }}
        </n-button>
        <n-button v-if="mail.attachments && mail.attachments.length > 0" quaternary class="detail-action-btn" @click="handleViewAttachments">
          {{ t('attachments') }}
        </n-button>
      </div>

      <div class="action-right">
        <n-button quaternary class="detail-action-btn" @click="showTextMail = !showTextMail">
          {{ showTextMail ? t('showHtmlMail') : t('showTextMail') }}
        </n-button>
        <n-button quaternary class="detail-action-btn" @click="showFullscreen = true">
          <template #icon>
            <n-icon :component="FullscreenRound" />
          </template>
          {{ t('fullscreen') }}
        </n-button>
      </div>
    </div>

    <div class="mail-main-card">
      <div class="mail-main-header">
        <div class="mail-subject">{{ mail.subject || '(No Subject)' }}</div>
        <div class="mail-sender-row">
          <div class="mail-avatar">{{ (mail.source || '?').slice(0, 1).toUpperCase() }}</div>
          <div class="mail-sender-copy">
            <div class="mail-sender-name">{{ mail.source }}</div>
            <div class="mail-sender-time">{{ utcToLocalDate(mail.created_at, useUTCDate.value) }}</div>
          </div>
        </div>
      </div>

      <div class="mail-meta-card">
        <div class="meta-item">
          <div class="meta-label"><n-icon :component="MailOutline" /> {{ t('from') }}</div>
          <div class="meta-value">{{ mail.source }}</div>
        </div>
        <div v-if="showEMailTo" class="meta-item">
          <div class="meta-label"><n-icon :component="MailOutline" /> {{ t('to') }}</div>
          <div class="meta-value">{{ mail.address }}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label"><n-icon :component="CalendarOutline" /> {{ t('received') }}</div>
          <div class="meta-value">{{ utcToLocalDate(mail.created_at, useUTCDate.value) }}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">{{ t('messageId') }}</div>
          <div class="meta-value">{{ mail.id }}</div>
        </div>
      </div>

      <div class="mail-ai-card">
        <AiExtractInfo :metadata="mail.metadata" />
      </div>

      <div class="mail-body-card" :class="{ 'dark-mode': isDark }">
        <pre v-if="showTextMail" class="mail-text">{{ mail.text }}</pre>
        <iframe v-else-if="useIframeShowMail" :srcdoc="mail.message" class="mail-iframe"></iframe>
        <ShadowHtmlComponent v-else :key="mail.id" :htmlContent="mail.message" :isDark="isDark" class="mail-html" />
      </div>
    </div>
  </div>

  <n-drawer v-model:show="showFullscreen" width="100%" placement="bottom" :trap-focus="false" :block-scroll="false" style="height: 100vh;">
    <n-drawer-content :title="mail.subject" closable>
      <div class="fullscreen-mail-content" :class="{ 'dark-mode': isDark }">
        <pre v-if="showTextMail" class="mail-text">{{ mail.text }}</pre>
        <iframe v-else-if="useIframeShowMail" :srcdoc="mail.message" class="mail-iframe"></iframe>
        <ShadowHtmlComponent v-else :key="mail.id" :htmlContent="mail.message" :isDark="isDark" class="mail-html" />
      </div>
    </n-drawer-content>
  </n-drawer>

  <n-modal v-model:show="showAttachments" preset="dialog" :title="t('attachments')">
    <n-spin v-model:show="attachmentLoding">
      <n-list hoverable clickable>
        <n-list-item v-for="row in curAttachments" :key="row.id">
          <n-thing class="center" :title="row.filename">
            <template #description>
              <n-space>
                <n-tag type="info">
                  {{ t('size') }}: {{ row.size }}
                </n-tag>
                <n-button v-if="showSaveS3" @click="handleSaveToS3(row.filename, row.blob)" ghost type="info" size="small">
                  {{ t('saveToS3') }}
                </n-button>
              </n-space>
            </template>
          </n-thing>
          <template #suffix>
            <n-button tag="a" target="_blank" tertiary type="info" size="small" :download="row.filename" :href="row.url">
              <n-icon :component="CloudDownloadRound" />
            </n-button>
          </template>
        </n-list-item>
      </n-list>
    </n-spin>
  </n-modal>
</template>

<style scoped>
.mail-detail-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mail-detail-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.action-left,
.action-right {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-action-btn {
  border-radius: 12px;
}

.mail-main-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  padding: 24px;
  box-shadow: 0 10px 32px rgba(15, 23, 42, 0.04);
}

.mail-main-header {
  margin-bottom: 18px;
}

.mail-subject {
  font-size: 28px;
  line-height: 1.3;
  font-weight: 800;
  color: #111827;
}

.mail-sender-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 18px;
}

.mail-avatar {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: #dbe7ff;
  color: #315efb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.mail-sender-copy {
  min-width: 0;
}

.mail-sender-name {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  word-break: break-word;
}

.mail-sender-time {
  margin-top: 4px;
  font-size: 13px;
  color: #9ca3af;
}

.mail-meta-card {
  display: grid;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 16px;
  background: #f3f4f6;
}

.meta-item {
  display: grid;
  grid-template-columns: 108px 1fr;
  gap: 14px;
}

.meta-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
}

.meta-value {
  font-size: 14px;
  color: #111827;
  word-break: break-word;
}

.mail-ai-card {
  margin-top: 16px;
}

.mail-body-card {
  margin-top: 16px;
  background: #fff;
  border: 1px solid #edf2f7;
  border-radius: 16px;
  min-height: 360px;
  overflow: hidden;
}

.mail-text {
  margin: 0;
  padding: 20px;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.7;
}

.mail-iframe {
  width: 100%;
  min-height: 72vh;
  border: 0;
}

.mail-html {
  min-height: 72vh;
}

.fullscreen-mail-content {
  height: 100%;
  overflow: auto;
}

@media (max-width: 768px) {
  .mail-main-card {
    padding: 16px;
    border-radius: 16px;
  }

  .mail-subject {
    font-size: 22px;
  }

  .meta-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
