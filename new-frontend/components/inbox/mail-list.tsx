"use client"

import { Paperclip, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { MockMail } from "@/lib/mock-inbox"

type MailListProps = {
  mails: MockMail[]
  selectedId: string
  onSelect: (id: string) => void
}

export function MailList({ mails, selectedId, onSelect }: MailListProps) {
  return (
    <ScrollArea className="h-full">
      <ul className="flex flex-col">
        {mails.map((mail) => (
          <li key={mail.id}>
            <button
              type="button"
              onClick={() => onSelect(mail.id)}
              className={cn(
                "flex w-full flex-col gap-1.5 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent",
                selectedId === mail.id && "bg-accent",
              )}
            >
              <div className="flex items-center gap-2">
                {mail.unread ? (
                  <span
                    className="size-2 shrink-0 rounded-full bg-primary"
                    aria-label="未读"
                  />
                ) : (
                  <span className="size-2 shrink-0" />
                )}
                <span
                  className={cn(
                    "truncate text-sm",
                    mail.unread ? "font-semibold" : "font-medium",
                  )}
                >
                  {mail.from}
                </span>
                {mail.starred ? (
                  <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                ) : null}
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {mail.time}
                </span>
              </div>
              <p
                className={cn(
                  "truncate pl-4 text-sm",
                  mail.unread
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {mail.subject}
              </p>
              <p className="line-clamp-1 pl-4 text-xs text-muted-foreground">
                {mail.preview}
              </p>
              <div className="flex items-center gap-1.5 pl-4">
                {mail.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))}
                {mail.hasAttachment ? (
                  <Paperclip className="size-3.5 text-muted-foreground" />
                ) : null}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </ScrollArea>
  )
}
