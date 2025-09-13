import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canManageEvents } from "@/lib/rbac"
import { db } from "@/lib/db"
import { events, users, eventRegistrations } from "@/lib/db/schema"
import { desc, count, eq } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Users, Settings, Eye, Edit } from "lucide-react"
import Link from "next/link"

export default async function AdminEventsPage() {
  const session = await auth()
  
  if (!session?.user || !canManageEvents(session)) {
    redirect("/dashboard")
  }

  // Fetch events with creator info and registration counts
  const eventsData = await db
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
    .orderBy(desc(events.startAt))
    .limit(50)

  // Get registration counts for each event
  const eventsWithStats = await Promise.all(
    eventsData.map(async (event) => {
      const [registrationStats] = await db
        .select({
          totalRegistrations: count(),
        })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.eventId, event.id))

      return {
        ...event,
        registrationCount: Number(registrationStats?.totalRegistrations || 0),
      }
    })
  )

  const upcomingEvents = eventsWithStats.filter(event => new Date(event.startAt) > new Date())
  const pastEvents = eventsWithStats.filter(event => new Date(event.startAt) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground">
            Create and manage church events and activities
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsWithStats.length}</div>
            <p className="text-xs text-muted-foreground">
              All time events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              Future events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eventsWithStats.reduce((sum, event) => sum + event.registrationCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingEvents.length > 0 
                ? Math.round(upcomingEvents.reduce((sum, event) => 
                    sum + (event.capacity ? (event.registrationCount / event.capacity) * 100 : 0), 0
                  ) / upcomingEvents.filter(e => e.capacity).length) || 0
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average fill rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events scheduled for the future</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex space-x-2 mb-1">
                        <Badge variant="outline">
                          {event.registrationCount} registered
                        </Badge>
                        {event.capacity && (
                          <Badge variant="outline" className={
                            event.registrationCount >= event.capacity ? "bg-red-50 text-red-700 border-red-200" :
                            event.registrationCount / event.capacity > 0.8 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            "bg-green-50 text-green-700 border-green-200"
                          }>
                            {event.capacity - event.registrationCount} spots left
                          </Badge>
                        )}
                        {!event.allowRegistration && (
                          <Badge variant="secondary">Registration Closed</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created by {event.creatorName}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/events/${event.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Events</CardTitle>
            <CardDescription>Events that have already occurred</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastEvents.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg opacity-75">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.startAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} • {event.location}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge variant="secondary">
                        {event.registrationCount} attended
                      </Badge>
                    </div>
                    
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/events/${event.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {pastEvents.length > 10 && (
                <p className="text-center text-muted-foreground text-sm">
                  And {pastEvents.length - 10} more past events...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {eventsWithStats.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events created</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/admin/events/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
