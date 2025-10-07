import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { 
  events, 
  users, 
  eventRegistrations
} from "@/lib/db/schema"
import { eq, and, count } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  FileText, 
  ArrowLeft,
  UserPlus,
  UserMinus,
  Download
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { EventRegistrationButton } from "@/components/events/event-registration-button"

interface EventDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Get user's profile
  const [userProfile] = await db
    .select()
    .from(users)
    .where(eq(users.userId, session.user.id!))
    .limit(1)

  // Fetch event with creator info
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      description: events.description,
      startAt: events.startAt,
      endAt: events.endAt,
      location: events.location,
      capacity: events.capacity,
      allowRegistration: events.allowRegistration,
      attachmentUrl: events.attachmentUrl,
      createdAt: events.createdAt,
      creatorName: users.name,
      creatorId: events.createdBy,
    })
    .from(events)
    .innerJoin(users, eq(events.createdBy, users.id))
    .where(eq(events.id, params.id))
    .limit(1)

  if (!event) {
    redirect("/events")
  }

  // Get registration count
  const [registrationStats] = await db
    .select({
      totalRegistrations: count(),
    })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, params.id))

  const registrationCount = Number(registrationStats?.totalRegistrations || 0)

  // Check if current user is registered
  let userRegistration = null
  if (userProfile) {
    [userRegistration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(
        eq(eventRegistrations.eventId, params.id),
        eq(eventRegistrations.profileId, userProfile.id)
      ))
      .limit(1)
  }

  const isUserRegistered = !!userRegistration
  const canRegister = Boolean(event.allowRegistration && 
    (!event.capacity || registrationCount < event.capacity) && 
    !isUserRegistered &&
    userProfile)
  const isPastEvent = new Date(event.startAt) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        
        {!isPastEvent && userProfile && (
          <EventRegistrationButton
            eventId={event.id}
            profileId={userProfile.id}
            isRegistered={isUserRegistered}
            canRegister={canRegister}
            allowRegistration={event.allowRegistration}
            isAtCapacity={event.capacity ? registrationCount >= event.capacity : false}
          />
        )}
      </div>

      {/* Event Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <h1 className="text-4xl font-bold tracking-tight">{event.title}</h1>
          {isUserRegistered && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              You're Registered
            </Badge>
          )}
          {isPastEvent && (
            <Badge variant="secondary">Past Event</Badge>
          )}
        </div>
        
        <p className="text-xl text-muted-foreground">
          Created by {event.creatorName}
        </p>
      </div>

      {/* Event Status Alerts */}
      {!event.allowRegistration && (
        <Alert>
          <AlertDescription>
            Registration is currently closed for this event.
          </AlertDescription>
        </Alert>
      )}

      {event.capacity && registrationCount >= event.capacity && (
        <Alert>
          <AlertDescription>
            This event is at full capacity. Registration is no longer available.
          </AlertDescription>
        </Alert>
      )}

      {/* Event Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {event.description && (
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Attachment */}
          {event.attachmentUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Event Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium">Event Attachment</p>
                      <p className="text-sm text-muted-foreground">
                        Additional information or forms for this event
                      </p>
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <a href={event.attachmentUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Event Info Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Start Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.startAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">End Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.endAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.endAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Registration</p>
                  <p className="text-sm text-muted-foreground">
                    {registrationCount} people registered
                  </p>
                  {event.capacity && (
                    <p className="text-sm text-muted-foreground">
                      {event.capacity - registrationCount} spots remaining
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Action */}
          {!isPastEvent && userProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent>
                {isUserRegistered ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-medium">You're registered!</p>
                      <p className="text-green-600 text-sm">
                        We look forward to seeing you at this event.
                      </p>
                    </div>
                    <EventRegistrationButton
                      eventId={event.id}
                      profileId={userProfile.id}
                      isRegistered={true}
                      canRegister={false}
                      allowRegistration={event.allowRegistration}
                      isAtCapacity={false}
                    />
                  </div>
                ) : canRegister ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Join others who are attending this event.
                    </p>
                    <EventRegistrationButton
                      eventId={event.id}
                      profileId={userProfile.id}
                      isRegistered={false}
                      canRegister={true}
                      allowRegistration={event.allowRegistration}
                      isAtCapacity={event.capacity ? registrationCount >= event.capacity : false}
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm">
                      {!event.allowRegistration 
                        ? "Registration is currently closed"
                        : event.capacity && registrationCount >= event.capacity
                        ? "This event is at full capacity"
                        : "Registration not available"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
