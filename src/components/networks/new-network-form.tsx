"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MultiSelect, Option } from "@/components/ui/multi-select"
import { createNetworkAction } from "@/app/actions/network-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface NewNetworkFormProps {
  currentUserId: string
}

export function NewNetworkForm({ currentUserId }: NewNetworkFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [networkLeaders, setNetworkLeaders] = useState<Option[]>([])
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchNetworkLeaders = async () => {
      try {
        const response = await fetch('/api/users/network-leaders?excludeAssigned=true')
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
      const result = await createNetworkAction(formData)
      
      if (result.success) {
        toast.success("Network created successfully!")
        router.push("/admin/networks")
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
          {selectedLeaders.map((leaderId) => (
            <input key={leaderId} type="hidden" name="networkLeaders" value={leaderId} />
          ))}
          
          {/* Row 1: Network Name | Location */}
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
              <Label htmlFor="location">Location/Area</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g., Downtown District, North Side, East Region"
              />
            </div>
          </div>

          {/* Row 2: Description (full width) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the network's purpose, geographic area, or any special notes..."
              rows={3}
            />
          </div>

          {/* Row 3: Network Leaders (full width) */}
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
              Select one or more users to lead this network. You can add more leaders later.
            </p>
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
