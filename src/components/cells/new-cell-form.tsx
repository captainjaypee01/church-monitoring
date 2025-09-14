"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCellAction } from "@/app/actions/cell-actions"
import { Loader2 } from "lucide-react"

interface NewCellFormProps {
  networkId: string
  currentUserId: string
}

export function NewCellForm({ networkId, currentUserId }: NewCellFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const result = await createCellAction(formData)
      
      if (result.success) {
        setMessage("Cell group created successfully!")
        router.push(`/admin/networks/${networkId}`)
        router.refresh()
      } else {
        setError(result.error || "Failed to create cell group")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Cell creation error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cell Group Information</CardTitle>
        <CardDescription>
          Enter the details for the new cell group. Cell groups are small communities within the network for fellowship and discipleship.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <input type="hidden" name="networkId" value={networkId} />
          <input type="hidden" name="createdBy" value={currentUserId} />
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Cell Group Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Victory Cell Group, Alpha Cell"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cellLeader">Cell Leader</Label>
              <Select name="cellLeader">
                <SelectTrigger>
                  <SelectValue placeholder="Select a cell leader" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Assign later</SelectItem>
                  {/* TODO: Fetch and populate with actual users */}
                  <SelectItem value="user1">John Smith</SelectItem>
                  <SelectItem value="user2">Jane Doe</SelectItem>
                  <SelectItem value="user3">Mike Johnson</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the cell group's focus, meeting schedule, or any special notes..."
              rows={3}
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
              Create Cell Group
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
