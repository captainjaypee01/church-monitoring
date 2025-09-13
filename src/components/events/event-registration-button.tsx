"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { registerForEventAction, cancelEventRegistrationAction } from "@/app/actions/event-actions"

interface EventRegistrationButtonProps {
  eventId: string
  profileId: string
  isRegistered: boolean
  canRegister: boolean
  allowRegistration: boolean
  isAtCapacity: boolean
}

export function EventRegistrationButton({
  eventId,
  profileId,
  isRegistered,
  canRegister,
  allowRegistration,
  isAtCapacity,
}: EventRegistrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleRegister = async () => {
    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      const result = await registerForEventAction(eventId, profileId)
      
      if (result.success) {
        setMessage(result.message || "Successfully registered!")
        // Refresh the page to update the registration status
        window.location.reload()
      } else {
        setError(result.error || "Failed to register")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your registration for this event?")) {
      return
    }

    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      const result = await cancelEventRegistrationAction(eventId, profileId)
      
      if (result.success) {
        setMessage(result.message || "Registration cancelled!")
        // Refresh the page to update the registration status
        window.location.reload()
      } else {
        setError(result.error || "Failed to cancel registration")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert>
          <AlertDescription className="text-green-600">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isRegistered ? (
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserMinus className="mr-2 h-4 w-4" />
          )}
          Cancel Registration
        </Button>
      ) : canRegister ? (
        <Button
          onClick={handleRegister}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          Register for Event
        </Button>
      ) : (
        <Button disabled className="w-full">
          {!allowRegistration 
            ? "Registration Closed"
            : isAtCapacity
            ? "Event Full"
            : "Registration Unavailable"}
        </Button>
      )}
    </div>
  )
}
