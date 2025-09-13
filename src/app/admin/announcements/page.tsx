import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { canManageAnnouncements } from "@/lib/rbac"
import { db } from "@/lib/db"
import { announcements, users } from "@/lib/db/schema"
import { desc, eq, isNotNull } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Megaphone, Users, Calendar, Edit, Eye } from "lucide-react"
import Link from "next/link"

export default async function AdminAnnouncementsPage() {
  const session = await auth()
  
  if (!session?.user || !canManageAnnouncements(session)) {
    redirect("/dashboard")
  }

  // Fetch announcements with author info
  const announcementsData = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      publishedAt: announcements.publishedAt,
      audience: announcements.audience,
      createdAt: announcements.createdAt,
      updatedAt: announcements.updatedAt,
      authorName: users.name,
    })
    .from(announcements)
    .innerJoin(users, eq(announcements.authorId, users.id))
    .orderBy(desc(announcements.createdAt))
    .limit(50)

  const publishedAnnouncements = announcementsData.filter(a => a.publishedAt)
  const draftAnnouncements = announcementsData.filter(a => !a.publishedAt)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Create and manage church announcements for different audiences
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/announcements/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcementsData.length}</div>
            <p className="text-xs text-muted-foreground">
              All announcements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedAnnouncements.length}</div>
            <p className="text-xs text-muted-foreground">
              Live announcements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftAnnouncements.length}</div>
            <p className="text-xs text-muted-foreground">
              Unpublished drafts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {announcementsData.filter(a => {
                const dayAgo = new Date()
                dayAgo.setDate(dayAgo.getDate() - 1)
                return new Date(a.createdAt) > dayAgo
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Created in last 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Draft Announcements */}
      {draftAnnouncements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Draft Announcements</CardTitle>
            <CardDescription>Unpublished announcements that need review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {draftAnnouncements.map((announcement) => (
                <div key={announcement.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{announcement.title}</h3>
                      <Badge variant="secondary">Draft</Badge>
                      <Badge variant="outline">{announcement.audience}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {new Date(announcement.createdAt).toLocaleDateString()} by {announcement.authorName}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/announcements/${announcement.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Published Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Published Announcements</CardTitle>
          <CardDescription>Live announcements visible to members</CardDescription>
        </CardHeader>
        <CardContent>
          {publishedAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No published announcements</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first announcement.</p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/admin/announcements/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Announcement
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {publishedAnnouncements.map((announcement) => (
                <div key={announcement.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{announcement.title}</h3>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Published
                      </Badge>
                      <Badge variant="outline">{announcement.audience}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {announcement.body}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Published {new Date(announcement.publishedAt!).toLocaleDateString()} by {announcement.authorName}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/announcements/${announcement.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/announcements/${announcement.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
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
