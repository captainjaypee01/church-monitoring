"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, MapPin, Users, FileText, Upload } from "lucide-react"
import { createEventAction } from "@/app/actions/event-actions"

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startAt: z.string().min(1, "Start date and time is required"),
  endAt: z.string().min(1, "End date and time is required"),
  location: z.string().optional(),
  capacity: z.coerce.number().min(1).optional(),
  allowRegistration: z.boolean().default(true),
  attachment: z.instanceof(File).optional(),
}).refine((data) => {
  const start = new Date(data.startAt)
  const end = new Date(data.endAt)
  return end > start
}, {
  message: "End time must be after start time",
  path: ["endAt"],
})

type EventFormData = z.infer<typeof eventSchema>

interface NewEventFormProps {
  currentUserId: string
}

export function NewEventForm({ currentUserId }: NewEventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startAt: "",
      endAt: "",
      location: "",
      allowRegistration: true,
    },
  })

  const allowRegistration = watch("allowRegistration")

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("data", JSON.stringify(data))
      
      if (selectedFile) {
        formData.append("attachment", selectedFile)
      }

      const result = await createEventAction(formData)

      if (result.success) {
        router.push("/admin/events")
      } else {
        setError(result.error || "Failed to create event")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Event Details
          </CardTitle>
          <CardDescription>Basic information about the event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Church Retreat 2024"
              {...register("title")}
              className="mt-1"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide details about the event, what to expect, what to bring, etc."
              {...register("description")}
              className="mt-1"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startAt">Start Date & Time *</Label>
              <Input
                id="startAt"
                type="datetime-local"
                {...register("startAt")}
                className="mt-1"
              />
              {errors.startAt && (
                <p className="text-sm text-red-600 mt-1">{errors.startAt.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endAt">End Date & Time *</Label>
              <Input
                id="endAt"
                type="datetime-local"
                {...register("endAt")}
                className="mt-1"
              />
              {errors.endAt && (
                <p className="text-sm text-red-600 mt-1">{errors.endAt.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location & Logistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Location & Logistics
          </CardTitle>
          <CardDescription>Where the event will take place and capacity details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Church Main Hall, Mountain View Resort"
                {...register("location")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity (Optional)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="Maximum number of participants"
                {...register("capacity")}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Registration Settings
          </CardTitle>
          <CardDescription>Configure how members can register for this event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowRegistration"
              checked={allowRegistration}
              onCheckedChange={(checked) => setValue("allowRegistration", !!checked)}
            />
            <Label htmlFor="allowRegistration">Allow member registration</Label>
          </div>
          {!allowRegistration && (
            <Alert>
              <AlertDescription>
                Registration is disabled. Members will be able to see the event but cannot register.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Attachments
          </CardTitle>
          <CardDescription>Optional documents or images related to the event</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="attachment">Event Attachment (Optional)</Label>
            <Input
              id="attachment"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Supported formats: Images, PDF, Word documents
            </p>
            {selectedFile && (
              <p className="text-sm text-green-600 mt-1">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating Event..." : "Create Event"}
        </Button>
      </div>
    </form>
  )
}
