"use client"

import { useState, useEffect } from "react"
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
    username: string | null
    name: string
    phone: string | null
    firstName: string | null
    lastName: string | null
    fullName: string
    gender: string | null
    birthdate: Date | null
    address: string | null
    isActive: boolean
    roles: Array<{
      role: string
      networkId: string | null
      cellId: string | null
    }>
  }
}

export function EditUserForm({ user }: EditUserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [networks, setNetworks] = useState<any[]>([])
  const [cells, setCells] = useState<any[]>([])
  const [loadingNetworks, setLoadingNetworks] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Fetch networks and cells for role assignment
    const fetchData = async () => {
      setLoadingNetworks(true)
      try {
        const [networksRes, cellsRes] = await Promise.all([
          fetch('/api/networks'),
          fetch('/api/cells')
        ])
        
        if (networksRes.ok) {
          const networksData = await networksRes.json()
          setNetworks(networksData)
        }
        
        if (cellsRes.ok) {
          const cellsData = await cellsRes.json()
          setCells(cellsData)
        }
      } catch (error) {
        console.error('Error fetching networks/cells:', error)
      } finally {
        setLoadingNetworks(false)
      }
    }

    fetchData()
  }, [])

  // Get current user role
  const currentRole = user.roles.length > 0 ? user.roles[0] : null

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
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="user@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                defaultValue={user.username}
                placeholder="username"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Leave blank to keep current password"
              />
            </div>
            
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
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user.firstName}
                placeholder="e.g., John"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user.lastName}
                placeholder="e.g., Smith"
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
              <Select name="gender" defaultValue={user.gender || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
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

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Role Assignment</h3>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select name="role" defaultValue={currentRole?.role || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Role</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="CELL_LEADER">Cell Leader</SelectItem>
                  <SelectItem value="NETWORK_LEADER">Network Leader</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="networkId">Network (for Network Leader)</Label>
                <Select name="networkId" defaultValue={currentRole?.networkId || ""} disabled={loadingNetworks}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Network</SelectItem>
                    {networks.map((network) => (
                      <SelectItem key={network.id} value={network.id}>
                        {network.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cellId">Cell (for Cell Leader)</Label>
                <Select name="cellId" defaultValue={currentRole?.cellId || ""} disabled={loadingNetworks}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cell" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Cell</SelectItem>
                    {cells.map((cell) => (
                      <SelectItem key={cell.id} value={cell.id}>
                        {cell.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
