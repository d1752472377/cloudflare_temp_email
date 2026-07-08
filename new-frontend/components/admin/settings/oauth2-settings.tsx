"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { OAuth2Provider } from "@/lib/types"

export function OAuth2Settings() {
  const [providers, setProviders] = useState<OAuth2Provider[]>([])

  const { isLoading } = useQuery({
    queryKey: ["oauth2_settings"],
    queryFn: async () => {
      const { data } = await api.get<OAuth2Provider[]>("/admin/user_oauth2_settings")
      setProviders(data)
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/user_oauth2_settings", providers),
    onSuccess: () => toast.success("设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  const update = (i: number, patch: Partial<OAuth2Provider>) => {
    const next = [...providers]
    next[i] = { ...next[i], ...patch }
    setProviders(next)
  }

  const add = () => setProviders([...providers, { name: "", clientID: "", clientSecret: "", authorizationURL: "", tokenURL: "", userInfoURL: "", scope: "openid email profile", enabled: true }])
  const remove = (i: number) => setProviders(providers.filter((_, idx) => idx !== i))

  if (isLoading) return <Skeleton className="h-48 w-full" />

  return (
    <div className="flex flex-col gap-4">
      {providers.map((p, i) => (
        <Card key={i}>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">{p.name || `Provider ${i + 1}`}</CardTitle>
            <div className="flex items-center gap-2">
              <Switch checked={p.enabled} onCheckedChange={(v) => update(i, { enabled: v })} />
              <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => remove(i)}><Trash2 className="size-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field><FieldLabel>名称</FieldLabel><Input value={p.name} onChange={(e) => update(i, { name: e.target.value })} /></Field>
              <Field><FieldLabel>Client ID</FieldLabel><Input value={p.clientID} onChange={(e) => update(i, { clientID: e.target.value })} /></Field>
              <Field><FieldLabel>Client Secret</FieldLabel><Input value={p.clientSecret} onChange={(e) => update(i, { clientSecret: e.target.value })} /></Field>
              <Field><FieldLabel>授权 URL</FieldLabel><Input value={p.authorizationURL} onChange={(e) => update(i, { authorizationURL: e.target.value })} /></Field>
              <Field><FieldLabel>Token URL</FieldLabel><Input value={p.tokenURL} onChange={(e) => update(i, { tokenURL: e.target.value })} /></Field>
              <Field><FieldLabel>用户信息 URL</FieldLabel><Input value={p.userInfoURL} onChange={(e) => update(i, { userInfoURL: e.target.value })} /></Field>
              <Field><FieldLabel>Scope</FieldLabel><Input value={p.scope} onChange={(e) => update(i, { scope: e.target.value })} /></Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={add}><Plus className="size-3.5" /> 添加 Provider</Button>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存</Button>
      </div>
    </div>
  )
}
