import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { events, users, eventRegistrations, profiles } from "@/lib/db/schema"
import { desc, count, eq, and, gte } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, FileText } from "lucide-react"
import Link from "next/link"

export default async function EventsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Get user's profile
  const [userProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1)

  // Fetch upcoming events
  const upcomingEvents = await db
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
    })
    .from(events)
    .innerJoin(users, eq(events.createdBy, users.id))
    .where(gte(events.startAt, new Date()))
    .orderBy(events.startAt)
    .limit(20)

  // Get registration counts and user registration status for each event
  const eventsWithStats = await Promise.all(
    upcomingEvents.map(async (event) => {
      const [registrationStats] = await db
        .select({
          totalRegistrations: count(),
        })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, event.id))

      // Check if current user is registered
      let userRegistration = null
      if (userProfile) {
        [userRegistration] = await db
          .select()
          .from(eventRegistrations)
          .where(and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.profileId, userProfile.id)
          ))
          .limit(1)
      }

      return {
        ...event,
        registrationCount: Number(registrationStats?.totalRegistrations || 0),
        isUserRegistered: !!userRegistration,
        userRegistrationStatus: userRegistration?.status,
      }
    })
  )

  // Get user's registered events
  const userRegisteredEvents = userProfile ? await db
    .select({
      eventId: eventRegistrations.eventId,
      status: eventRegistrations.status,
      registeredAt: eventRegistrations.registeredAt,
      eventTitle: events.title,
      eventStartAt: events.startAt,
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .where(and(
      eq(eventRegistrations.profileId, userProfile.id),
      gte(events.startAt, new Date())
    ))
    .orderBy(events.startAt)
  : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Discover and register for upcoming church events and activities
        </p>
      </div>

      {/* User's Registered Events */}
      {userRegisteredEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Upcoming Events</CardTitle>
            <CardDescription>Events you have registered for</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userRegisteredEvents.map((registration) => (
                <div key={registration.eventId} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">{registration.eventTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(registration.eventStartAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {registration.status}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/events/${registration.eventId}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>All scheduled events open for registration</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsWithStats.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming events</h3>
              <p className="mt-1 text-sm text-gray-500">Check back later for new events and activities.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {eventsWithStats.map((event) => (
                <div key={event.id} className="border rounded-lg p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-xl font-semibold">{event.title}</h3>
                        {event.isUserRegistered && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            Registered
                          </Badge>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-muted-foreground mb-4">{event.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Start</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.startAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">End</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.endAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Location</p>
                              <p className="text-sm text-muted-foreground">{event.location}</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Registration</p>
                            <p className="text-sm text-muted-foreground">
                              {event.registrationCount}
                              {event.capacity && ` / ${event.capacity}`} registered
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!event.allowRegistration && (
                          <Badge variant="secondary">Registration Closed</Badge>
                        )}
                        {event.capacity && event.registrationCount >= event.capacity && (
                          <Badge variant="destructive">Full</Badge>
                        )}
                        {event.attachmentUrl && (
                          <Badge variant="outline" className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>Has Attachment</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <Button asChild>
                        <Link href={`/events/${event.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
