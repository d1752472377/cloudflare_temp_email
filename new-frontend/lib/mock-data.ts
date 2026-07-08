// 纯静态假数据,仅用于界面视觉稿展示,不含任何业务逻辑或接口调用。

export const siteDomains = [
  "relay.mask.mail",
  "inbox.ghost.email",
  "temp.cloak.dev",
]

export type SentMail = {
  id: string
  to: string
  subject: string
  preview: string
  time: string
  status: "已送达" | "发送中" | "待审批"
}

export const mockSentMails: SentMail[] = [
  {
    id: "s1",
    to: "team@startup.io",
    subject: "Re: 合作方案初稿",
    preview: "附件是我们这边整理的方案初稿,方便的话本周约个会。",
    time: "10:24",
    status: "已送达",
  },
  {
    id: "s2",
    to: "support@service.com",
    subject: "关于账户导出的问题",
    preview: "想确认一下数据导出的格式是否支持 CSV。",
    time: "昨天",
    status: "已送达",
  },
  {
    id: "s3",
    to: "hello@newsletter.co",
    subject: "退订请求",
    preview: "请将本邮箱从订阅列表中移除,谢谢。",
    time: "6月26日",
    status: "待审批",
  },
]

export type MockAttachment = {
  id: string
  name: string
  size: string
  type: string
  date: string
}

export const mockAttachments: MockAttachment[] = [
  { id: "a1", name: "方案初稿.pdf", size: "1.2 MB", type: "PDF", date: "今天" },
  { id: "a2", name: "对账单-6月.pdf", size: "486 KB", type: "PDF", date: "昨天" },
  { id: "a3", name: "界面截图.png", size: "820 KB", type: "图片", date: "6月27日" },
  { id: "a4", name: "合同模板.docx", size: "64 KB", type: "文档", date: "6月20日" },
]

export type BoundAddress = {
  id: string
  address: string
  label: string
  mailCount: number
  isPrimary: boolean
}

export const mockAddresses: BoundAddress[] = [
  {
    id: "ad1",
    address: "quiet-otter-9f3a@relay.mask.mail",
    label: "主力邮箱",
    mailCount: 128,
    isPrimary: true,
  },
  {
    id: "ad2",
    address: "shopping-cart-2b7d@temp.cloak.dev",
    label: "购物专用",
    mailCount: 42,
    isPrimary: false,
  },
  {
    id: "ad3",
    address: "job-hunt-1c5e@inbox.ghost.email",
    label: "求职",
    mailCount: 17,
    isPrimary: false,
  },
]

export type Passkey = {
  id: string
  name: string
  device: string
  lastUsed: string
}

export const mockPasskeys: Passkey[] = [
  { id: "pk1", name: "MacBook Pro", device: "Touch ID", lastUsed: "今天 09:12" },
  { id: "pk2", name: "iPhone 15", device: "Face ID", lastUsed: "昨天" },
  { id: "pk3", name: "YubiKey 5C", device: "硬件密钥", lastUsed: "6月18日" },
]

// ---- 管理后台 ----

export const adminStats = [
  { label: "邮箱地址", value: "8,421", delta: "+2.4%" },
  { label: "今日收件", value: "31,208", delta: "+11.7%" },
  { label: "注册用户", value: "1,904", delta: "+0.8%" },
  { label: "存储用量", value: "214 GB", delta: "+3.1%" },
]

export type AdminAddress = {
  id: string
  address: string
  owner: string
  mails: number
  created: string
  status: "正常" | "已禁用"
}

export const mockAdminAddresses: AdminAddress[] = [
  { id: "1", address: "quiet-otter-9f3a@relay.mask.mail", owner: "user_1042", mails: 128, created: "2024-03-11", status: "正常" },
  { id: "2", address: "shopping-cart-2b7d@temp.cloak.dev", owner: "user_1042", mails: 42, created: "2024-04-02", status: "正常" },
  { id: "3", address: "spam-trap-88@relay.mask.mail", owner: "—", mails: 993, created: "2024-01-20", status: "已禁用" },
  { id: "4", address: "beta-tester-x1@inbox.ghost.email", owner: "user_2210", mails: 7, created: "2024-06-15", status: "正常" },
  { id: "5", address: "newsletter-only@temp.cloak.dev", owner: "user_1770", mails: 351, created: "2024-02-08", status: "正常" },
]

export type AdminUser = {
  id: string
  username: string
  email: string
  role: "管理员" | "普通用户" | "只读"
  addresses: number
  joined: string
}

export const mockAdminUsers: AdminUser[] = [
  { id: "u1", username: "alice", email: "alice@work.com", role: "管理员", addresses: 3, joined: "2023-11-02" },
  { id: "u2", username: "bob_dev", email: "bob@dev.io", role: "普通用户", addresses: 5, joined: "2024-01-18" },
  { id: "u3", username: "carol", email: "carol@mail.com", role: "普通用户", addresses: 2, joined: "2024-03-27" },
  { id: "u4", username: "audit_bot", email: "audit@ops.internal", role: "只读", addresses: 0, joined: "2024-05-09" },
]

export const mockRoles = [
  { name: "管理员", users: 2, desc: "完全访问所有资源与设置" },
  { name: "普通用户", users: 1780, desc: "管理自己名下的邮箱与邮件" },
  { name: "只读", users: 12, desc: "仅可查看,不可修改" },
]
