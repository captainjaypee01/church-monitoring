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
import { Separator } from "@/components/ui/separator"
import { Calendar, Upload, Users, BookOpen, DollarSign } from "lucide-react"
import { logMeetingAction } from "@/app/actions/meeting-actions"

const meetingSchema = z.object({
  occurredAt: z.string(),
  notes: z.string().optional(),
  tithesAmount: z.coerce.number().min(0).default(0),
  offeringsAmount: z.coerce.number().min(0).default(0),
  currency: z.string().default("USD"),
  attendance: z.array(z.object({
    profileId: z.string(),
    present: z.boolean(),
    isVip: z.boolean(),
    remarks: z.string().optional(),
  })),
  trainingUpdates: z.array(z.object({
    profileId: z.string(),
    levelId: z.string(),
    notes: z.string().optional(),
  })),
  groupPicture: z.instanceof(File).optional(),
})

type MeetingFormData = z.infer<typeof meetingSchema>

interface NewMeetingFormProps {
  cell: any
  members: Array<{
    id: string
    fullName: string
    userId: string | null
  }>
  trainingLevels: Array<{
    id: string
    code: string
    title: string
    order: number
  }>
  currentUserId: string
}

export function NewMeetingForm({ cell, members, trainingLevels, currentUserId }: NewMeetingFormProps) {
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
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      occurredAt: new Date().toISOString().slice(0, 16),
      notes: "",
      tithesAmount: 0,
      offeringsAmount: 0,
      currency: "USD",
      attendance: members.map(member => ({
        profileId: member.id,
        present: false,
        isVip: false,
        remarks: "",
      })),
      trainingUpdates: [],
    },
  })

  const attendance = watch("attendance")
  const trainingUpdates = watch("trainingUpdates")

  const updateAttendance = (profileId: string, field: "present" | "isVip", value: boolean) => {
    const newAttendance = attendance.map(item =>
      item.profileId === profileId ? { ...item, [field]: value } : item
    )
    setValue("attendance", newAttendance)
  }

  const updateAttendanceRemarks = (profileId: string, remarks: string) => {
    const newAttendance = attendance.map(item =>
      item.profileId === profileId ? { ...item, remarks } : item
    )
    setValue("attendance", newAttendance)
  }

  const addTrainingUpdate = (profileId: string, levelId: string, notes: string = "") => {
    const existing = trainingUpdates.find(update => 
      update.profileId === profileId && update.levelId === levelId
    )
    
    if (!existing) {
      setValue("trainingUpdates", [...trainingUpdates, { profileId, levelId, notes }])
    }
  }

  const removeTrainingUpdate = (profileId: string, levelId: string) => {
    setValue("trainingUpdates", trainingUpdates.filter(update => 
      !(update.profileId === profileId && update.levelId === levelId)
    ))
  }

  const onSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("cellId", cell.id)
      formData.append("data", JSON.stringify(data))
      
      if (selectedFile) {
        formData.append("groupPicture", selectedFile)
      }

      const result = await logMeetingAction(formData)

      if (result.success) {
        router.push(`/cell/meetings/${result.meetingId}`)
      } else {
        setError(result.error || "Failed to log meeting")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const presentCount = attendance.filter(item => item.present).length
  const vipCount = attendance.filter(item => item.present && item.isVip).length

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Meeting Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Meeting Details
          </CardTitle>
          <CardDescription>Basic information about the meeting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="occurredAt">Meeting Date & Time</Label>
              <Input
                id="occurredAt"
                type="datetime-local"
                {...register("occurredAt")}
                className="mt-1"
              />
              {errors.occurredAt && (
                <p className="text-sm text-red-600 mt-1">{errors.occurredAt.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="groupPicture">Group Photo (Optional)</Label>
              <Input
                id="groupPicture"
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="notes">Meeting Notes</Label>
            <Textarea
              id="notes"
              placeholder="Share any highlights, prayer requests, or important discussions from the meeting..."
              {...register("notes")}
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Attendance ({presentCount}/{members.length})
            </div>
            <div className="text-sm text-muted-foreground">
              VIPs: {vipCount}
            </div>
          </CardTitle>
          <CardDescription>Mark attendance and VIP status for each member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const memberAttendance = attendance.find(item => item.profileId === member.id)
              return (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{member.fullName}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`present-${member.id}`}
                        checked={memberAttendance?.present || false}
                        onCheckedChange={(checked) => 
                          updateAttendance(member.id, "present", !!checked)
                        }
                      />
                      <Label htmlFor={`present-${member.id}`}>Present</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`vip-${member.id}`}
                        checked={memberAttendance?.isVip || false}
                        onCheckedChange={(checked) => 
                          updateAttendance(member.id, "isVip", !!checked)
                        }
                        disabled={!memberAttendance?.present}
                      />
                      <Label htmlFor={`vip-${member.id}`}>VIP</Label>
                    </div>
                    <Input
                      placeholder="Remarks..."
                      value={memberAttendance?.remarks || ""}
                      onChange={(e) => updateAttendanceRemarks(member.id, e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Training Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Training Progress Updates
          </CardTitle>
          <CardDescription>Record training level completions for members</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="p-3 border rounded-lg">
                <p className="font-medium mb-2">{member.fullName}</p>
                <div className="flex flex-wrap gap-2">
                  {trainingLevels.map((level) => {
                    const hasUpdate = trainingUpdates.some(update => 
                      update.profileId === member.id && update.levelId === level.id
                    )
                    return (
                      <Button
                        key={level.id}
                        type="button"
                        variant={hasUpdate ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (hasUpdate) {
                            removeTrainingUpdate(member.id, level.id)
                          } else {
                            addTrainingUpdate(member.id, level.id)
                          }
                        }}
                      >
                        {level.code}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Giving Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Giving Breakdown
          </CardTitle>
          <CardDescription>Record tithes and offerings collected during the meeting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tithesAmount">Tithes Amount</Label>
              <Input
                id="tithesAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register("tithesAmount")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="offeringsAmount">Offerings Amount</Label>
              <Input
                id="offeringsAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                {...register("offeringsAmount")}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select defaultValue="USD" onValueChange={(value) => setValue("currency", value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="PHP">PHP</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          {isSubmitting ? "Logging Meeting..." : "Log Meeting"}
        </Button>
      </div>
    </form>
  )
}
