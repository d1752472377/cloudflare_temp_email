"use client"

import { useMemo } from "react"
import { Archive, Copy, Forward, Paperclip, Reply, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { extractVerificationCodes } from "@/lib/verification-code"

type MailItem = {
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

type MailDetailProps = {
  mail: MailItem | undefined | null
}

function VerificationCodeCard({ body }: { body: string[] }) {
  const codes = useMemo(() => {
    const text = body.join("\n")
    return extractVerificationCodes(text)
  }, [body])

  if (codes.length === 0) return null

  return (
    <Card className="border-amber-400/50 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/20">
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            验证码
          </span>
          <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
            检测到以下验证码，点击即可复制
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {codes.map(({ code }) => (
            <Button
              key={code}
              variant="outline"
              size="lg"
              className="border-amber-300 bg-white font-mono text-base font-bold tracking-widest text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
              onClick={() => {
                navigator.clipboard.writeText(code)
                toast.success(`已复制: ${code}`)
              }}
            >
              <Copy className="mr-2 size-4" />
              {code}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MailDetail({ mail }: MailDetailProps) {
  if (!mail) {
    return (
      <div className="flex h-full items-center justify-center">
        <Empty className="border-none">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Reply />
            </EmptyMedia>
            <EmptyTitle>未选择邮件</EmptyTitle>
            <EmptyDescription>从左侧列表中选择一封邮件查看详情。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-4 py-2">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="归档">
                <Archive />
              </Button>
            }
          />
          <TooltipContent>归档</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="删除">
                <Trash2 />
              </Button>
            }
          />
          <TooltipContent>删除</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="加星标">
                <Star />
              </Button>
            }
          />
          <TooltipContent>加星标</TooltipContent>
        </Tooltip>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Reply data-icon="inline-start" />
            回复
          </Button>
          <Button variant="outline" size="sm">
            <Forward data-icon="inline-start" />
            转发
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Verification Code Card */}
          <VerificationCodeCard body={mail.body} />

          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <h1 className="text-balance text-xl font-semibold">
                {mail.subject}
              </h1>
              {mail.starred ? (
                <Star className="mt-1 size-4 shrink-0 fill-amber-400 text-amber-400" />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {mail.labels.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {mail.from.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{mail.from}</span>
                <span className="truncate text-xs text-muted-foreground">
                  &lt;{mail.fromAddress}&gt;
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                发送给 我 · {mail.time}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground">
            {mail.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {mail.hasAttachment ? (
            <div className="flex flex-col gap-2">
              <Separator />
              <span className="text-xs font-medium text-muted-foreground">
                附件
              </span>
              <div className="flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-2">
                <Paperclip className="size-4 text-muted-foreground" />
                <span className="text-sm">附件</span>
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}
