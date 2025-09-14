"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createNetworkAction } from "@/app/actions/network-actions"
import { Loader2 } from "lucide-react"

interface NewNetworkFormProps {
  currentUserId: string
}

export function NewNetworkForm({ currentUserId }: NewNetworkFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const result = await createNetworkAction(formData)
      
      if (result.success) {
        setMessage("Network created successfully!")
        router.push("/admin/networks")
        router.refresh()
      } else {
        setError(result.error || "Failed to create network")
      }
    } catch (err) {
      setError("An unexpected error occurred")
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
              <Select name="networkLeader">
                <SelectTrigger>
                  <SelectValue placeholder="Select a network leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Assign later</SelectItem>
                  {/* TODO: Fetch and populate with actual users */}
                  <SelectItem value="user1">John Smith</SelectItem>
                  <SelectItem value="user2">Jane Doe</SelectItem>
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
