import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import React, { useEffect, useState } from "react"
import { getSettings, setSettings, getDefaultSettings } from "@/utils/settings"
import { useTheme } from "@/components/theme-provider"
import type { Settings } from "@/utils/settings"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  onSettingsChange?: (settings: Settings) => void
}

export function SettingsModal({ open, onClose, onSettingsChange }: SettingsModalProps) {
  const [settings, setSettingsState] = useState<Settings>(getDefaultSettings())
  const { setTheme } = useTheme()

  useEffect(() => {
    if (open) {
      const loaded = getSettings() || getDefaultSettings()
      setSettingsState(loaded)
    }
  }, [open])

  function handleChange(path: string, value: any) {
    setSettingsState(prev => {
      const updated = { ...prev }
      const keys = path.split(".")
      let obj: any = updated
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return updated
    })
  }

  function handleDone() {
    setSettings(settings)
    setTheme(settings.general.theme)
    if (onSettingsChange) onSettingsChange(settings)
    onClose()
  }

  function handleReset() {
    const def = getDefaultSettings()
    setSettingsState(def)
    setSettings(def)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="ai">AI Settings</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value="general">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">Theme</label>
<Select
  value={settings.general.theme}
  onValueChange={v => handleChange("general.theme", v)}
>
  <SelectTrigger>
    <span>
      {settings.general.theme === "system"
        ? "System"
        : settings.general.theme === "light"
        ? "Light"
        : "Dark"}
    </span>
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="system">System</SelectItem>
    <SelectItem value="light">Light</SelectItem>
    <SelectItem value="dark">Dark</SelectItem>
  </SelectContent>
</Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Language</label>
                    <Select
                      value={settings.general.language}
                      onValueChange={v => handleChange("general.language", v)}
                    >
                      <SelectTrigger>
                        <span>
                          {settings.general.language === "en"
                            ? "English"
                            : settings.general.language}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh">中文(not supported yet)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Words per session</label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={settings.general.wordsPerSession}
                      onChange={e => handleChange("general.wordsPerSession", Number(e.target.value))}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="ai">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">API URL</label>
                    <Input
                      type="text"
                      value={settings.ai.apiUrl}
                      onChange={e => handleChange("ai.apiUrl", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">API Key</label>
                    <Input
                      type="password"
                      value={settings.ai.apiKey}
                      onChange={e => handleChange("ai.apiKey", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Model</label>
                    <Input
                      type="text"
                      value={settings.ai.modelName}
                      onChange={e => handleChange("ai.modelName", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="advanced">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Debug mode</span>
                    <Switch
                      checked={settings.advanced.debugMode}
                      onCheckedChange={v => handleChange("advanced.debugMode", v)}
                    />
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full mt-4"
                    type="button"
                    onClick={handleReset}
                  >
                    Reset settings
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            <div className="pt-6">
              <Button className="w-full" onClick={handleDone}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
