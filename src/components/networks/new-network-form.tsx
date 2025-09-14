"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createNetworkAction } from "@/app/actions/network-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface NewNetworkFormProps {
  currentUserId: string
}

export function NewNetworkForm({ currentUserId }: NewNetworkFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [networkLeaders, setNetworkLeaders] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchNetworkLeaders = async () => {
      try {
        const response = await fetch('/api/users/network-leaders')
        if (response.ok) {
          const data = await response.json()
          setNetworkLeaders(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching network leaders:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchNetworkLeaders()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)

    try {
      const result = await createNetworkAction(formData)
      
      if (result.success) {
        toast.success("Network created successfully!")
        router.push("/admin/networks")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create network")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
      console.error("Network creation error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Information</CardTitle>
        <CardDescription>
          Enter the details for the new church network. Networks help organize cell groups and assign leadership roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="createdBy" value={currentUserId} />
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Network Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Central Network, North District"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="networkLeader">Network Leader</Label>
              <Select name="networkLeader" disabled={loadingUsers}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a network leader"} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  <SelectItem value="none">Assign later</SelectItem>
                  {networkLeaders.map((user) => (
                    <SelectItem key={user.id} value={user.id} className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium">{user.fullName || user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the network's purpose, geographic area, or any special notes..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location/Area</Label>
            <Input
              id="location"
              name="location"
              placeholder="e.g., Downtown District, North Side, East Region"
            />
          </div>


          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Network
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
