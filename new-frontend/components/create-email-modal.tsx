"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Zap } from "lucide-react"

import api, { setAuthTokens } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CreateEmailModalProps {
  open: boolean
  onClose: () => void
  domains?: string[]
  /** Called after successful creation */
  onCreated?: () => void
}

export function CreateEmailModal({ open, onClose, domains: externalDomains, onCreated }: CreateEmailModalProps) {
  const router = useRouter()
  const [prefix, setPrefix] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("")
  const [loading, setLoading] = useState(false)
  const [internalDomains, setInternalDomains] = useState<string[]>([])

  const domains = externalDomains || internalDomains

  useEffect(() => {
    if (open) {
      setPrefix("")
      if (externalDomains) {
        if (externalDomains.length > 0 && !selectedDomain) {
          setSelectedDomain(externalDomains[0])
        }
      } else if (internalDomains.length === 0) {
        api.get<{ domains?: string[] }>("/open_api/settings")
          .then(({ data }) => setInternalDomains(data.domains || []))
          .catch(() => {})
      }
    }
    if (open && !selectedDomain && domains.length > 0) {
      setSelectedDomain(domains[0])
    }
  }, [open, externalDomains])

  const handleCreate = async () => {
    setLoading(true)
    try {
      const name = prefix || undefined
      const { data } = await api.post<{ jwt: string; address: string }>("/api/new_address", {
        name,
        domain: selectedDomain || undefined,
      })
      setAuthTokens({ jwt: data.jwt })
      toast.success(`创建成功: ${data.address}`)
      onCreated?.()
      onClose()
    } catch {
      toast.error("创建失败")
    } finally {
      setLoading(false)
    }
  }

  const generateRandom = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPrefix(result)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建新邮箱</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="yourname"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="flex-1"
            />
            <span className="text-muted-foreground">@</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              {domains.length === 0 && <option value="">暂无域名</option>}
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={generateRandom}>
            <Zap className="mr-1.5 size-3.5" />
            随机生成
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleCreate} disabled={loading}>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
