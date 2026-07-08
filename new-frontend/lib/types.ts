// API 类型定义,匹配 worker 后端响应格式

// ---- 通用 ----
export interface PaginatedResponse<T> {
  results: T[]
  count: number
}

// ---- 认证 ----
export interface UserLoginResponse {
  jwt: string
}

export interface UserSettingsResponse {
  user_id: number
  user_email: string
  is_admin: boolean
  access_token: string | null
  new_user_token: string | null
  user_role: {
    role: string
    prefix?: string
    domains?: string[]
  } | null
}

export interface AddressLoginResponse {
  jwt: string
  address: string
  address_id: number
  password?: string
}

export interface OpenSettings {
  enable: boolean
  enableMailVerify: boolean
  oauth2ClientIDs: Array<{ clientID: string; name: string; icon?: string }>
  title?: string
  domains?: string[]
  domainLabels?: string[]
  defaultDomains?: string[]
  randomSubdomainDomains?: string[]
  version?: string
  prefix?: string
  minAddressLen?: number
  maxAddressLen?: number
  needAuth?: boolean
  adminContact?: string
  enableUserCreateEmail?: boolean
  disableAnonymousUserCreateEmail?: boolean
  requireUserLogin?: boolean
  disableCustomAddressName?: boolean
  enableUserDeleteEmail?: boolean
  enableAutoReply?: boolean
  enableIndexAbout?: boolean
  copyright?: string
  cfTurnstileSiteKey?: string
  enableWebhook?: boolean
  isS3Enabled?: boolean
  enableSendMail?: boolean
  showGithubForUser?: boolean
  enableAddressPassword?: boolean
  enableAgentEmailInfo?: boolean
  smtpImapProxyConfig?: {
    smtp: { host: string; port: number; starttls: boolean }
    imap: { host: string; port: number; starttls: boolean }
  }
  statusUrl?: string
  enableGlobalTurnstileCheck?: boolean
  announcement?: string
  alwaysShowAnnouncement?: boolean
}

// ---- 邮箱地址 (user_api) ----
export interface BoundAddress {
  id: number
  name: string
  mail_count: number
  send_count: number
  created_at: string
  updated_at: string
}

export interface BindAddressJwtResponse {
  jwt: string
}

// ---- 邮件 (user_api) ----
export interface RawMail {
  id: number
  message_id: string
  source: string
  address: string
  raw: string
  metadata: string
  created_at: string
}

// ---- Passkey ----
export interface PasskeyInfo {
  passkey_name: string
  passkey_id: string
  created_at: string
  updated_at: string
}

export interface PasskeyRegisterRequest {
  challenge: string
  rp: { name: string; id: string }
  user: { id: string; name: string; displayName: string }
  pubKeyCredParams: Array<{ alg: number; type: string }>
  timeout: number
  attestation: string
}

export interface PasskeyRegisterResponse {
  credential: Record<string, unknown>
  origin: string
  passkey_name: string
}

// ---- 管理后台: 统计 ----
export interface AdminStatistics {
  mailCount: number
  addressCount: number
  activeAddressCount7days: number
  activeAddressCount30days: number
  userCount: number
  sendMailCount: number
}

// ---- 管理后台: 地址 ----
export interface AdminAddress {
  id: number
  name: string
  mail_count: number
  send_count: number
  created_at: string
  updated_at: string
  source_meta?: string
}

export interface AdminNewAddressRequest {
  name?: string
  domain?: string
  enablePrefix?: boolean
  enableRandomSubdomain?: boolean
}

export interface AdminResetPasswordRequest {
  password: string
}

// ---- 管理后台: 用户 ----
export interface AdminUser {
  id: number
  user_email: string
  created_at: string
  updated_at: string
  role_text: string | null
  address_count: number
}

export interface AdminCreateUserRequest {
  user_email: string
  password: string
}

// ---- 管理后台: 角色 ----
export interface UserRole {
  role: string
  prefix: string | null
  domains: string[]
}

export interface RoleAddressConfig {
  [role: string]: {
    maxAddressCount: number
  }
}

// ---- 管理后台: 发件权限 ----
export interface AddressSender {
  id: number
  address: string
  balance: number
  enabled: boolean
}

// ---- 管理后台: 发件箱 ----
export interface SendboxMail {
  id: number
  address: string
  raw?: string
  created_at: string
}

// ---- 管理后台: 设置 ----
export interface AccountSettings {
  blockAddressList: string[]
  blockSendList: string[]
  enableBlockAddress: boolean
  enableBlockSend: boolean
  enableVerifyAddress: boolean
  verifiedMailList: string[]
  enableMailVerify: boolean
  enableAddressCreation: boolean
  enablePrefix: boolean
  enableRandomSubdomain: boolean
  maxAddressCount: number
  enableSendAddressAutoClean: boolean
  sendAddressAutoCleanDays: number
  enableDeleteSendingDomainAddress: boolean
  enableDeleteAllDomainAddress: boolean
}

export interface UserSettings {
  enableUserRegister: boolean
  enableUserCreateEmail: boolean
  enableUserChangePassword: boolean
  enableMailVerify: boolean
}

export interface OAuth2Provider {
  name: string
  clientID: string
  clientSecret: string
  authorizationURL: string
  tokenURL: string
  userInfoURL: string
  scope: string
  enabled: boolean
}

export interface IpBlacklistSettings {
  enableIpBlacklist: boolean
  ipBlacklist: string[]
  enableAsnBlacklist: boolean
  asnBlacklist: string[]
  enableFingerprintBlacklist: boolean
  fingerprintBlacklist: string[]
  ipWhitelist: string[]
  enableDailyRequestLimit: boolean
  dailyRequestLimit: number
}

export interface AiExtractSettings {
  enabled: boolean
  allowList: string[]
  model?: string
}

export interface AdminWebhookSettings {
  enableAllowList: boolean
  allowList: string[]
}

export interface WebhookSettings {
  enabled: boolean
  url: string
  method: string
  headers: string
  body: string
}

export interface TelegramSettings {
  enableTelegramAllowList: boolean
  telegramAllowList: string[]
  miniAppUrl: string
  enableGlobalMailPush: boolean
}

export interface TelegramStatus {
  webhookInfo: Record<string, unknown>
  commands: Array<{ command: string; description: string }>
}

// ---- 管理后台: 数据库 ----
export interface DbVersion {
  need_initialization: boolean
  need_migration: boolean
  current_db_version: number
  code_db_version: number
}

// ---- 管理后台: Worker 配置 ----
export interface WorkerConfigs {
  [key: string]: string | number | boolean | null
}

// ---- 管理后台: 清理 ----
export interface AutoCleanupSettings {
  enableAutoCleanup: boolean
  cleanInactiveAddress: boolean
  cleanInactiveAddressDays: number
  cleanMails: boolean
  cleanMailsDays: number
  cleanSendbox: boolean
  cleanSendboxDays: number
  cleanUnknownMails: boolean
  cleanUnknownMailsDays: number
  cleanIpList: boolean
  cleanIpListDays: number
  customCleanSql: string[]
}

export interface CleanupRequest {
  cleanType: string
  cleanDays: number
}

// ---- Telegram Mini App ----
export interface TelegramBindAddress {
  address: string
  address_id: number
  jwt: string
}
