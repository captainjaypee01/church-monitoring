"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect, Option } from "@/components/ui/multi-select"
import { updateNetworkAction } from "@/app/actions/network-actions"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"

interface EditNetworkFormProps {
  network: {
    id: string
    name: string
    description: string | null
    location: string | null
  }
  networkLeaders: {
    id: string
    fullName: string
    email: string
  }[]
}

export function EditNetworkForm({ network, networkLeaders: currentLeaders }: EditNetworkFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [networkLeaders, setNetworkLeaders] = useState<Option[]>([])
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>(
    currentLeaders.map(leader => leader.id)
  )
  const [loadingUsers, setLoadingUsers] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchNetworkLeaders = async () => {
      try {
        const response = await fetch('/api/users/network-leaders')
        if (response.ok) {
          const data = await response.json()
          const formattedLeaders = (data.users || []).map((user: any) => ({
            value: user.id,
            label: user.fullName || user.name,
            email: user.email,
          }))
          setNetworkLeaders(formattedLeaders)
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
      const result = await updateNetworkAction(network.id, formData)
      
      if (result.success) {
        toast.success("Network updated successfully!")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update network")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
      console.error("Network update error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {selectedLeaders.map((leaderId) => (
        <input key={leaderId} type="hidden" name="networkLeaders" value={leaderId} />
      ))}
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
          <Label htmlFor="networkLeaders">Network Leaders</Label>
          <MultiSelect
            options={networkLeaders}
            selected={selectedLeaders}
            onChange={setSelectedLeaders}
            placeholder={loadingUsers ? "Loading users..." : "Select network leaders"}
            searchPlaceholder="Search leaders..."
            emptyMessage="No network leaders found"
            disabled={loadingUsers}
          />
          <p className="text-xs text-muted-foreground">
            Current leaders: {currentLeaders.map(l => l.fullName).join(', ') || 'None'}
          </p>
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
          Update Network
        </Button>
      </div>
    </form>
  )
}
