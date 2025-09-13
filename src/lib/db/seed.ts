import { db } from "./index"
import {
  users,
  profiles,
  networks,
  cells,
  userRoles,
  cellMemberships,
  trainingLevels,
  events,
  announcements,
  volunteerRoles,
  services,
  type NewUser,
  type NewProfile,
  type NewNetwork,
  type NewCell,
  type NewUserRole,
  type NewCellMembership,
  type NewTrainingLevel,
  type NewEvent,
  type NewAnnouncement,
  type NewVolunteerRole,
  type NewService,
} from "./schema"
import bcrypt from "bcryptjs"

async function seed() {
  console.log("🌱 Starting database seed...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const [adminUser] = await db
    .insert(users)
    .values({
      email: "admin@church.com",
      hashedPassword: adminPassword,
      name: "System Administrator",
      phone: "+1234567890",
    } satisfies NewUser)
    .returning()

  console.log("✅ Created admin user")

  // Create admin profile
  const [adminProfile] = await db
    .insert(profiles)
    .values({
      userId: adminUser.id,
      fullName: "System Administrator",
      gender: "OTHER",
      joinedAt: new Date(),
      isActive: true,
    } satisfies NewProfile)
    .returning()

  // Create demo network
  const [demoNetwork] = await db
    .insert(networks)
    .values({
      name: "Central Network",
      description: "Main network for demonstration purposes",
    } satisfies NewNetwork)
    .returning()

  console.log("✅ Created demo network")

  // Create demo cell
  const [demoCell] = await db
    .insert(cells)
    .values({
      networkId: demoNetwork.id,
      name: "Victory Cell Group",
      description: "A vibrant cell group meeting every Friday",
      meetingDay: "Friday",
      meetingTime: "19:00",
    } satisfies NewCell)
    .returning()

  console.log("✅ Created demo cell")

  // Assign admin role
  await db.insert(userRoles).values({
    userId: adminUser.id,
    role: "ADMIN",
  } satisfies NewUserRole)

  // Create network leader
  const networkLeaderPassword = await bcrypt.hash("leader123", 10)
  const [networkLeader] = await db
    .insert(users)
    .values({
      email: "network.leader@church.com",
      hashedPassword: networkLeaderPassword,
      name: "Network Leader",
      phone: "+1234567891",
    } satisfies NewUser)
    .returning()

  const [networkLeaderProfile] = await db
    .insert(profiles)
    .values({
      userId: networkLeader.id,
      fullName: "Network Leader",
      gender: "MALE",
      joinedAt: new Date(),
      isActive: true,
    } satisfies NewProfile)
    .returning()

  await db.insert(userRoles).values({
    userId: networkLeader.id,
    role: "NETWORK_LEADER",
    networkId: demoNetwork.id,
  } satisfies NewUserRole)

  // Create cell leader
  const cellLeaderPassword = await bcrypt.hash("cell123", 10)
  const [cellLeader] = await db
    .insert(users)
    .values({
      email: "cell.leader@church.com",
      hashedPassword: cellLeaderPassword,
      name: "Cell Leader",
      phone: "+1234567892",
    } satisfies NewUser)
    .returning()

  const [cellLeaderProfile] = await db
    .insert(profiles)
    .values({
      userId: cellLeader.id,
      fullName: "Cell Leader",
      gender: "FEMALE",
      joinedAt: new Date(),
      isActive: true,
    } satisfies NewProfile)
    .returning()

  await db.insert(userRoles).values({
    userId: cellLeader.id,
    role: "CELL_LEADER",
    cellId: demoCell.id,
  } satisfies NewUserRole)

  await db.insert(cellMemberships).values({
    cellId: demoCell.id,
    profileId: cellLeaderProfile.id,
    roleInCell: "LEADER",
  } satisfies NewCellMembership)

  // Create demo members
  const memberPassword = await bcrypt.hash("member123", 10)
  
  const memberData = [
    { name: "John Smith", email: "john@church.com", gender: "MALE" as const },
    { name: "Jane Doe", email: "jane@church.com", gender: "FEMALE" as const },
    { name: "Bob Wilson", email: "bob@church.com", gender: "MALE" as const },
    { name: "Alice Johnson", email: "alice@church.com", gender: "FEMALE" as const },
  ]

  for (const member of memberData) {
    const [memberUser] = await db
      .insert(users)
      .values({
        email: member.email,
        hashedPassword: memberPassword,
        name: member.name,
        phone: `+123456789${Math.floor(Math.random() * 10)}`,
      } satisfies NewUser)
      .returning()

    const [memberProfile] = await db
      .insert(profiles)
      .values({
        userId: memberUser.id,
        fullName: member.name,
        gender: member.gender,
        joinedAt: new Date(),
        isActive: true,
      } satisfies NewProfile)
      .returning()

    await db.insert(userRoles).values({
      userId: memberUser.id,
      role: "MEMBER",
    } satisfies NewUserRole)

    await db.insert(cellMemberships).values({
      cellId: demoCell.id,
      profileId: memberProfile.id,
      roleInCell: "MEMBER",
    } satisfies NewCellMembership)
  }

  console.log("✅ Created demo members")

  // Create training levels
  const trainingLevelsData: NewTrainingLevel[] = [
    { code: "L1", title: "Foundation Level 1", order: 1 },
    { code: "L2", title: "Foundation Level 2", order: 2 },
    { code: "L3", title: "Foundation Level 3", order: 3 },
    { code: "L4", title: "Foundation Level 4", order: 4 },
    { code: "SOW", title: "School of Worship", order: 5 },
    { code: "SOE", title: "School of Evangelism", order: 6 },
    { code: "SOL", title: "School of Leadership", order: 7 },
  ]

  await db.insert(trainingLevels).values(trainingLevelsData)
  console.log("✅ Created training levels")

  // Create demo events
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30)

  const pastDate = new Date()
  pastDate.setDate(pastDate.getDate() - 7)

  const eventsData: NewEvent[] = [
    {
      title: "Church Retreat 2024",
      description: "Annual church retreat for spiritual growth and fellowship",
      startAt: futureDate,
      endAt: new Date(futureDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
      location: "Mountain View Resort",
      capacity: 100,
      allowRegistration: true,
      createdBy: adminUser.id,
    },
    {
      title: "Youth Night",
      description: "Special night for young people with worship and games",
      startAt: pastDate,
      endAt: new Date(pastDate.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      location: "Church Main Hall",
      capacity: 50,
      allowRegistration: true,
      createdBy: adminUser.id,
    },
  ]

  await db.insert(events).values(eventsData)
  console.log("✅ Created demo events")

  // Create demo announcements
  const announcementsData: NewAnnouncement[] = [
    {
      title: "Welcome New Members!",
      body: "We are excited to welcome our new members to the church family. Please join us in fellowship and get to know them better.",
      publishedAt: new Date(),
      authorId: adminUser.id,
      audience: "ALL",
    },
    {
      title: "Leadership Meeting Next Week",
      body: "All cell leaders and network leaders are invited to attend the monthly leadership meeting next Tuesday at 7 PM.",
      publishedAt: new Date(),
      authorId: adminUser.id,
      audience: "LEADERS",
    },
  ]

  await db.insert(announcements).values(announcementsData)
  console.log("✅ Created demo announcements")

  // Create volunteer roles
  const volunteerRolesData: NewVolunteerRole[] = [
    { name: "Usher", description: "Assist with seating and general church service flow" },
    { name: "Worship Team", description: "Lead worship during services" },
    { name: "Sound Technician", description: "Manage audio equipment during services" },
    { name: "Children's Ministry", description: "Help with children's programs and activities" },
    { name: "Hospitality", description: "Welcome guests and serve refreshments" },
  ]

  await db.insert(volunteerRoles).values(volunteerRolesData)
  console.log("✅ Created volunteer roles")

  // Create demo service
  const lastSunday = new Date()
  lastSunday.setDate(lastSunday.getDate() - ((lastSunday.getDay() + 7) % 7))

  await db.insert(services).values({
    serviceDate: lastSunday.toISOString().split('T')[0],
    notes: "Great service with powerful worship and inspiring message",
  } satisfies NewService)

  console.log("✅ Created demo service")

  console.log("🎉 Database seeded successfully!")
  console.log("\n📧 Demo Login Credentials:")
  console.log("Admin: admin@church.com / admin123")
  console.log("Network Leader: network.leader@church.com / leader123")
  console.log("Cell Leader: cell.leader@church.com / cell123")
  console.log("Member: john@church.com / member123")
}

// Run the seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log("Seeding completed")
      process.exit(0)
    })
    .catch((error) => {
      console.error("Seeding failed:", error)
      process.exit(1)
    })
}

export default seed
