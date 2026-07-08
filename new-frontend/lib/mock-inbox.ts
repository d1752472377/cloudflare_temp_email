// 纯静态假数据,仅用于界面视觉稿展示,不含任何业务逻辑或接口调用。

export type MockMail = {
  id: string
  from: string
  fromAddress: string
  subject: string
  preview: string
  body: string[]
  time: string
  unread: boolean
  starred: boolean
  hasAttachment: boolean
  labels: string[]
}

export const mailboxAddress = "quiet-otter-9f3a@relay.mask.mail"

export const folders = [
  { key: "inbox", label: "收件箱", count: 12 },
  { key: "sent", label: "发件箱", count: 0 },
  { key: "drafts", label: "草稿", count: 2 },
  { key: "auto-reply", label: "自动回复", count: 0 },
  { key: "webhook", label: "Webhook", count: 0 },
  { key: "archive", label: "归档", count: 48 },
  { key: "trash", label: "回收站", count: 3 },
]

export const mockMails: MockMail[] = [
  {
    id: "m1",
    from: "GitHub",
    fromAddress: "noreply@github.com",
    subject: "[security] 新的登录来自未知设备",
    preview: "我们检测到你的账户在一台新设备上登录,如果这不是你本人操作,请立即修改密码。",
    body: [
      "你好,",
      "我们检测到你的 GitHub 账户在一台新设备上完成了登录。",
      "设备:MacBook Pro · 位置:Singapore · 时间:今天 09:41",
      "如果这是你本人操作,可以忽略本邮件。否则请立即重置密码并启用双重验证。",
    ],
    time: "09:41",
    unread: true,
    starred: false,
    hasAttachment: false,
    labels: ["安全"],
  },
  {
    id: "m2",
    from: "Vercel",
    fromAddress: "notifications@vercel.com",
    subject: "你的部署已上线 ✓",
    preview: "项目 anon-mailbox 的最新提交已成功部署到生产环境。",
    body: [
      "部署成功!",
      "项目:anon-mailbox",
      "分支:main · 提交:a3f9c21",
      "生产地址已更新,平均构建耗时 38 秒。",
    ],
    time: "08:12",
    unread: true,
    starred: true,
    hasAttachment: false,
    labels: ["部署"],
  },
  {
    id: "m3",
    from: "设计周报",
    fromAddress: "weekly@designdigest.io",
    subject: "本周 12 个值得收藏的界面设计",
    preview: "从数据仪表盘到极简落地页,我们精选了本周社区里最亮眼的作品。",
    body: [
      "本周精选来啦!",
      "这一期我们重点关注了邮箱类产品的信息密度与留白平衡。",
      "点击查看完整合集,记得收藏。",
    ],
    time: "昨天",
    unread: false,
    starred: false,
    hasAttachment: true,
    labels: ["订阅"],
  },
  {
    id: "m4",
    from: "招聘助手",
    fromAddress: "jobs@hiretalent.co",
    subject: "有一个高级前端职位可能适合你",
    preview: "根据你的匿名简历,我们为你匹配到一个远程高级前端工程师岗位。",
    body: [
      "你好,",
      "我们发现一个可能适合你的机会:高级前端工程师(全远程)。",
      "薪资范围有竞争力,团队使用 React 与 TypeScript。",
      "回复本邮件即可开始匿名沟通。",
    ],
    time: "昨天",
    unread: false,
    starred: false,
    hasAttachment: false,
    labels: ["机会"],
  },
  {
    id: "m5",
    from: "银行账单",
    fromAddress: "statement@bankmail.com",
    subject: "6 月对账单已生成",
    preview: "你的 6 月账单已经准备好,请查看附件了解本期消费明细。",
    body: [
      "尊敬的用户,",
      "你的 6 月对账单已生成,共计 14 笔交易。",
      "详情请查看附件 PDF。",
    ],
    time: "6月28日",
    unread: false,
    starred: false,
    hasAttachment: true,
    labels: ["账单"],
  },
  {
    id: "m6",
    from: "论坛通知",
    fromAddress: "digest@forum.dev",
    subject: "有 3 个人回复了你的帖子",
    preview: "你关注的话题「如何优雅地处理匿名邮箱转发」有了新的讨论。",
    body: [
      "你关注的话题有新回复:",
      "「如何优雅地处理匿名邮箱转发」",
      "共有 3 条新回复,点击查看讨论详情。",
    ],
    time: "6月27日",
    unread: false,
    starred: false,
    hasAttachment: false,
    labels: ["社区"],
  },
]
