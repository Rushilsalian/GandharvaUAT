# Gandharva Investment Management Platform

## Overview

Gandharva is a comprehensive investment management platform designed for financial services with three distinct user roles: Admin, Leader, and Client. The application provides portfolio tracking, transaction management, user administration, and detailed financial analytics. Built with a modern React frontend and Node.js/Express backend, it offers role-based access control and comprehensive data management capabilities for investment firms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, professional design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **UI Components**: Comprehensive component library based on Radix UI primitives with custom styling
- **Theme Support**: Built-in light/dark mode theming with CSS custom properties
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API architecture with standardized endpoints
- **File Structure**: Monorepo structure with shared schema between client and server
- **Development**: TypeScript throughout with strict type checking

### Database Design
- **Primary Database**: PostgreSQL (via Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Core Tables**: 
  - Users (with role-based access: admin/leader/client)
  - Branches (office locations and management)
  - Clients (extending users with investment-specific data)
  - Transactions (investments, withdrawals, payouts, closures)
  - Portfolio (client investment tracking)

### Role-Based Access Control
- **Admin Role**: Full system access including user management, branch management, data imports, and system configuration
- **Leader Role**: Team management with access to team performance metrics, referrals, and commissions
- **Client Role**: Personal dashboard access with portfolio viewing, withdrawal requests, and payment capabilities

### Design System
- **Color Palette**: Professional financial services theme with primary blue, success green, and warning red
- **Typography**: Inter font family for clean, readable financial data presentation
- **Layout**: Card-based responsive design optimized for both desktop and mobile devices
- **Component Standards**: Consistent spacing using Tailwind's systematic approach (2, 4, 6, 8, 12, 16 units)

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **TypeScript**: Full TypeScript implementation across frontend and backend
- **Build Tools**: Vite for frontend bundling, ESBuild for backend compilation

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Radix UI**: Comprehensive set of low-level UI primitives (@radix-ui/react-*)
- **shadcn/ui**: High-quality component library built on Radix primitives
- **Class Variance Authority**: Utility for creating variant-based component APIs
- **Lucide React**: Consistent icon library for all UI elements

### Backend Services
- **Database**: Neon PostgreSQL serverless database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Session Management**: Connect-pg-simple for PostgreSQL-backed session storage

### Development and Tooling
- **React Query**: Server state management and caching (@tanstack/react-query)
- **Form Handling**: React Hook Form with Zod validation (@hookform/resolvers)
- **Date Utilities**: date-fns for consistent date manipulation
- **Development**: tsx for TypeScript execution, various development utilities

### Chart and Data Visualization
- **Recharts**: React charting library for financial data visualization
- **Chart Components**: Line charts, bar charts, and trend analysis displays

### Email and Communication
- **SendGrid**: Email service integration (@sendgrid/mail) for client notifications and system communications

### Payment Processing
- **Stripe**: Payment processing integration (@stripe/stripe-js, @stripe/react-stripe-js) for client investment transactions