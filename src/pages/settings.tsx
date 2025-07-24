import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"
import React from "react"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
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
                    <Select>
                      <SelectTrigger>
                        <span>System</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Language</label>
                    <Select>
                      <SelectTrigger>
                        <span>English</span>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Words per session</label>
                    <Input type="number" min={1} max={100} defaultValue={20} />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="ai">
                <div className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">API URL</label>
                    <Input type="text" placeholder="https://api.example.com" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">API Key</label>
                    <Input type="password" placeholder="API Key" />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Model</label>
                    <Input type="text" placeholder="gpt-3.5-turbo" />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="advanced">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Debug mode</span>
                    <Switch />
                  </div>
                  <Button variant="destructive" className="w-full mt-4">
                    Reset settings
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            <div className="pt-6">
              <Button className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
