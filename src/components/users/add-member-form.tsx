"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Users, Building, Target, UserPlus, Plus } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  fullName: string
  email: string
  role: string
}

interface AddMemberFormProps {
  cellId: string
  networkId: string
  cellName: string
  networkName: string
  availableUsers: User[]
}

export function AddMemberForm({ 
  cellId, 
  networkId, 
  cellName,
  networkName,
  availableUsers
}: AddMemberFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<"existing" | "new">("new")
  const [selectedUserId, setSelectedUserId] = useState("")
  
  // New user form fields
  const [newUser, setNewUser] = useState({
    name: "",
    fullName: "",
    email: "",
    phone: "",
    role: "MEMBER"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === "existing") {
      if (!selectedUserId) {
        toast.error("Please select a user to add")
        return
      }

      setIsLoading(true)

      try {
        const response = await fetch(`/api/users/${selectedUserId}/assign`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            networkId,
            cellId,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to add member")
        }

        toast.success("Member added successfully")
        router.push("/cell")
      } catch (error) {
        console.error("Error adding member:", error)
        toast.error("Failed to add member")
      } finally {
        setIsLoading(false)
      }
    } else {
      // Create new user
      if (!newUser.name || !newUser.fullName || !newUser.email) {
        toast.error("Please fill in all required fields")
        return
      }

      setIsLoading(true)

      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newUser,
            networkId,
            cellId,
            hashedPassword: "temp_password_123", // Temporary password, user will need to reset
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create user")
        }

        toast.success("New member created and added successfully")
        router.push("/cell")
      } catch (error) {
        console.error("Error creating user:", error)
        toast.error("Failed to create new member")
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Add Member to Cell Group
        </CardTitle>
        <CardDescription>
          Create a new member or add an existing user to {cellName}. The user will be assigned to both {networkName} network and {cellName} cell group.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Info */}
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Assignment Details
            </h4>
            <div className="space-y-1 text-sm">
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Network:</strong> {networkName}
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                <strong>Cell Group:</strong> {cellName}
              </p>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Add Member Type</Label>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={mode === "new" ? "default" : "outline"}
                onClick={() => setMode("new")}
                className="flex items-center"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Member
              </Button>
              <Button
                type="button"
                variant={mode === "existing" ? "default" : "outline"}
                onClick={() => setMode("existing")}
                className="flex items-center"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Existing User
              </Button>
            </div>
          </div>

          {mode === "new" ? (
            /* New User Form */
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="CELL_LEADER">Cell Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* Existing User Selection */
            <div className="space-y-2">
              <Label htmlFor="user">Select Existing User *</Label>
              <Select 
                value={selectedUserId} 
                onValueChange={setSelectedUserId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-medium">{user.fullName || user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {user.role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableUsers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No available users to add. All users are already assigned to cell groups.
                </p>
              )}

              {/* Selected User Info */}
              {selectedUserId && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Selected User
                  </h4>
                  {(() => {
                    const selectedUser = availableUsers.find(u => u.id === selectedUserId)
                    return selectedUser ? (
                      <div className="space-y-1 text-sm">
                        <p className="text-green-700 dark:text-green-300">
                          <strong>Name:</strong> {selectedUser.fullName || selectedUser.name}
                        </p>
                        <p className="text-green-700 dark:text-green-300">
                          <strong>Email:</strong> {selectedUser.email}
                        </p>
                        <p className="text-green-700 dark:text-green-300">
                          <strong>Role:</strong> {selectedUser.role}
                        </p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="submit" 
              disabled={isLoading || (mode === "existing" && (!selectedUserId || availableUsers.length === 0))}
            >
              {isLoading 
                ? (mode === "new" ? "Creating Member..." : "Adding Member...") 
                : (mode === "new" ? "Create & Add Member" : "Add Member")
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
