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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Megaphone, Users, FileText } from "lucide-react"
import { createAnnouncementAction } from "@/app/actions/announcement-actions"

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  audience: z.enum(["ALL", "LEADERS", "MEMBERS"]),
  publishNow: z.boolean().default(false),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

interface NewAnnouncementFormProps {
  currentUserId: string
}

export function NewAnnouncementForm({ currentUserId }: NewAnnouncementFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      body: "",
      audience: "ALL",
      publishNow: false,
    },
  })

  const publishNow = watch("publishNow")
  const audience = watch("audience")

  const onSubmit = async (data: AnnouncementFormData) => {
    setIsSubmitting(true)
    setError("")

    try {
      const result = await createAnnouncementAction(data)

      if (result.success) {
        router.push("/admin/announcements")
      } else {
        setError(result.error || "Failed to create announcement")
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

      {/* Announcement Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Announcement Content
          </CardTitle>
          <CardDescription>Write your announcement message</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Important Church Update"
              {...register("title")}
              className="mt-1"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              placeholder="Write your announcement message here. Be clear and concise."
              {...register("body")}
              className="mt-1"
              rows={6}
            />
            {errors.body && (
              <p className="text-sm text-red-600 mt-1">{errors.body.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audience & Publishing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Audience & Publishing
          </CardTitle>
          <CardDescription>Choose who will see this announcement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="audience">Target Audience</Label>
            <Select
              value={audience}
              onValueChange={(value) => setValue("audience", value as "ALL" | "LEADERS" | "MEMBERS")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Members</SelectItem>
                <SelectItem value="LEADERS">Leaders Only</SelectItem>
                <SelectItem value="MEMBERS">Regular Members Only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {audience === "ALL" && "Visible to all church members, leaders, and staff"}
              {audience === "LEADERS" && "Visible only to cell leaders, network leaders, and admins"}
              {audience === "MEMBERS" && "Visible only to regular members (excludes leaders)"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="publishNow"
              checked={publishNow}
              onCheckedChange={(checked) => setValue("publishNow", !!checked)}
            />
            <Label htmlFor="publishNow">Publish immediately</Label>
          </div>
          
          {!publishNow && (
            <Alert>
              <AlertDescription>
                This announcement will be saved as a draft. You can publish it later from the announcements list.
              </AlertDescription>
            </Alert>
          )}

          {publishNow && (
            <Alert>
              <AlertDescription className="text-blue-600">
                This announcement will be immediately visible to the selected audience.
              </AlertDescription>
            </Alert>
          )}
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
          {isSubmitting 
            ? publishNow 
              ? "Publishing..." 
              : "Saving Draft..."
            : publishNow 
              ? "Publish Announcement" 
              : "Save as Draft"
          }
        </Button>
      </div>
    </form>
  )
}
