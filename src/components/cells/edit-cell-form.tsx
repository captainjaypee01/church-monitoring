"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateCellAction } from "@/app/actions/cell-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EditCellFormProps {
  cell: {
    id: string
    name: string
    description: string | null
  }
  cellLeader?: {
    id: string
    fullName: string
  } | null
  networkId: string
}

export function EditCellForm({ cell, cellLeader, networkId }: EditCellFormProps) {
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
      // Add defensive checks
      if (!cell?.id) {
        toast.error("Cell ID is missing")
        return
      }
      
      if (!networkId) {
        toast.error("Network ID is missing")
        return
      }

      const result = await updateCellAction(cell.id, formData)
      
      if (result?.success) {
        toast.success("Cell updated successfully!")
        router.refresh()
      } else {
        toast.error(result?.error || "Failed to update cell")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
      console.error("Cell update error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Safety check
  if (!cell) {
    return <div>Cell data not available</div>
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="networkId" value={networkId || ""} />
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Cell Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={cell.name || ""}
            placeholder="e.g., Youth Cell, Family Cell"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cellLeader">Cell Leader</Label>
          <Select name="cellLeader" defaultValue={cellLeader?.id || "none"} disabled={loadingUsers}>
            <SelectTrigger>
              <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a cell leader"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No leader assigned</SelectItem>
              {(cellLeaders || []).map((user) => (
                <SelectItem key={user?.id || Math.random()} value={user?.id || ""}>
                  {user?.fullName || user?.name || "Unknown"} ({user?.email || "No email"})
                  {user?.id === cellLeader?.id ? " (Current)" : ""}
                  {user?.currentRole && user?.cellId && user?.id !== cellLeader?.id ? " (Assigned elsewhere)" : ""}
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
          defaultValue={cell?.description || ""}
          placeholder="Describe the cell group's purpose, target audience, or any special notes..."
          rows={3}
        />
      </div>


      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Cell
        </Button>
      </div>
    </form>
  )
}
