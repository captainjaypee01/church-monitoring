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
import { createUserAction } from "@/app/actions/user-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function NewUserForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [networks, setNetworks] = useState<any[]>([])
  const [cells, setCells] = useState<any[]>([])
  const [loadingNetworks, setLoadingNetworks] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [selectedNetwork, setSelectedNetwork] = useState<string>("")
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

  // Handle role changes and clear network selection for non-Cell Leader roles
  useEffect(() => {
    if (selectedRole !== "CELL_LEADER" && selectedNetwork) {
      setSelectedNetwork("")
    }
  }, [selectedRole, selectedNetwork])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)

    try {
      const result = await createUserAction(formData)
      
      if (result.success) {
        toast.success("User created successfully!")
        router.push("/admin/users")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to create user")
      }
    } catch (err) {
      toast.error("An unexpected error occurred")
      console.error("User creation error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
        <CardDescription>
          Enter the details for the new user. All fields marked with * are required.
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
                placeholder="user@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="username"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Display Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., John"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="e.g., John"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                name="lastName"
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
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender">
                <SelectTrigger>
                  <SelectValue placeholder="Select gender (optional)" />
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Enter full address..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="isActive" name="isActive" value="on" defaultChecked />
            <Label htmlFor="isActive">Active User</Label>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Role & Membership</h3>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role (Capabilities)</Label>
              <Select name="role" value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="CELL_LEADER">Cell Leader (can lead cell groups)</SelectItem>
                  <SelectItem value="NETWORK_LEADER">Network Leader (can lead networks)</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Role defines what this user is capable of doing in the system
              </p>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Membership Assignment</h4>
              <p className="text-sm text-muted-foreground">
                Assign which network/cell group this user belongs to as a member
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="networkId">Member of Network</Label>
                <Select name="networkId" value={selectedNetwork} onValueChange={setSelectedNetwork} disabled={loadingNetworks}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No network assignment</SelectItem>
                    {networks.map((network) => (
                      <SelectItem key={network.id} value={network.id}>
                        {network.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedNetwork && selectedNetwork !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="cellId">Member of Cell Group</Label>
                  <Select name="cellId" disabled={loadingNetworks}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cell group (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No cell group assignment</SelectItem>
                      {cells
                        .filter((cell) => cell.networkId === selectedNetwork)
                        .map((cell) => (
                          <SelectItem key={cell.id} value={cell.id}>
                            {cell.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Leadership assignments (who leads which network/cell) are done separately 
                  in the Network Management and Cell Management pages.
                </p>
              </div>
            </div>
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
              Create User
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
