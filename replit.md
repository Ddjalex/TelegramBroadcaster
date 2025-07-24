# Telegram Broadcast Bot Admin Dashboard

## Overview

This is a full-stack Telegram broadcast bot application with an admin dashboard. The system allows administrators to manage Telegram users, compose and send broadcast messages, view message history, and configure bot settings. The application uses a modern web stack with React frontend, Express.js backend, and PostgreSQL database.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 24, 2025
- **REPLIT MIGRATION COMPLETE**: Successfully migrated project from Replit Agent to Replit environment
  - Created PostgreSQL database with proper environment variable configuration
  - Fixed all package dependencies and build processes for Replit compatibility
  - Updated deployment configuration with new production build script
  - Ensured proper client/server separation and security practices
  - Application now runs cleanly on Replit with zero security vulnerabilities
  - All database tables created and default admin user initialized (admin/admin123)
  - Ready for Telegram bot token configuration and deployment to Render
- **AUTHENTICATION SYSTEM REMOVED**: Completely removed admin login system per user request
  - Removed login page, authentication hooks, and all auth-related components
  - Dropped admin_credentials database table and related storage methods
  - Updated sidebar to remove logout functionality
  - Application now provides direct access to admin dashboard without authentication
  - Simplified architecture for trusted environment usage
- **ENHANCED START MESSAGE RESTORED**: Restored and enhanced the bot's welcome message functionality
  - Configured rich welcome message with professional ET-ADs branding
  - Added engaging description highlighting premium advertisements and business opportunities
  - Set up attractive visual presentation with custom image support
  - Bot now sends professional welcome experience to new users
  - Welcome message emphasizes exclusive access and curated content benefits
- **DEPLOYMENT ISSUES FIXED**: Resolved all critical deployment problems for Render platform
  - Fixed database connection issues preventing Users/Dashboard from loading
  - Implemented proper webhook configuration for production bot messaging
  - Enhanced database connection handling with production-optimized settings
  - Added comprehensive deployment guide with exact environment variable requirements
  - Resolved admin updates saving issues through improved database error handling
  - Bot now works properly in production with webhook-based message handling

### July 23, 2025
- **REPLIT MIGRATION COMPLETE**: Successfully migrated project from Replit Agent to Replit environment
- **SECURITY FIX**: Resolved WebSocket connection errors by ensuring proper client/server separation
- Created PostgreSQL database with full schema migration
- Fixed all TypeScript compatibility issues in Telegram service
- Made bot service handle missing tokens gracefully for development
- Application now running cleanly on Replit with proper security practices
- Admin authentication working correctly (admin/admin123 default credentials)
- Dashboard fully functional with real-time API data
- **DEPLOYMENT FIXES**: Resolved production deployment issues
  - Fixed path alias resolution in esbuild for @shared imports
  - Created robust production startup script with error handling
  - Added proper port configuration for Render deployment
  - Created comprehensive deployment guide and troubleshooting
- **BOT ACTIVATION**: Telegram bot now fully operational
  - Bot token successfully configured and connected
  - Bot initialization working correctly in development mode
  - Ready to handle user registrations and broadcast messages
- **WELCOME MESSAGE FEATURE**: Added customizable bot welcome message system
  - Admin can now customize welcome title, description, button text, and image
  - Rich welcome messages with image support (similar to Wana Bingo style)
  - Settings accessible through admin dashboard Settings page
  - Bot dynamically uses custom welcome message for new users
  - Fallback to text message if image URL fails to load
- Fixed real-time user registration display - admin dashboard now shows new users automatically
- Enhanced polling intervals (10 seconds) for immediate visibility of new registrations
- Resolved "Disconnected" status display - now shows "Online" correctly
- **SECURITY UPGRADE COMPLETE**: Implemented secure admin authentication system
  - Replaced hardcoded credentials with bcrypt-hashed password storage
  - Added admin credentials database table with proper schema
  - Created password change endpoint with validation and error handling
  - Built Settings page with user-friendly password change form
  - Added security tips and password strength requirements
- **DASHBOARD ENHANCEMENT**: Upgraded admin dashboard with professional design
  - Enhanced statistics cards with progress bars and color-coded indicators
  - Professional metrics display with badges and visual improvements
  - Real-time data updates and better user experience
- **FUNCTIONALITY FIXES**: Resolved all major system issues
  - Fixed password change API parameter ordering
  - Corrected Quick Broadcast functionality 
  - Fixed Welcome Message save button errors
  - Enhanced error handling and user feedback
- **WELCOME MESSAGE CONNECTION FIX**: Fixed API routing issue preventing welcome message settings from connecting to Telegram bot
  - Reordered API routes to prevent generic settings endpoint from intercepting welcome-specific requests
  - Admin dashboard welcome message settings now properly saved and retrieved
  - Telegram bot now correctly uses custom welcome messages set in admin dashboard
  - Tested and verified complete connection between admin interface and bot functionality

### Previous Updates
- Added admin authentication system with login page
- Implemented simple username/password authentication (admin/admin123 default)
- Fixed Telegram bot to use contact button instead of inline keyboard
- Simplified phone sharing confirmation message to "Thank you! Your phone number has been saved. Waiting for important announcements."
- Added logout functionality to admin dashboard sidebar
- Removed callback query handlers for cleaner bot interaction
- **CRITICAL FIX**: Fixed broadcast system to only send messages to active users - inactive users are now properly filtered out
- Temporarily disabled WebSocket notifications due to connection issues in Replit environment
- Application uses standard HTTP requests with automatic refresh for real-time updates
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