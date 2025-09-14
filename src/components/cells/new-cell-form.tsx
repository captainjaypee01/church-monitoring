"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCellAction } from "@/app/actions/cell-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface NewCellFormProps {
  networkId: string
  currentUserId: string
}

export function NewCellForm({ networkId, currentUserId }: NewCellFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [cellLeaders, setCellLeaders] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchCellLeaders = async () => {
      try {
        const response = await fetch('/api/users/cell-leaders')
        if (response.ok) {
          const data = await response.json()
          setCellLeaders(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching cell leaders:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchCellLeaders()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)

    try {
      const result = await createCellAction(formData)
      
      if (result.success) {
        toast.success("Cell group created successfully!")
        router.push(`/admin/networks/${networkId}`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create cell group")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
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
              <Select name="cellLeader" disabled={loadingUsers}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a cell leader"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Assign later</SelectItem>
                  {cellLeaders.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName || user.name} ({user.email})
                      {user.currentRole && user.cellId ? " (Currently assigned)" : ""}
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
              placeholder="Describe the cell group's focus, meeting schedule, or any special notes..."
              rows={3}
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
              Create Cell Group
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
