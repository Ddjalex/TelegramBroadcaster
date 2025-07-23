# Telegram Broadcast Bot Admin Dashboard

## Overview

This is a full-stack Telegram broadcast bot application with an admin dashboard. The system allows administrators to manage Telegram users, compose and send broadcast messages, view message history, and configure bot settings. The application uses a modern web stack with React frontend, Express.js backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 23, 2025
- Added admin authentication system with login page
- Implemented simple username/password authentication (admin/admin123 default)
- Fixed Telegram bot to use contact button instead of inline keyboard
- Simplified phone sharing confirmation message to "Thank you! Your phone number has been saved. Waiting for important announcements."
- Added logout functionality to admin dashboard sidebar
- Removed callback query handlers for cleaner bot interaction
- **CRITICAL FIX**: Fixed broadcast system to only send messages to active users - inactive users are now properly filtered out
- Added real-time WebSocket notification system for all admin actions
- Implemented WebSocket server with automatic reconnection and connection status indicator
- Fixed TypeScript errors in user management preventing mute functionality from working
- Removed block functionality from admin interface - users can only be muted or removed

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom theming and CSS variables
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite with React plugin
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database ORM**: Drizzle ORM
- **Schema Validation**: Zod
- **Session Management**: Express sessions (configured for PostgreSQL storage)
- **Telegram Integration**: node-telegram-bot-api library
- **Development**: tsx for TypeScript execution

### Database Schema
The application uses PostgreSQL with the following main entities:
- **users**: Telegram user information and activity tracking
- **broadcasts**: Message campaigns with status and delivery metrics
- **messageDeliveries**: Individual message delivery tracking
- **botSettings**: Configuration key-value pairs

## Key Components

### Authentication & Authorization
- No traditional authentication system implemented
- Direct admin dashboard access (suitable for internal/trusted environments)

### Telegram Bot Service
- Webhook-based message handling in production
- Polling mode for development
- Command handling (/start, user registration)
- Broadcast message delivery system

### Admin Dashboard
- **Dashboard**: Overview statistics and quick actions
- **Compose**: Message creation with preview functionality
- **Users**: User management and statistics
- **History**: Broadcast message history and analytics
- **Settings**: Bot configuration and preferences

### UI Components
- Comprehensive shadcn/ui component library
- Responsive design with mobile support
- Dark/light theme support via CSS variables
- Form components with validation
- Data tables and charts for analytics

## Data Flow

### User Registration Flow
1. User starts bot via Telegram (/start command)
2. Bot captures user information (telegram_id, username, names)
3. User record created/updated in database
4. Welcome message sent to user

### Broadcast Flow
1. Admin creates broadcast in dashboard
2. Message saved as draft with metadata
3. Admin triggers send operation
4. System queues individual deliveries for each active user
5. Bot sends messages via Telegram API
6. Delivery status tracked and updated in real-time
7. Statistics aggregated for broadcast analytics

### Real-time Updates
- Dashboard stats refresh automatically
- TanStack Query handles background refetching
- WebSocket connections not implemented (polling-based updates)

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL client
- **node-telegram-bot-api**: Telegram Bot API wrapper
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **react-hook-form** + **@hookform/resolvers**: Form handling
- **zod**: Schema validation
- **date-fns**: Date manipulation utilities

### UI Dependencies
- **@radix-ui/***: Headless UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant handling

### Development Dependencies
- **vite**: Build tool and dev server
- **tsx**: TypeScript execution
- **drizzle-kit**: Database migrations and introspection

## Deployment Strategy

### Development
- Vite dev server for frontend
- tsx for backend TypeScript execution
- Bot runs in polling mode
- Database migrations via drizzle-kit push

### Production
- Static assets built with Vite
- Backend bundled with esbuild
- Bot configured for webhook mode
- Environment variables for configuration:
  - `DATABASE_URL`: PostgreSQL connection string
  - `TELEGRAM_BOT_TOKEN`: Bot API token
  - `WEBHOOK_URL`: Telegram webhook endpoint

### Environment Configuration
- Development: Local PostgreSQL or Neon database
- Production: Neon serverless PostgreSQL
- Session storage: PostgreSQL via connect-pg-simple
- Static file serving: Express static middleware

The application is structured as a monorepo with shared TypeScript schemas between client and server, enabling type safety across the full stack. The architecture supports horizontal scaling with proper session management and database connection pooling.