"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { ConsolePage } from "@/components/console/console-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function AdminAccountPage() {
  // Check admin auth status from localStorage
  const hasAdminAuth = typeof window !== "undefined" && !!localStorage.getItem("adminAuth")

  return (
    <ConsolePage title="管理员账户" description="管理员账户信息">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">管理员状态</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">登录状态:</span>
            <Badge variant={hasAdminAuth ? "secondary" : "destructive"}>
              {hasAdminAuth ? "已登录" : "未登录"}
            </Badge>
          </div>
          <Separator />
          <div className="text-sm text-muted-foreground">
            管理员拥有系统的完全访问权限，可以管理邮箱、用户和系统设置。
          </div>
        </CardContent>
      </Card>
    </ConsolePage>
  )
}
