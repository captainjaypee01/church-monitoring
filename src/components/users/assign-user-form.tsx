"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Users, Building, Target } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string
  fullName: string
  email: string
  role: string
  networkId?: string
  cellId?: string
}

interface Network {
  id: string
  name: string
  description?: string
}

interface Cell {
  id: string
  name: string
  description?: string
  networkId: string
}

interface AssignUserFormProps {
  user: User
  networks: Network[]
  cells: Cell[]
  userNetworks: string[]
  userCells: string[]
  onSuccess?: () => void
}

export function AssignUserForm({ 
  user, 
  networks, 
  cells, 
  userNetworks, 
  userCells, 
  onSuccess 
}: AssignUserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedNetworkId, setSelectedNetworkId] = useState(user.networkId || "")
  const [selectedCellId, setSelectedCellId] = useState(user.cellId || "")
  const [availableCells, setAvailableCells] = useState<Cell[]>([])

  // Filter networks based on user permissions
  const availableNetworks = networks.filter(network => 
    userNetworks.includes(network.id)
  )

  // Update available cells when network changes
  const handleNetworkChange = (networkId: string) => {
    setSelectedNetworkId(networkId)
    setSelectedCellId("") // Reset cell selection
    
    // Filter cells based on selected network and user permissions
    const networkCells = cells.filter(cell => 
      cell.networkId === networkId && userCells.includes(cell.id)
    )
    setAvailableCells(networkCells)
  }

  // Initialize available cells when component mounts
  React.useEffect(() => {
    if (selectedNetworkId) {
      const networkCells = cells.filter(cell => 
        cell.networkId === selectedNetworkId && userCells.includes(cell.id)
      )
      setAvailableCells(networkCells)
    }
  }, [selectedNetworkId, cells, userCells])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedNetworkId || !selectedCellId) {
      toast.error("Please select both a network and a cell group")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/users/${user.id}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          networkId: selectedNetworkId,
          cellId: selectedCellId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign user")
      }

      toast.success("User assigned successfully")
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error("Error assigning user:", error)
      toast.error("Failed to assign user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Assign User to Network & Cell
        </CardTitle>
        <CardDescription>
          Assign {user.fullName || user.name} to a network and cell group. 
          Both network and cell assignment are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info */}
          <div className="space-y-2">
            <Label>User</Label>
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.fullName || user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="secondary">{user.role}</Badge>
              </div>
            </div>
          </div>

          {/* Network Selection */}
          <div className="space-y-2">
            <Label htmlFor="network">Network *</Label>
            <Select 
              value={selectedNetworkId} 
              onValueChange={handleNetworkChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a network" />
              </SelectTrigger>
              <SelectContent>
                {availableNetworks.map((network) => (
                  <SelectItem key={network.id} value={network.id}>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      {network.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedNetworkId && (
              <p className="text-sm text-muted-foreground">
                Selected: {networks.find(n => n.id === selectedNetworkId)?.name}
              </p>
            )}
          </div>

          {/* Cell Selection */}
          <div className="space-y-2">
            <Label htmlFor="cell">Cell Group *</Label>
            <Select 
              value={selectedCellId} 
              onValueChange={setSelectedCellId}
              disabled={!selectedNetworkId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedNetworkId ? "Select a cell group" : "Select a network first"} />
              </SelectTrigger>
              <SelectContent>
                {availableCells.map((cell) => (
                  <SelectItem key={cell.id} value={cell.id}>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 mr-2" />
                      {cell.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCellId && (
              <p className="text-sm text-muted-foreground">
                Selected: {cells.find(c => c.id === selectedCellId)?.name}
              </p>
            )}
            {!selectedNetworkId && (
              <p className="text-sm text-muted-foreground">
                Please select a network first to see available cell groups
              </p>
            )}
          </div>

          {/* Assignment Summary */}
          {selectedNetworkId && selectedCellId && (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Assignment Summary
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-green-700 dark:text-green-300">
                  <strong>User:</strong> {user.fullName || user.name}
                </p>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Network:</strong> {networks.find(n => n.id === selectedNetworkId)?.name}
                </p>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Cell Group:</strong> {cells.find(c => c.id === selectedCellId)?.name}
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="submit" 
              disabled={isLoading || !selectedNetworkId || !selectedCellId}
            >
              {isLoading ? "Assigning..." : "Assign User"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
