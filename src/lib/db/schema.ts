import { relations } from "drizzle-orm"
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  decimal,
  time,
  integer,
  jsonb,
  date,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core"

// Enums
export const roleEnum = pgEnum("role", ["ADMIN", "NETWORK_LEADER", "CELL_LEADER", "MEMBER"])
export const genderEnum = pgEnum("gender", ["MALE", "FEMALE", "OTHER"])
export const cellRoleEnum = pgEnum("cell_role", ["MEMBER", "ASSISTANT", "LEADER"])
export const membershipTypeEnum = pgEnum("membership_type", ["MEMBER", "LEADER"])
export const leadershipScopeEnum = pgEnum("leadership_scope", ["CELL", "NETWORK", "NONE"])
export const membershipStatusEnum = pgEnum("membership_status", ["ACTIVE", "INACTIVE", "SUSPENDED"])
export const registrationStatusEnum = pgEnum("registration_status", ["REGISTERED", "WAITLISTED", "CANCELLED"])
export const audienceEnum = pgEnum("audience", ["ALL", "LEADERS", "MEMBERS"])
export const actionEnum = pgEnum("action", [
  "CREATED",
  "UPDATED", 
  "DELETED",
  "LOGIN",
  "ROLE_ASSIGNED",
  "MEETING_LOGGED",
  "ATTENDANCE_MARKED",
  "GIVING_RECORDED",
  "TRAINING_COMPLETED",
  "EVENT_CREATED",
  "ANNOUNCEMENT_PUBLISHED"
])

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }),
  username: varchar("username", { length: 255 }),
  hashedPassword: varchar("hashed_password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: text("avatar_url"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  emailUnique: unique().on(table.email),
  usernameUnique: unique().on(table.username),
}))

// Profiles table (member profile)
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  fullName: varchar("full_name", { length: 255 }).notNull(), // Keep for backward compatibility
  birthdate: date("birthdate"),
  gender: genderEnum("gender"),
  address: text("address"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Networks table
export const networks = pgTable("networks", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Cells table
export const cells = pgTable("cells", {
  id: uuid("id").defaultRandom().primaryKey(),
  networkId: uuid("network_id").references(() => networks.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  leaderId: uuid("leader_id").references(() => profiles.id),
  createdBy: uuid("created_by").references(() => users.id),
  meetingDay: varchar("meeting_day", { length: 50 }),
  meetingTime: time("meeting_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// User roles table
export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: roleEnum("role").notNull(),
  networkId: uuid("network_id").references(() => networks.id, { onDelete: "cascade" }),
  cellId: uuid("cell_id").references(() => cells.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Cell memberships table (legacy - will be replaced by memberships)
export const cellMemberships = pgTable("cell_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  cellId: uuid("cell_id").references(() => cells.id, { onDelete: "cascade" }).notNull(),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  roleInCell: cellRoleEnum("role_in_cell").default("MEMBER").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  active: boolean("active").default(true).notNull(),
})

// New unified memberships table
export const memberships = pgTable("memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  networkId: uuid("network_id").references(() => networks.id, { onDelete: "cascade" }),
  cellId: uuid("cell_id").references(() => cells.id, { onDelete: "cascade" }),
  membershipType: membershipTypeEnum("membership_type").default("MEMBER").notNull(),
  leadershipScope: leadershipScopeEnum("leadership_scope").default("NONE").notNull(),
  status: membershipStatusEnum("status").default("ACTIVE").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Training levels table
export const trainingLevels = pgTable("training_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Training progress table
export const trainingProgress = pgTable("training_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  levelId: uuid("level_id").references(() => trainingLevels.id, { onDelete: "cascade" }).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  notes: text("notes"),
})

// Meetings table (cell meetings)
export const meetings = pgTable("meetings", {
  id: uuid("id").defaultRandom().primaryKey(),
  cellId: uuid("cell_id").references(() => cells.id, { onDelete: "cascade" }).notNull(),
  leaderUserId: uuid("leader_user_id").references(() => users.id).notNull(),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
  notes: text("notes"),
  groupPictureUrl: text("group_picture_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Meeting attendance table
export const meetingAttendance = pgTable("meeting_attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  meetingId: uuid("meeting_id").references(() => meetings.id, { onDelete: "cascade" }).notNull(),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  isVip: boolean("is_vip").default(false).notNull(),
  present: boolean("present").default(true).notNull(),
  remarks: text("remarks"),
})

// Giving table (cell giving for a meeting)
export const giving = pgTable("giving", {
  id: uuid("id").defaultRandom().primaryKey(),
  meetingId: uuid("meeting_id").references(() => meetings.id, { onDelete: "cascade" }).notNull(),
  tithesAmount: decimal("tithes_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  offeringsAmount: decimal("offerings_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
})

// Services table (Sunday services)
export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceDate: date("service_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Service attendance table
export const serviceAttendance = pgTable("service_attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "cascade" }).notNull(),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  isVip: boolean("is_vip").default(false).notNull(),
  present: boolean("present").default(true).notNull(),
})

// Events table
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  location: varchar("location", { length: 255 }),
  capacity: integer("capacity"),
  allowRegistration: boolean("allow_registration").default(true).notNull(),
  attachmentUrl: text("attachment_url"),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Event registrations table
export const eventRegistrations = pgTable("event_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  status: registrationStatusEnum("status").default("REGISTERED").notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
})

// Announcements table
export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at"),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  audience: audienceEnum("audience").default("ALL").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// Volunteer roles table
export const volunteerRoles = pgTable("volunteer_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Volunteer assignments table
export const volunteerAssignments = pgTable("volunteer_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  volunteerRoleId: uuid("volunteer_role_id").references(() => volunteerRoles.id, { onDelete: "cascade" }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: actionEnum("action").notNull(),
  subjectTable: varchar("subject_table", { length: 100 }).notNull(),
  subjectId: uuid("subject_id").notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// NextAuth tables for Drizzle adapter
export const accounts = pgTable("accounts", {
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
})

export const sessions = pgTable("sessions", {
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

export const verificationTokens = pgTable("verificationTokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  roles: many(userRoles),
  meetingsLed: many(meetings),
  eventsCreated: many(events),
  announcements: many(announcements),
  auditLogs: many(auditLogs),
  accounts: many(accounts),
  sessions: many(sessions),
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
  cellMemberships: many(cellMemberships),
  trainingProgress: many(trainingProgress),
  meetingAttendance: many(meetingAttendance),
  serviceAttendance: many(serviceAttendance),
  eventRegistrations: many(eventRegistrations),
  volunteerAssignments: many(volunteerAssignments),
}))

export const networksRelations = relations(networks, ({ many }) => ({
  cells: many(cells),
  userRoles: many(userRoles),
}))

export const cellsRelations = relations(cells, ({ one, many }) => ({
  network: one(networks, { fields: [cells.networkId], references: [networks.id] }),
  memberships: many(cellMemberships),
  meetings: many(meetings),
  userRoles: many(userRoles),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  network: one(networks, { fields: [userRoles.networkId], references: [networks.id] }),
  cell: one(cells, { fields: [userRoles.cellId], references: [cells.id] }),
}))

export const cellMembershipsRelations = relations(cellMemberships, ({ one }) => ({
  cell: one(cells, { fields: [cellMemberships.cellId], references: [cells.id] }),
  profile: one(profiles, { fields: [cellMemberships.profileId], references: [profiles.id] }),
}))

export const trainingLevelsRelations = relations(trainingLevels, ({ many }) => ({
  progress: many(trainingProgress),
}))

export const trainingProgressRelations = relations(trainingProgress, ({ one }) => ({
  profile: one(profiles, { fields: [trainingProgress.profileId], references: [profiles.id] }),
  level: one(trainingLevels, { fields: [trainingProgress.levelId], references: [trainingLevels.id] }),
}))

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  cell: one(cells, { fields: [meetings.cellId], references: [cells.id] }),
  leader: one(users, { fields: [meetings.leaderUserId], references: [users.id] }),
  attendance: many(meetingAttendance),
  giving: many(giving),
}))

export const meetingAttendanceRelations = relations(meetingAttendance, ({ one }) => ({
  meeting: one(meetings, { fields: [meetingAttendance.meetingId], references: [meetings.id] }),
  profile: one(profiles, { fields: [meetingAttendance.profileId], references: [profiles.id] }),
}))

export const givingRelations = relations(giving, ({ one }) => ({
  meeting: one(meetings, { fields: [giving.meetingId], references: [meetings.id] }),
}))

export const servicesRelations = relations(services, ({ many }) => ({
  attendance: many(serviceAttendance),
  volunteerAssignments: many(volunteerAssignments),
}))

export const serviceAttendanceRelations = relations(serviceAttendance, ({ one }) => ({
  service: one(services, { fields: [serviceAttendance.serviceId], references: [services.id] }),
  profile: one(profiles, { fields: [serviceAttendance.profileId], references: [profiles.id] }),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
  registrations: many(eventRegistrations),
  volunteerAssignments: many(volunteerAssignments),
}))

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
  profile: one(profiles, { fields: [eventRegistrations.profileId], references: [profiles.id] }),
}))

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, { fields: [announcements.authorId], references: [users.id] }),
}))

export const volunteerRolesRelations = relations(volunteerRoles, ({ many }) => ({
  assignments: many(volunteerAssignments),
}))

export const volunteerAssignmentsRelations = relations(volunteerAssignments, ({ one }) => ({
  event: one(events, { fields: [volunteerAssignments.eventId], references: [events.id] }),
  service: one(services, { fields: [volunteerAssignments.serviceId], references: [services.id] }),
  profile: one(profiles, { fields: [volunteerAssignments.profileId], references: [profiles.id] }),
  role: one(volunteerRoles, { fields: [volunteerAssignments.volunteerRoleId], references: [volunteerRoles.id] }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, { fields: [auditLogs.actorUserId], references: [users.id] }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

// Export types
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
export type Network = typeof networks.$inferSelect
export type NewNetwork = typeof networks.$inferInsert
export type Cell = typeof cells.$inferSelect
export type NewCell = typeof cells.$inferInsert
export type UserRole = typeof userRoles.$inferSelect
export type NewUserRole = typeof userRoles.$inferInsert
export type CellMembership = typeof cellMemberships.$inferSelect
export type NewCellMembership = typeof cellMemberships.$inferInsert
export type TrainingLevel = typeof trainingLevels.$inferSelect
export type NewTrainingLevel = typeof trainingLevels.$inferInsert
export type TrainingProgress = typeof trainingProgress.$inferSelect
export type NewTrainingProgress = typeof trainingProgress.$inferInsert
export type Meeting = typeof meetings.$inferSelect
export type NewMeeting = typeof meetings.$inferInsert
export type MeetingAttendance = typeof meetingAttendance.$inferSelect
export type NewMeetingAttendance = typeof meetingAttendance.$inferInsert
export type Giving = typeof giving.$inferSelect
export type NewGiving = typeof giving.$inferInsert
export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
export type ServiceAttendance = typeof serviceAttendance.$inferSelect
export type NewServiceAttendance = typeof serviceAttendance.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type EventRegistration = typeof eventRegistrations.$inferSelect
export type NewEventRegistration = typeof eventRegistrations.$inferInsert
export type Announcement = typeof announcements.$inferSelect
export type NewAnnouncement = typeof announcements.$inferInsert
export type VolunteerRole = typeof volunteerRoles.$inferSelect
export type NewVolunteerRole = typeof volunteerRoles.$inferInsert
export type VolunteerAssignment = typeof volunteerAssignments.$inferSelect
export type NewVolunteerAssignment = typeof volunteerAssignments.$inferInsert
export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
export type Membership = typeof memberships.$inferSelect
export type NewMembership = typeof memberships.$inferInsert
