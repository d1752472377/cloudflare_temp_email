<script setup>
import { watch, onMounted, ref, onBeforeUnmount, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import {
  CloudDownloadRound,
  ArrowBackIosNewFilled,
  DeleteForeverRound,
  InboxRound,
  RefreshRound,
  CheckBoxRound,
  CheckBoxOutlineBlankRound,
} from '@vicons/material'
import { SearchOutline, Ellipse, MailOutline } from '@vicons/ionicons5'
import { useIsMobile } from '../utils/composables'
import { processItem, getDownloadEmlUrl } from '../utils/email-parser'
import { utcToLocalDate } from '../utils'
import { buildReplyModel, buildForwardModel } from '../utils/mail-actions'
import MailContentRenderer from './MailContentRenderer.vue'
import AiExtractInfo from './AiExtractInfo.vue'

const message = useMessage()
const isMobile = useIsMobile()

const props = defineProps({
  enableUserDeleteEmail: {
    type: Boolean,
    default: false,
    required: false,
  },
  showEMailTo: {
    type: Boolean,
    default: true,
    required: false,
  },
  fetchMailData: {
    type: Function,
    default: () => {},
    required: true,
  },
  deleteMail: {
    type: Function,
    default: () => {},
    required: false,
  },
  showReply: {
    type: Boolean,
    default: false,
    required: false,
  },
  showSaveS3: {
    type: Boolean,
    default: false,
    required: false,
  },
  saveToS3: {
    type: Function,
    default: (mail_id, filename, blob) => {},
    required: false,
  },
  showFilterInput: {
    type: Boolean,
    default: false,
    required: false,
  },
})

const localFilterKeyword = ref('')

const {
  indexTab,
  loading,
  useUTCDate,
  autoRefresh,
  configAutoRefreshInterval,
  sendMailModel,
} = useGlobalState()
const rawData = ref([])
const timer = ref(null)

const count = ref(0)
const page = ref(1)
const pageSize = ref(20)
const showRefreshingToast = ref(false)
let refreshingToastTimer = null

const data = computed(() => {
  if (!localFilterKeyword.value || localFilterKeyword.value.trim() === '') {
    return rawData.value
  }
  const keyword = localFilterKeyword.value.toLowerCase()
  return rawData.value.filter((mail) => {
    const searchFields = [mail.subject || '', mail.text || '', mail.message || '', mail.source || ''].map((field) => field.toLowerCase())
    return searchFields.some((field) => field.includes(keyword))
  })
})

const checkedCount = computed(() => data.value.filter((item) => item.checked).length)
const pollingActive = computed(() => autoRefresh.value)
const curMail = ref(null)

const { t } = useI18n({
  messages: {
    en: {
      success: 'Success',
      refresh: 'Refresh',
      downloadMail: 'Download Mail',
      pleaseSelectMail: 'Please select mail',
      emptyInbox: 'Your inbox is empty',
      emptyInboxSubTitle: 'New messages will appear here after the mailbox receives mail.',
      delete: 'Delete',
      deleteMailTip: 'Are you sure you want to delete mail?',
      reply: 'Reply',
      forwardMail: 'Forward',
      multiAction: 'Multi Action',
      cancelMultiAction: 'Cancel Multi Action',
      selectAll: 'Select All of This Page',
      unselectAll: 'Unselect All',
      keywordQueryTip: 'Filter current page',
      allMails: 'All mails',
      selectedMails: '{count} selected',
      totalMails: '{count} mails',
      mailList: 'Inbox',
      currentMail: 'Current Mail',
      from: 'From',
      to: 'To',
      polling: 'Polling for new mail',
      openMail: 'Open message',
      refreshingMail: 'Refreshing mails...',
      backToInbox: 'Back',
      noSubject: '(No Subject)',
    },
    zh: {
      success: '成功',
      refresh: '刷新',
      downloadMail: '下载邮件',
      pleaseSelectMail: '请选择邮件',
      emptyInbox: '收件箱为空',
      emptyInboxSubTitle: '当邮箱收到新邮件后，会显示在这里。',
      delete: '删除',
      deleteMailTip: '确定要删除邮件吗?',
      reply: '回复',
      forwardMail: '转发',
      multiAction: '多选',
      cancelMultiAction: '取消多选',
      selectAll: '全选本页',
      unselectAll: '取消全选',
      keywordQueryTip: '过滤当前页',
      allMails: '全部邮件',
      selectedMails: '已选 {count} 封',
      totalMails: '共 {count} 封',
      mailList: '收件箱',
      currentMail: '当前邮件',
      from: '发件人',
      to: '收件地址',
      polling: '正在轮询新邮件',
      openMail: '查看邮件',
      refreshingMail: '正在刷新邮件...',
      backToInbox: '返回',
      noSubject: '(无主题)',
    },
  },
})

const showRefreshingHint = () => {
  showRefreshingToast.value = true
  clearTimeout(refreshingToastTimer)
  refreshingToastTimer = setTimeout(() => {
    showRefreshingToast.value = false
  }, 1800)
}

const setupAutoRefresh = async (enabled) => {
  if (enabled) {
    clearInterval(timer.value)
    timer.value = setInterval(async () => {
      if (loading.value) return
      await backFirstPageAndRefresh(true)
    }, configAutoRefreshInterval.value * 1000)
  } else {
    clearInterval(timer.value)
    timer.value = null
  }
}

watch(autoRefresh, async (enabled) => {
  setupAutoRefresh(enabled)
}, { immediate: true })

watch([page, pageSize], async ([newPage, newPageSize], [oldPage, oldPageSize]) => {
  if (newPage !== oldPage || newPageSize !== oldPageSize) {
    await refresh()
  }
})

const refresh = async (showToast = false) => {
  try {
    if (showToast) {
      showRefreshingHint()
    }
    loading.value = true
    const { results, count: totalCount } = await props.fetchMailData(pageSize.value, (page.value - 1) * pageSize.value)
    rawData.value = await Promise.all(results.map(async (item) => {
      item.checked = false
      return await processItem(item)
    }))
    count.value = totalCount || 0
    if (curMail.value) {
      const nextCurMail = rawData.value.find((mail) => mail.id === curMail.value.id)
      curMail.value = nextCurMail || null
    }
  } catch (error) {
    message.error(error.message || 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const backFirstPageAndRefresh = async (showToast = true) => {
  page.value = 1
  await refresh(showToast)
}

const clickRow = (row) => {
  if (multiActionMode.value) {
    row.checked = !row.checked
    return
  }
  curMail.value = row
}

const deleteMail = async () => {
  try {
    await props.deleteMail(curMail.value.id)
    message.success(t('success'))
    curMail.value = null
    await refresh(true)
  } catch (error) {
    message.error(error.message || 'error')
  }
}

const replyMail = async () => {
  Object.assign(sendMailModel.value, buildReplyModel(curMail.value, t('reply')))
  indexTab.value = 'sendmail'
}

const forwardMail = async () => {
  Object.assign(sendMailModel.value, buildForwardModel(curMail.value, t('forwardMail')))
  indexTab.value = 'sendmail'
}

const saveToS3Proxy = async (filename, blob) => {
  await props.saveToS3(curMail.value.id, filename, blob)
}

const multiActionMode = ref(false)
const showMultiActionDownload = ref(false)
const showMultiActionDelete = ref(false)
const multiActionDownloadZip = ref({})
const multiActionDeleteProgress = ref({ percentage: 0, tip: '0/0' })

const multiActionModeClick = (enableMulti) => {
  data.value.forEach((item) => {
    item.checked = false
  })
  multiActionMode.value = enableMulti
}

const multiActionSelectAll = (checked) => {
  data.value.forEach((item) => {
    item.checked = checked
  })
}

const multiActionDeleteMail = async () => {
  try {
    loading.value = true
    const selectedMails = data.value.filter((item) => item.checked)
    if (selectedMails.length === 0) {
      message.error(t('pleaseSelectMail'))
      return
    }
    multiActionDeleteProgress.value = {
      percentage: 0,
      tip: `0/${selectedMails.length}`,
    }
    for (const [index, mail] of selectedMails.entries()) {
      await props.deleteMail(mail.id)
      showMultiActionDelete.value = true
      multiActionDeleteProgress.value = {
        percentage: Math.floor(((index + 1) / selectedMails.length) * 100),
        tip: `${index + 1}/${selectedMails.length}`,
      }
    }
    message.success(t('success'))
    await refresh(true)
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    loading.value = false
    showMultiActionDelete.value = true
  }
}

const multiActionDownload = async () => {
  try {
    loading.value = true
    const selectedMails = data.value.filter((item) => item.checked)
    if (selectedMails.length === 0) {
      message.error(t('pleaseSelectMail'))
      return
    }
    const JSZipModlue = await import('jszip')
    const JSZip = JSZipModlue.default
    const zip = new JSZip()
    for (const mail of selectedMails) {
      zip.file(`${mail.id}.eml`, mail.raw)
    }
    multiActionDownloadZip.value = {
      url: URL.createObjectURL(await zip.generateAsync({ type: 'blob' })),
      filename: `mails-${new Date().toISOString().replace(/:/g, '-')}.zip`,
    }
    showMultiActionDownload.value = true
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await refresh()
})

onBeforeUnmount(() => {
  clearInterval(timer.value)
  clearTimeout(refreshingToastTimer)
})
</script>

<template>
  <div class="mailbox-page-shell">
    <template v-if="curMail">
      <div class="detail-page-topbar">
        <n-button text class="back-button" @click="curMail = null">
          <template #icon>
            <n-icon>
              <ArrowBackIosNewFilled />
            </n-icon>
          </template>
          {{ t('backToInbox') }}
        </n-button>

        <div class="detail-top-actions">
          <n-popconfirm v-if="enableUserDeleteEmail" @positive-click="deleteMail">
            <template #trigger>
              <n-button type="error" secondary>
                <template #icon>
                  <n-icon :component="DeleteForeverRound" />
                </template>
                {{ t('delete') }}
              </n-button>
            </template>
            {{ t('deleteMailTip') }}
          </n-popconfirm>
          <n-button tag="a" target="_blank" type="info" secondary :download="curMail.id + '.eml'" :href="getDownloadEmlUrl(curMail.raw)">
            <template #icon>
              <n-icon :component="CloudDownloadRound" />
            </template>
            .eml
          </n-button>
        </div>
      </div>

      <MailContentRenderer
        :mail="curMail"
        :showEMailTo="showEMailTo"
        :enableUserDeleteEmail="enableUserDeleteEmail"
        :showReply="showReply"
        :showSaveS3="showSaveS3"
        :onDelete="deleteMail"
        :onReply="replyMail"
        :onForward="forwardMail"
        :onSaveToS3="saveToS3Proxy"
      />
    </template>

    <template v-else>
      <div class="mailbox-topbar">
        <div>
          <div class="mailbox-title">{{ t('mailList') }}</div>
          <div class="mailbox-subtitle-row">
            <span class="mailbox-subtitle">{{ multiActionMode ? t('selectedMails', { count: checkedCount }) : t('totalMails', { count }) }}</span>
            <span v-if="pollingActive" class="polling-chip">
              <n-icon :component="Ellipse" />
              {{ t('polling') }}
            </span>
          </div>
        </div>

        <div class="mailbox-toolbar-actions">
          <template v-if="multiActionMode">
            <n-button tertiary @click="multiActionModeClick(false)">{{ t('cancelMultiAction') }}</n-button>
            <n-button tertiary @click="multiActionSelectAll(true)">
              <template #icon>
                <n-icon :component="CheckBoxRound" />
              </template>
              {{ t('selectAll') }}
            </n-button>
            <n-button tertiary @click="multiActionSelectAll(false)">
              <template #icon>
                <n-icon :component="CheckBoxOutlineBlankRound" />
              </template>
              {{ t('unselectAll') }}
            </n-button>
            <n-popconfirm v-if="enableUserDeleteEmail" @positive-click="multiActionDeleteMail">
              <template #trigger>
                <n-button tertiary type="error">{{ t('delete') }}</n-button>
              </template>
              {{ t('deleteMailTip') }}
            </n-popconfirm>
            <n-button tertiary type="info" @click="multiActionDownload">
              <template #icon>
                <n-icon :component="CloudDownloadRound" />
              </template>
              {{ t('downloadMail') }}
            </n-button>
          </template>
          <template v-else>
            <n-button tertiary @click="multiActionModeClick(true)">{{ t('multiAction') }}</n-button>
            <n-button tertiary type="primary" @click="backFirstPageAndRefresh(true)">
              <template #icon>
                <n-icon :component="RefreshRound" />
              </template>
              {{ t('refresh') }}
            </n-button>
          </template>
        </div>
      </div>

      <div class="mailbox-filter-row">
        <n-pagination v-model:page="page" v-model:page-size="pageSize" :item-count="count" :page-sizes="[20, 50, 100]" show-size-picker />
        <n-input
          v-if="showFilterInput"
          v-model:value="localFilterKeyword"
          class="mail-search"
          :placeholder="t('keywordQueryTip')"
          clearable
        >
          <template #prefix>
            <n-icon :component="SearchOutline" />
          </template>
        </n-input>
      </div>

      <div v-if="data.length > 0" class="mail-card-list">
        <div
          v-for="row in data"
          :key="row.id"
          class="mail-preview-card"
          :class="{ selectable: multiActionMode }"
          @click="clickRow(row)"
        >
          <div v-if="multiActionMode" class="mail-checkbox" @click.stop>
            <n-checkbox v-model:checked="row.checked" />
          </div>

          <div class="mail-avatar">{{ (row.source || '?').slice(0, 1).toUpperCase() }}</div>

          <div class="mail-preview-main">
            <div class="mail-preview-top">
              <div class="mail-preview-from">{{ row.source }}</div>
              <div class="mail-preview-time">{{ utcToLocalDate(row.created_at, useUTCDate) }}</div>
            </div>
            <div class="mail-preview-subject">{{ row.subject || t('noSubject') }}</div>
            <div class="mail-preview-snippet">{{ row.text || row.message || '' }}</div>
            <div class="mail-preview-meta">
              <span class="meta-chip">
                <n-icon :component="MailOutline" />
                {{ showEMailTo ? row.address : row.source }}
              </span>
            </div>
            <div class="mail-preview-ai">
              <AiExtractInfo :metadata="row.metadata" compact />
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state-card">
        <n-result status="info" :title="t('emptyInbox')" :description="t('emptyInboxSubTitle')">
          <template #icon>
            <n-icon :component="InboxRound" :size="92" />
          </template>
          <template #footer>
            <n-button type="primary" @click="backFirstPageAndRefresh(true)">{{ t('refresh') }}</n-button>
          </template>
        </n-result>
      </div>
    </template>

    <transition name="fade">
      <div v-if="showRefreshingToast" class="refreshing-toast">
        <n-icon class="spin-icon" :component="RefreshRound" />
        <span>{{ t('refreshingMail') }}</span>
      </div>
    </transition>

    <n-modal v-model:show="showMultiActionDownload" preset="dialog" :title="t('downloadMail')">
      <n-tag type="info">
        {{ multiActionDownloadZip.filename }}
      </n-tag>
      <n-button tag="a" target="_blank" tertiary type="info" size="small" :download="multiActionDownloadZip.filename" :href="multiActionDownloadZip.url">
        <n-icon :component="CloudDownloadRound" />
        {{ t('downloadMail') + ' zip' }}
      </n-button>
    </n-modal>

    <n-modal v-model:show="showMultiActionDelete" preset="dialog" :title="t('delete') + t('success')" negative-text="OK">
      <n-space justify="center">
        <n-progress type="circle" status="error" :percentage="multiActionDeleteProgress.percentage">
          <span style="text-align: center">{{ multiActionDeleteProgress.tip }}</span>
        </n-progress>
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped>
.mailbox-page-shell {
  position: relative;
}

.mailbox-topbar,
.detail-page-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.mailbox-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
}

.mailbox-subtitle-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.mailbox-subtitle {
  font-size: 14px;
  color: #94a3b8;
}

.polling-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #16a34a;
  font-size: 13px;
  font-weight: 600;
}

.mailbox-toolbar-actions,
.detail-top-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.mailbox-filter-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.mail-search {
  width: 240px;
}

.mail-card-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mail-preview-card {
  display: flex;
  gap: 14px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: all 0.15s ease;
}

.mail-preview-card:hover {
  transform: translateY(-1px);
  border-color: #cfe0ff;
  box-shadow: 0 16px 30px rgba(49, 94, 251, 0.08);
}

.mail-checkbox {
  padding-top: 8px;
}

.mail-avatar {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  background: #dbe7ff;
  color: #315efb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 700;
  flex-shrink: 0;
}

.mail-preview-main {
  min-width: 0;
  flex: 1;
}

.mail-preview-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.mail-preview-from,
.mail-preview-subject {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mail-preview-from {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.mail-preview-time {
  flex-shrink: 0;
  font-size: 12px;
  color: #9ca3af;
}

.mail-preview-subject {
  margin-top: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.mail-preview-snippet {
  margin-top: 8px;
  color: #6b7280;
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.mail-preview-meta {
  margin-top: 12px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
}

.mail-preview-ai {
  margin-top: 10px;
}

.empty-state-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-button {
  font-size: 14px;
}

.refreshing-toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 999px;
  background: rgba(49, 94, 251, 0.82);
  color: #fff;
  backdrop-filter: blur(10px);
  box-shadow: 0 14px 32px rgba(49, 94, 251, 0.24);
}

.spin-icon {
  animation: spin 1s linear infinite;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .mailbox-title {
    font-size: 24px;
  }

  .mail-preview-top,
  .mailbox-topbar,
  .detail-page-topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .mail-search {
    width: 100%;
  }
}
</style>
