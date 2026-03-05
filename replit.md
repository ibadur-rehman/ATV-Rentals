# AI Receptionist Dashboard

## Overview

This is a full-stack web application for monitoring and analyzing AI receptionist call data for an ATV/UTV rental tour business. It provides a comprehensive dashboard with real-time metrics, call analytics, and a mobile-optimized SMS inbox for managing customer communications.

The application features a modern React frontend with TypeScript and shadcn/ui components, backed by an Express.js server with PostgreSQL database integration through Drizzle ORM.

## Recent Changes (February 27, 2026)

- **Location-Specific Logos**: Each location now has its own logo that switches dynamically
  - H-Town uses `htown-logo_1772190875526.png`, D-Town uses `dtown-logo_1772190875524.png`
  - Location interface extended with `logo` field in LocationContext
  - AppLayout header logo updates when switching locations via dropdown
  - Login, register, and preloader pages default to H-Town logo
  - Fixed Select component type mismatch (string vs number) for location dropdown
  - Old `takeovers-logo.png` replaced everywhere

## Recent Changes (February 13, 2026)

- **Multi-Agent Webhook Support**: Webhook now maps Retell agent_id to location/tenant
  - agent_htown → tenantId: 1 (H-Town), agent_dtown → tenantId: 2 (D-Town), unknown agents default to 1
  - Added agentId (text) and rawPayload (jsonb) columns to call_history table
  - Webhook stores agent_id, full raw payload, and resolved tenantId on every call record
  - Notifications created by webhook also carry the correct tenantId
  - Frontend dropdown filters calls by tenantId — no frontend changes needed
- **Tenant ID Changed to Numeric**: Updated tenantId from text strings ('htown'/'dtown') to integers (1/2)
  - H-Town ATV Rentals = tenantId: 1 (default), D-Town ATV Rentals = tenantId: 2
  - Updated schema columns from text to integer type with default of 1
  - Updated LocationContext, backend routes, storage interface all use numeric tenantId
  - All API query parameters parse tenantId as integer

## Recent Changes (February 12, 2026)

- **Multi-Location Support**: Added support for two business locations with tenant-scoped data
  - Two locations: H-Town ATV Rentals (tenantId: 1, default) and D-Town ATV Rentals (tenantId: 2)
  - Added tenantId column (default: 1) to call_history and notifications tables
  - LocationContext (client/src/contexts/LocationContext.tsx) provides tenantId to all components via useLocation2() hook
  - Location dropdown in AppLayout header positioned before user info
  - All backend API routes accept optional tenantId query parameter for filtering
  - All frontend queries (dashboard, call-history, notifications) include tenantId and refresh on location change
  - NotificationContext re-fetches notifications when location changes
  - Single database architecture: all data in one DB, filtered by tenantId column

## Recent Changes (November 14, 2025)

- **Real-Time Notification System**: Production-ready WebSocket-based notifications with sound alerts
  - Created notifications table with userId and callId foreign keys for proper data scoping
  - Comprehensive notification CRUD operations: create, get, getById, getUnreadCount, markAsRead, markAllAsRead
  - WebSocket server at /ws/notifications with session-based authentication
  - Real-time notification broadcasting scoped per user to prevent data leaks
  - Multi-user support: webhook creates notification for all users (single-tenant architecture)
  - Frontend NotificationBell component with unread badge and dropdown panel
  - NotificationContext manages WebSocket connection, auto-reconnect, and sound alerts
  - Click notification to redirect to call history and mark as read
  - Integration with Retell webhook service for automatic notification on call completion

- **Production Security Hardening**: Comprehensive session and WebSocket security improvements
  - Created server/session.ts module to eliminate circular dependencies
  - Production-safe session cookies: secure=true in production, false in development
  - Mandatory SESSION_SECRET in production (fails fast if missing)
  - WebSocket authentication uses shared session middleware with null guards
  - Session middleware validation prevents unauthenticated WebSocket upgrades
  - User-scoped database queries prevent cross-user data leakage

- **Webhook Service Improvements**: Enhanced Retell webhook handling
  - Fixed route path from /post-call to / (full endpoint: POST /api/retell/webhook)
  - Support for both call_analyzed (Retell) and call_ended (test) event types
  - Flexible data format handling for both test and production webhooks
  - Auto-creates call_history record if it doesn't exist (no prior call_started needed)
  - Robust error handling with comprehensive logging
  - Multi-user notification fanout ensures all users receive updates

## Recent Changes (October 29, 2025)

- **Call History Database Table**: Added persistent storage for call records
  - Created call_history table with 11 fields: id, callSid, fromNumber, toNumber, status, startTime, transcript, callDuration, recordingUrl, callSummary, createdAt
  - Comprehensive CRUD operations in storage layer: create, getById, getByCallSid, getAll, update, delete
  - Full TypeScript type safety with Drizzle ORM and Zod validation
  - Works with both PostgreSQL (DBStorage) and in-memory (MemStorage) implementations
  - Ready for integration with Twilio or other telephony services

- **Database Architecture**: Optimized two-table design for performance
  - Users table for authentication (id, name, email, passwordHash, createdAt)
  - Call History table for persistent call record storage
  - Dashboard analytics served as static data from backend routes (no database overhead)
  - Graceful fallback: DBStorage with PostgreSQL when DATABASE_URL exists, MemStorage otherwise
  - Fixed critical import-time crash by conditionally instantiating database connection

- **Complete Authentication System**: Implemented full user registration, login, and session management
  - PostgreSQL users table with bcrypt password hashing (10 salt rounds)
  - Auth service with secure password hashing and validation
  - Auth API routes: /register, /login, /logout, /me with Zod validation
  - Session-based authentication using express-session with SESSION_SECRET
  - Frontend auth context using TanStack Query with refetchQueries to prevent race conditions
  - ProtectedRoute wrapper with loading states to guard dashboard and pages
  - Automatic redirects: authenticated users → dashboard, unauthenticated → login
  - Fixed auth race condition by waiting for query refetch before navigation

- **Premium Red/Black Theme**: Rebranded entire application with ATV Rentals-inspired design
  - CSS variables: --primary-red (#DC143C crimson), --bright-red, --dark-red, --charcoal (#1C1C1C)
  - Utility classes: btn-red-gradient, card-elevated, skeleton-red, spinner-red, bg-red-gradient
  - Professional gradient buttons with hover animations
  - Elevated cards with shadows and border effects
  - Smooth page transitions with page-fade-in animation

- **Professional UI Pages**: Built stunning register, login, and dashboard pages
  - Register page: Gradient background, elevated card with brand logo (24x24), form validation, loading spinners, error alerts
  - Login page: Matching design with brand logo (24x24), red accent buttons and smooth transitions
  - Preloader component: Animated brand logo (32x32) with fade-out transition on app initialization
  - AppLayout: Premium header with brand logo (20x20), responsive sidebar with active states, professional footer
  - Mobile-responsive sidebar with overlay and smooth transitions
  - Brand logo integration: ATV Rentals logo displayed prominently on all pages in white rounded boxes

- **Dashboard Rebrand**: Completely rebranded performance dashboard with premium theme
  - MetricCard component: Charcoal cards with colored icon badges (blue/green/amber/red borders)
  - Skeleton loaders with red pulse animation for all async data
  - RecentCallsTable: Zebra-striped rows, red/black theme, search functionality
  - White text for values, gray-400 for labels, consistent spacing throughout

- **Call History Page**: Professional table with search, modal, and audio player placeholder
  - Elevated card design with charcoal background
  - Table with zebra striping and hover effects
  - Search bar with red accent focus states
  - Modal with call details, transcript, and audio player placeholder
  - Red action buttons with gradient effects

- **SMS Inbox Feature**: Mobile-optimized SMS messaging interface (separate cyan/slate theme)
  - Scoped styling that doesn't affect global red/black theme
  - Professional dark theme with gradient header and cyan accents
  - Message bubbles with glassmorphism effects
  - Quick reply templates for ATV/UTV rental scenarios
  - localStorage-based persistence

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints under `/api` namespace
- **Request Logging**: Custom middleware for API request/response logging
- **Error Handling**: Centralized error handling middleware
- **Development**: Hot module replacement with Vite integration

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless driver (@neondatabase/serverless) - single users table only
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Storage Pattern**: DBStorage (PostgreSQL) or MemStorage (in-memory) with automatic fallback
- **Static Data**: Dashboard metrics, calls, and analytics served from backend without database queries

### Database Schema Design
The application uses a **three-table database architecture**:

**Database Tables:**
- **Users Table**: id (varchar UUID), name (text), email (text unique), passwordHash (text), createdAt (timestamp)
- **Call History Table**: id (varchar UUID), callSid (text unique), fromNumber (text), toNumber (text), status (text), startTime (timestamp), transcript (text nullable), callDuration (integer nullable), recordingUrl (text nullable), callSummary (text nullable), createdAt (timestamp)
- **Notifications Table**: id (varchar UUID), userId (foreign key to users.id), callId (foreign key to call_history.id), title (text), message (text), isRead (integer 0/1), createdAt (timestamp)

**Static Data Types** (TypeScript types only, not in database):
- **Dashboard Metrics**: Total calls, success ratio, average duration, escalations with change metrics
- **Call Types**: Pricing inquiries, booking requests, Groupon inquiries, general support with percentages
- **Recent Calls**: Individual call records with time, date, type, duration, outcome, response time
- **Response Times**: Average, fastest, slowest response times
- **Peak Hours**: Time-range based call volume analysis

This architecture provides persistent storage for users and call history while serving dashboard analytics as static data.

### Authentication and Authorization
Session-based authentication with production-hardened security:
- **Session Configuration**: Stored in MemoryStore with 24-hour cleanup, httpOnly cookies, sameSite: "lax"
- **Production Safety**: Secure cookies in production (secure=true), requires SESSION_SECRET or fails to start
- **Password Security**: bcrypt hashing with 10 salt rounds for user credentials
- **Client State**: TanStack Query with automatic refetching to prevent race conditions
- **WebSocket Auth**: Session-based WebSocket upgrades with session middleware validation

### Real-Time Notifications
WebSocket-based notification system with production-grade security:
- **WebSocket Server**: /ws/notifications endpoint with session-based authentication
- **User Scoping**: All notifications filtered by userId to prevent data leakage
- **Broadcasting**: Real-time notifications broadcast only to notification owner's WebSocket connections
- **Multi-User Support**: Webhook creates notifications for all users in single-tenant system
- **Frontend Integration**: NotificationBell component with unread badge, dropdown, sound alerts
- **Auto-Reconnect**: WebSocket client automatically reconnects on disconnect
- **Mark as Read**: Click notification to navigate to call history and mark as read
- **API Routes**: GET /api/notifications, /api/notifications/unread-count, PATCH /api/notifications/:id/read, PATCH /api/notifications/mark-all-read

### External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives for accessible component foundation
- **Development Tools**: Replit-specific plugins for cartographer and dev banner integration
- **Build System**: Vite with React plugin and esbuild for production builds
- **Type Safety**: TypeScript with strict configuration and Zod for runtime validation

The architecture prioritizes type safety, developer experience, and rapid iteration while maintaining production-ready patterns for scaling.