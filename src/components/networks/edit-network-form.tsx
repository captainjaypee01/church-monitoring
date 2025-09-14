"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateNetworkAction } from "@/app/actions/network-actions"
import { Loader2, Trash2 } from "lucide-react"

interface EditNetworkFormProps {
  network: {
    id: string
    name: string
    description: string | null
    location: string | null
  }
  networkLeader?: {
    id: string
    fullName: string
  } | null
}

export function EditNetworkForm({ network, networkLeader }: EditNetworkFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [networkLeaders, setNetworkLeaders] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const router = useRouter()
  console.log('network', network);
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
    setError("")
    setMessage("")

    try {
      const result = await updateNetworkAction(network.id, formData)
      
      if (result.success) {
        setMessage("Network updated successfully!")
        router.refresh()
      } else {
        setError(result.error || "Failed to update network")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Network update error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Network Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={network.name}
            placeholder="e.g., Central Network, North District"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="networkLeader">Network Leader</Label>
          <Select name="networkLeader" defaultValue={networkLeader?.id || "none"} disabled={loadingUsers}>
            <SelectTrigger>
              <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a network leader"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No leader assigned</SelectItem>
              {networkLeaders.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName || user.name} ({user.email})
                  {user.id === networkLeader?.id ? " (Current)" : ""}
                  {user.currentRole && user.networkId && user.id !== networkLeader?.id ? " (Assigned elsewhere)" : ""}
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
          defaultValue={network.description || ""}
          placeholder="Describe the network's purpose, geographic area, or any special notes..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location/Area</Label>
        <Input
          id="location"
          name="location"
          defaultValue={network.location || ""}
          placeholder="e.g., Downtown District, North Side, East Region"
        />
      </div>

      {message && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Network
        </Button>
      </div>
    </form>
  )
}
