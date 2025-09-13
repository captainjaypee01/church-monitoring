# Church Monitoring System

A comprehensive church management and monitoring system built with Next.js, featuring role-based access control, cell group management, event coordination, and detailed analytics.

## Features

- **Role-Based Access Control**: Admin, Network Leader, Cell Leader, and Member roles
- **Cell Group Management**: Meeting logging, attendance tracking, training progress
- **Event Management**: Create events, handle registrations, capacity management
- **Announcements**: Targeted communication to different audiences
- **VIP Tracking**: Monitor visitor engagement across services and cell groups
- **Giving Management**: Track tithes and offerings with detailed breakdowns
- **Volunteer Coordination**: Schedule volunteers for services and events
- **Comprehensive Reports**: Attendance, giving, training, and VIP analytics with CSV exports
- **Photo Upload**: Store group photos and event attachments via Vercel Blob

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL (Neon/Vercel Postgres)
- **ORM**: Drizzle ORM with HTTP driver
- **Authentication**: NextAuth v5 with Drizzle adapter
- **File Storage**: Vercel Blob
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table v8

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Neon/Vercel Postgres database
- Vercel account for Blob storage

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd church-monitoring
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the env.example file and fill in your values:
   ```bash
   cp env.example .env.local
   ```

   Required environment variables:
   ```env
   # Database (Neon/Vercel Postgres)
   DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-here

   # Vercel Blob Storage
   VERCEL_BLOB_RW_TOKEN=your-vercel-blob-token

   # Email (optional)
   RESEND_API_KEY=your-resend-api-key

   # Cron
   CRON_SECRET=your-cron-secret
   ```

4. **Set up the database**

   Generate and run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

   Seed the database with demo data:
   ```bash
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

After seeding the database, you can log in with these demo accounts:

- **Admin**: `admin@church.com` / `admin123`
- **Network Leader**: `network.leader@church.com` / `leader123`  
- **Cell Leader**: `cell.leader@church.com` / `cell123`
- **Member**: `john@church.com` / `member123`

## Deployment to Vercel

### Prerequisites

- Vercel account
- Neon database (or other PostgreSQL provider)
- Vercel Blob storage set up

### Deployment Steps

1. **Connect to Vercel**
   ```bash
   npx vercel@latest
   ```

2. **Set up environment variables in Vercel**
   
   In your Vercel dashboard, add these environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - `VERCEL_BLOB_RW_TOKEN`
   - `RESEND_API_KEY` (optional)
   - `CRON_SECRET`

3. **Deploy**
   ```bash
   npx vercel@latest --prod
   ```

4. **Run database migrations on production**
   
   After deployment, run migrations:
   ```bash
   # Using Vercel CLI
   npx vercel env pull .env.production
   DATABASE_URL=<your-production-db-url> npm run db:migrate
   ```

5. **Seed production database (optional)**
   
   If you want demo data in production:
   ```bash
   DATABASE_URL=<your-production-db-url> npm run db:seed
   ```

### Vercel Configuration

The project includes a `vercel.json` configuration with:
- Node.js runtime for auth and blob operations
- Cron job for automated reminders (every Monday at 9 AM)

### Setting up Vercel Cron

The system includes automated reminders via Vercel Cron. After deployment:

1. The cron job will automatically be set up based on `vercel.json`
2. Ensure your `CRON_SECRET` environment variable is set
3. The cron endpoint `/api/cron/reminders` will run weekly

## Database Management

### Available Scripts

- `npm run db:generate` - Generate migrations from schema changes
- `npm run db:migrate` - Run pending migrations
- `npm run db:push` - Push schema changes directly (development only)
- `npm run db:studio` - Open Drizzle Studio for database inspection
- `npm run db:seed` - Seed database with demo data

### Making Schema Changes

1. Update the schema in `src/lib/db/schema.ts`
2. Generate migrations: `npm run db:generate`
3. Review generated migration in `drizzle/` folder
4. Apply migration: `npm run db:migrate`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login)
│   ├── admin/             # Admin-only pages
│   ├── api/               # API routes
│   ├── cell/              # Cell leader pages
│   ├── events/            # Public event pages
│   ├── network/           # Network leader pages
│   └── actions/           # Server actions
├── components/            # Reusable UI components
│   ├── dashboard/         # Role-specific dashboards
│   ├── layout/            # Layout components
│   ├── ui/                # shadcn/ui components
│   └── [feature]/         # Feature-specific components
├── lib/                   # Utilities and configurations
│   ├── db/                # Database schema and connection
│   ├── auth.ts            # NextAuth configuration
│   ├── rbac.ts            # Role-based access control
│   └── utils.ts           # Utility functions
└── middleware.ts          # Route protection middleware
```

## Key Features

### Role-Based Access Control

The system implements comprehensive RBAC with four main roles:

- **ADMIN**: Full system access, user management, global reports
- **NETWORK_LEADER**: Manage multiple cells, network-wide insights
- **CELL_LEADER**: Manage assigned cell, log meetings, track members
- **MEMBER**: View personal data, register for events, see announcements

### Cell Meeting Logging

Cell leaders can log meetings with:
- Timestamped meeting records
- Member attendance with VIP flags
- Training progress updates
- Giving breakdown (tithes/offerings)
- Group photo uploads
- Meeting notes and remarks

### Event Management

- Admin-created events with registration system
- Capacity management and waitlists
- File attachments for event materials
- Registration status tracking
- Automated confirmation workflows

### VIP Tracking & Analytics

- Track visitors (VIPs) across Sunday services and cell groups
- Monthly VIP trends and conversion analytics
- Network-wide VIP insights for leaders
- Exportable reports for follow-up

## Testing

Run the test suite:
```bash
npm test
```

Run end-to-end tests:
```bash
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or issues:
1. Check the GitHub Issues page
2. Review the documentation
3. Contact the development team

---

Built with ❤️ for church communities worldwide.
