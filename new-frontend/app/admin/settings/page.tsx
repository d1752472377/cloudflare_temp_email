"use client"

import { ConsolePage } from "@/components/console/console-page"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QuickSetup } from "@/components/admin/settings/quick-setup"
import { SiteSettings } from "@/components/admin/settings/site-settings"
import { UserSettingsPanel } from "@/components/admin/settings/user-settings"
import { OAuth2Settings } from "@/components/admin/settings/oauth2-settings"
import { IpBlacklistSettings } from "@/components/admin/settings/ip-blacklist"
import { AiExtractSettings } from "@/components/admin/settings/ai-extract-settings"
import { WebhookSettingsPanel } from "@/components/admin/settings/webhook-settings"
import { TelegramSettingsPanel } from "@/components/admin/settings/telegram-settings"
import { AppearanceSettings } from "@/components/admin/settings/appearance-settings"

export default function SettingsPage() {
  return (
    <ConsolePage title="系统设置" description="管理站点、用户、OAuth2、AI、Webhook 等设置">
      <Tabs defaultValue="quick-setup">
        <TabsList>
          <TabsTrigger value="quick-setup">快速设置</TabsTrigger>
          <TabsTrigger value="site">站点设置</TabsTrigger>
          <TabsTrigger value="user">用户模块</TabsTrigger>
          <TabsTrigger value="oauth2">OAuth2</TabsTrigger>
          <TabsTrigger value="ip">IP 黑名单</TabsTrigger>
          <TabsTrigger value="ai">AI 提取</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="appearance">外观</TabsTrigger>
        </TabsList>
        <TabsContent value="quick-setup"><QuickSetup /></TabsContent>
        <TabsContent value="site"><SiteSettings /></TabsContent>
        <TabsContent value="user"><UserSettingsPanel /></TabsContent>
        <TabsContent value="oauth2"><OAuth2Settings /></TabsContent>
        <TabsContent value="ip"><IpBlacklistSettings /></TabsContent>
        <TabsContent value="ai"><AiExtractSettings /></TabsContent>
        <TabsContent value="webhook"><WebhookSettingsPanel /></TabsContent>
        <TabsContent value="telegram"><TelegramSettingsPanel /></TabsContent>
        <TabsContent value="appearance"><AppearanceSettings /></TabsContent>
      </Tabs>
    </ConsolePage>
  )
}
