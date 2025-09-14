"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { updateUserAction } from "@/app/actions/user-actions"
import { Loader2 } from "lucide-react"

interface EditUserFormProps {
  user: {
    id: string
    email: string
    name: string
    phone: string | null
    fullName: string
    gender: string | null
    birthdate: Date | null
    address: string | null
    isActive: boolean
  }
}

export function EditUserForm({ user }: EditUserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const result = await updateUserAction(user.id, formData)
      
      if (result.success) {
        setMessage("User updated successfully!")
        router.refresh()
      } else {
        setError(result.error || "Failed to update user")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("User update error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit User Information</CardTitle>
        <CardDescription>
          Update user details and profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="user@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name}
                placeholder="e.g., John"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={user.fullName}
                placeholder="e.g., John Smith"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={user.phone || ""}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender" defaultValue={user.gender || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No selection</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthdate">Birth Date</Label>
            <Input
              id="birthdate"
              name="birthdate"
              type="date"
              defaultValue={user.birthdate ? new Date(user.birthdate).toISOString().split('T')[0] : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={user.address || ""}
              placeholder="Enter full address..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="isActive" 
              name="isActive" 
              defaultChecked={user.isActive}
            />
            <Label htmlFor="isActive">Active User</Label>
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

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update User
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
