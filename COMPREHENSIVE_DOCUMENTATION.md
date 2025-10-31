# Gandharva Design - Comprehensive Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Design](#3-database-design)
4. [API Documentation](#4-api-documentation)
5. [Module Documentation](#5-module-documentation)
6. [Development Guide](#6-development-guide)
7. [Migration Guide](#7-migration-guide)
8. [Third-Party Integration](#8-third-party-integration)
9. [Design Guidelines](#9-design-guidelines)
10. [Deployment & Operations](#10-deployment--operations)

---

## 1. Project Overview

### 1.1 Product Summary
Gandharva Design is a comprehensive investment management platform designed to facilitate investment operations, client management, and portfolio tracking for financial institutions. The platform serves three primary user types: Administrators, Leaders, and Clients, each with role-specific functionalities and access controls.

### 1.2 Business Objectives
- Streamline investment management processes
- Provide real-time portfolio tracking and reporting
- Enable secure client onboarding and KYC management
- Facilitate multi-branch operations with centralized control
- Automate transaction processing and reporting

### 1.3 Target Users
- **Administrators**: Full system access, user management, branch operations
- **Leaders**: Branch-level management, team oversight, reporting
- **Clients**: Personal portfolio management, transaction requests, reporting

### 1.4 Key Features
- **Role-based Access Control**: Admin, Leader, Client roles with specific permissions
- **Multi-branch Support**: Centralized management with branch-wise operations
- **Investment Management**: Multiple instrument types (equity, mutual funds, bonds, FDs)
- **Transaction Processing**: Investment, withdrawal, payout, closure transactions
- **Portfolio Tracking**: Real-time valuation and performance analytics
- **Bulk Operations**: Excel import for transactions and client data
- **KYC Management**: Document verification and compliance tracking
- **Reporting & Analytics**: Comprehensive dashboards and custom reports

---

## 2. System Architecture

### 2.1 Technology Stack
```
Frontend:
├── React 18.3.1
├── TypeScript 5.6.3
├── Vite 5.4.19 (Build Tool)
├── Tailwind CSS 3.4.17
├── Radix UI Components
├── React Query (TanStack Query)
├── Wouter (Routing)
└── Lucide React (Icons)

Backend:
├── Node.js
├── Express.js 4.21.2
├── TypeScript 5.6.3
├── Drizzle ORM 0.39.1
├── MySQL2 3.15.1
├── JWT Authentication
├── Multer (File Upload)
├── XLSX (Excel Processing)
└── Zod (Validation)

Database:
├── MySQL
├── Dual Schema (Legacy + Master Tables)
└── Drizzle Kit (Migrations)
```

### 2.2 Project Structure
```
GandharvaDesign/
├── client/                 # Frontend React Application
│   └── src/
│       ├── components/     # Reusable UI Components
│       ├── pages/         # Page Components
│       ├── contexts/      # React Contexts
│       ├── hooks/         # Custom Hooks
│       └── lib/           # Utilities & API Client
├── server/                # Backend Express Application
│   ├── routes.ts          # API Route Definitions
│   ├── storage.ts         # Database Layer
│   ├── db.ts             # Database Connection
│   └── *.ts              # Various Server Modules
├── shared/                # Shared Code
│   └── schema.ts         # Database Schema & Types
├── migrations/           # Database Migrations
└── *.md                 # Documentation Files
```

### 2.3 Architecture Patterns
- **Frontend**: Component-based architecture with React
- **Backend**: Layered architecture (Routes → Storage → Database)
- **Database**: Dual schema approach (Legacy + Master tables)
- **Authentication**: JWT-based stateless authentication
- **State Management**: React Query for server state, React Context for client state

---

## 3. Database Design

### 3.1 Database Overview
- **Database Type**: MySQL
- **ORM**: Drizzle ORM
- **Schema Location**: `shared/schema.ts`
- **Dual System**: Legacy tables (UUID-based) + Master tables (Integer ID-based)

### 3.2 Legacy Tables

#### 3.2.1 Branches Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, UUID | Unique branch identifier |
| name | text | NOT NULL | Branch name |
| code | text | NOT NULL, UNIQUE | Branch code |
| address | text | NOT NULL | Branch address |
| phone | text | nullable | Branch phone number |
| email | text | nullable | Branch email |
| manager | text | nullable | Branch manager name |
| created_at | timestamp | DEFAULT NOW | Record creation timestamp |

#### 3.2.2 Users Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, UUID | Unique user identifier |
| email | text | NOT NULL, UNIQUE | User email address |
| mobile | text | UNIQUE, nullable | User mobile number |
| password | text | NOT NULL | User password (hashed) |
| role | text | NOT NULL | User role: 'admin', 'leader', 'client' |
| first_name | text | NOT NULL | User first name |
| last_name | text | NOT NULL | User last name |
| branch_id | varchar | FK to branches.id | Associated branch |
| is_active | boolean | DEFAULT true | User active status |
| created_at | timestamp | DEFAULT NOW | Record creation timestamp |

#### 3.2.3 Clients Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, UUID | Unique client identifier |
| user_id | varchar | FK to users.id, NOT NULL | Associated user account |
| client_code | text | NOT NULL, UNIQUE | Client code |
| pan_number | text | nullable | PAN card number |
| aadhar_number | text | nullable | Aadhar card number |
| date_of_birth | timestamp | nullable | Client date of birth |
| address | text | nullable | Client address |
| nominee_details | text | nullable | Nominee information |
| bank_details | text | nullable | Bank account details |
| kyc_status | text | DEFAULT 'pending' | KYC status: 'pending', 'verified', 'rejected' |
| total_investment | decimal(15,2) | DEFAULT '0' | Total investment amount |
| current_value | decimal(15,2) | DEFAULT '0' | Current portfolio value |
| created_at | timestamp | DEFAULT NOW | Record creation timestamp |

#### 3.2.4 Transactions Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, UUID | Unique transaction identifier |
| client_id | varchar | FK to clients.id, NOT NULL | Associated client |
| type | text | NOT NULL | Transaction type: 'investment', 'withdrawal', 'payout', 'closure' |
| amount | decimal(15,2) | NOT NULL | Transaction amount |
| method | text | NOT NULL | Payment method: 'cash', 'bank_transfer', 'upi', 'cheque' |
| status | text | NOT NULL, DEFAULT 'pending' | Status: 'pending', 'completed', 'failed', 'cancelled' |
| description | text | nullable | Transaction description |
| reference_number | text | nullable | Reference/transaction number |
| processed_by | varchar | FK to users.id, nullable | User who processed transaction |
| processed_at | timestamp | nullable | Processing timestamp |
| created_at | timestamp | DEFAULT NOW | Record creation timestamp |

#### 3.2.5 Portfolios Table
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar | PRIMARY KEY, UUID | Unique portfolio identifier |
| client_id | varchar | FK to clients.id, NOT NULL | Associated client |
| instrument_type | text | NOT NULL | Instrument type: 'equity', 'mutual_fund', 'bond', 'fd' |
| instrument_name | text | NOT NULL | Name of the investment instrument |
| quantity | decimal(15,4) | nullable | Quantity of instruments |
| purchase_price | decimal(15,2) | NOT NULL | Price at purchase |
| current_price | decimal(15,2) | nullable | Current market price |
| total_invested | decimal(15,2) | NOT NULL | Total amount invested |
| current_value | decimal(15,2) | nullable | Current market value |
| gain_loss | decimal(15,2) | nullable | Gain or loss amount |
| gain_loss_percentage | decimal(5,2) | nullable | Gain or loss percentage |
| purchase_date | timestamp | NOT NULL | Date of purchase |
| updated_at | timestamp | DEFAULT NOW | Last update timestamp |

### 3.3 Master Tables (New System)

#### 3.3.1 Master Role (mst_role)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| role_id | int | PRIMARY KEY, AUTO_INCREMENT | Unique role identifier |
| name | varchar(50) | NOT NULL | Role name |
| is_active | tinyint | DEFAULT 1 | Active status |
| created_by_id | int | NOT NULL | Creator user ID |
| created_by_user | varchar(50) | NOT NULL | Creator username |
| created_date | datetime | NOT NULL | Creation timestamp |

#### 3.3.2 Master User (mst_user)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | int | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| user_name | varchar(50) | NOT NULL, UNIQUE | Username |
| password | varchar(255) | NOT NULL | Hashed password |
| email | varchar(100) | UNIQUE | Email address |
| mobile | varchar(15) | UNIQUE | Mobile number |
| role_id | int | FK to mst_role.role_id | User role |
| is_active | tinyint | DEFAULT 1 | Active status |
| created_by_id | int | NOT NULL | Creator user ID |
| created_by_user | varchar(50) | NOT NULL | Creator username |
| created_date | datetime | NOT NULL | Creation timestamp |

#### 3.3.3 Master Branch (mst_branch)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| branch_id | int | PRIMARY KEY, AUTO_INCREMENT | Unique branch identifier |
| name | varchar(100) | NOT NULL | Branch name |
| address | varchar(255) | NOT NULL | Branch address |
| city | varchar(50) | NOT NULL | City |
| pincode | int | nullable | PIN code |
| is_active | tinyint | DEFAULT 1 | Active status |
| created_by_id | int | NOT NULL | Creator user ID |
| created_by_user | varchar(50) | NOT NULL | Creator username |
| created_date | datetime | NOT NULL | Creation timestamp |

#### 3.3.4 Master Client (mst_client)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| client_id | int | PRIMARY KEY, AUTO_INCREMENT | Unique client identifier |
| code | varchar(20) | NOT NULL, UNIQUE | Client code |
| name | varchar(100) | NOT NULL | Client name |
| mobile | varchar(15) | UNIQUE | Mobile number |
| email | varchar(100) | UNIQUE | Email address |
| dob | date | nullable | Date of birth |
| pan_no | varchar(10) | nullable | PAN number |
| aadhaar_no | varchar(12) | nullable | Aadhaar number |
| branch_id | int | FK to mst_branch.branch_id | Associated branch |
| address | varchar(255) | nullable | Address |
| city | varchar(50) | nullable | City |
| pincode | int | nullable | PIN code |
| reference_id | int | nullable | Reference ID |
| is_active | tinyint | DEFAULT 1 | Active status |
| created_by_id | int | NOT NULL | Creator user ID |
| created_by_user | varchar(50) | NOT NULL | Creator username |
| created_date | datetime | NOT NULL | Creation timestamp |

#### 3.3.5 Transaction Table (New)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| transaction_id | bigint | PRIMARY KEY, AUTO_INCREMENT | Unique transaction identifier |
| transaction_date | date | NOT NULL | Transaction date |
| client_id | int | FK to mst_client.client_id | Associated client |
| indicator_id | int | FK to mst_indicator.indicator_id | Transaction type indicator |
| amount | decimal(18,2) | NOT NULL | Transaction amount |
| remark | varchar(50) | nullable | Transaction remark |
| created_by_id | int | NOT NULL | Creator user ID |
| created_by_user | varchar(50) | NOT NULL | Creator username |
| created_date | datetime | NOT NULL | Creation timestamp |

### 3.4 Database Relationships
```
Legacy System:
branches (1) ←→ (many) users (1) ←→ (1) clients (1) ←→ (many) transactions
                                              ↓
                                         (many) portfolios

Master System:
mst_branch (1) ←→ (many) mst_client (1) ←→ (many) transaction
mst_role (1) ←→ (many) mst_user
mst_indicator (1) ←→ (many) transaction
```

---

## 4. API Documentation

### 4.1 Authentication APIs

#### POST /api/auth/login
User login with dual system support (legacy + master users)

**Request Body:**
```json
{
  "email": "admin@gandharva.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "user": {
    "userId": 1,
    "userName": "admin",
    "email": "admin@gandharva.com",
    "roleId": 1
  },
  "message": "Login successful",
  "userType": "master"
}
```

### 4.2 Legacy API Endpoints

#### User Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/users` | Get all users (without passwords) | - |
| GET | `/api/users/:id` | Get user by ID | - |
| POST | `/api/users` | Create new user | `{ email, mobile?, password, role, firstName, lastName, branchId?, isActive? }` |
| PUT | `/api/users/:id` | Update user | `{ ...updateFields }` |

#### Branch Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/branches` | Get all branches | - |
| GET | `/api/branches/:id` | Get branch by ID | - |
| POST | `/api/branches` | Create new branch | `{ name, code, address, phone?, email?, manager? }` |
| PUT | `/api/branches/:id` | Update branch | `{ ...updateFields }` |

#### Client Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/clients` | Get all clients with user details | - |
| GET | `/api/clients/:id` | Get client by ID with user details | - |
| GET | `/api/clients/user/:userId` | Get client by user ID | - |
| POST | `/api/clients` | Create new client (basic) | `{ userId, clientCode, panNumber?, aadharNumber?, ... }` |
| POST | `/api/clients/create` | Secure client creation (auto-password) | `{ firstName, lastName, email, mobile?, clientCode, panNumber?, ... }` |
| PUT | `/api/clients/:id` | Update client details | `{ ...updateFields }` |
| GET | `/api/clients/:clientId/transactions` | Get client transactions (with type filter) | Query: `?type=investment` |

#### Transaction Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/transactions` | Get all transactions | Query: `?clientId=...&type=...` |
| GET | `/api/transactions/:id` | Get transaction by ID | - |
| POST | `/api/transactions` | Create new transaction | `{ clientId, type, amount, method, status?, description?, referenceNumber?, processedBy? }` |
| PUT | `/api/transactions/:id` | Update transaction | `{ ...updateFields }` |
| POST | `/api/transactions/upload` | Bulk upload via Excel | Form data: `file` + `type` |

#### Portfolio Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/portfolios` | Get all portfolios | Query: `?clientId=...` |
| POST | `/api/portfolios` | Create new portfolio entry | `{ clientId, instrumentType, instrumentName, purchasePrice, totalInvested, purchaseDate, ... }` |

### 4.3 Master Table APIs

#### Master Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mst/users` | Get all master users |
| POST | `/api/mst/users` | Create new master user |
| PUT | `/api/mst/users/:id` | Update master user |
| GET | `/api/mst/users/:id` | Get master user by ID |

#### Master Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mst/clients` | Get all master clients |
| POST | `/api/mst/clients` | Create new master client |
| PUT | `/api/mst/clients/:id` | Update master client |
| GET | `/api/mst/clients/:id` | Get master client by ID |

#### Master Branches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mst/branches` | Get all master branches |
| POST | `/api/mst/branches` | Create new master branch |
| PUT | `/api/mst/branches/:id` | Update master branch |
| GET | `/api/mst/branches/:id` | Get master branch by ID |

#### Master Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mst/transactions` | Get all master transactions |
| POST | `/api/mst/transactions` | Create new master transaction |

#### Request Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/client-investment-requests` | Get investment requests |
| POST | `/api/client-investment-requests` | Create investment request |
| GET | `/api/client-withdrawal-requests` | Get withdrawal requests |
| POST | `/api/client-withdrawal-requests` | Create withdrawal request |
| GET | `/api/client-referral-requests` | Get referral requests |
| POST | `/api/client-referral-requests` | Create referral request |

---

## 5. Module Documentation

### 5.1 Authentication Module
**Status**: Dynamic ✅
**Location**: `server/routes.ts`, `client/src/contexts/AuthContext.tsx`

**Features:**
- Dual authentication system (Legacy + Master users)
- JWT token generation and validation
- Password reset functionality
- Session management

**Key Components:**
- `AuthProvider`: React Context for auth state
- `useAuth()`: Hook for authentication operations
- `generateToken()`: Create JWT tokens
- `verifyToken()`: Validate JWT tokens

### 5.2 User Management Module
**Status**: Dynamic ✅
**Location**: `server/storage.ts`, `client/src/components/UsersPage.tsx`

**Features:**
- CRUD operations for users
- Role-based access control
- Branch assignment
- User profile management

### 5.3 Client Management Module
**Status**: Dynamic ✅
**Location**: `server/storage.ts`, `client/src/components/ClientTable.tsx`

**Features:**
- Client onboarding with auto-generated passwords
- KYC document management
- Investment summary tracking
- Client profile management

### 5.4 Transaction Management Module
**Status**: Dynamic ✅
**Location**: `server/storage.ts`, `client/src/pages/InvestmentPage.tsx`

**Features:**
- Multi-type transactions (Investment, Withdrawal, Payout, Closure)
- Bulk Excel import
- Transaction status tracking
- Payment method support

### 5.5 Portfolio Management Module
**Status**: Dynamic ✅
**Location**: `server/storage.ts`, `client/src/components/DashboardStats.tsx`

**Features:**
- Real-time portfolio valuation
- Multiple instrument types
- Gain/Loss calculations
- Performance tracking

### 5.6 Branch Management Module
**Status**: Dynamic ✅
**Location**: `server/storage.ts`, `client/src/components/BranchForm.tsx`

**Features:**
- Multi-branch support
- Branch-wise user assignment
- Branch performance tracking

### 5.7 Role & Permission Module
**Status**: Dynamic ✅
**Location**: `server/storage.ts`, `client/src/components/RolesPage.tsx`

**Features:**
- Role-based access control
- Permission management
- Module-wise access rights

### 5.8 File Management Module
**Status**: Dynamic ✅
**Location**: `server/routes.ts`, `client/src/components/FileUpload.tsx`

**Features:**
- Excel file upload and processing
- File validation
- Bulk data import

### 5.9 Email & Notification Module
**Status**: Dynamic ✅
**Location**: `server/emailService.ts`

**Features:**
- Welcome emails for new clients
- Password reset emails
- System notifications

### 5.10 Dashboard & Reporting Module
**Status**: Dynamic ✅
**Location**: `client/src/pages/Dashboard.tsx`, `client/src/pages/ReportsPage.tsx`

**Features:**
- Role-based dashboards
- Real-time metrics
- Custom reports
- Data visualization

---

## 6. Development Guide

### 6.1 Getting Started
```bash
# Clone repository
git clone <repository-url>
cd GandharvaDesign

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database and email configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### 6.2 Quick Reference Commands
```bash
npm install          # Install dependencies
npm run dev         # Start development server
npm run db:push     # Push database schema
npm run build       # Build for production
```

### 6.3 Key Files
- `shared/schema.ts` - Database schemas and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `client/src/App.tsx` - Main app and routing
- `client/src/components/app-sidebar.tsx` - Navigation menu

### 6.4 Adding New Features

#### Adding New API Endpoint:
1. **Define Schema**: Add to `shared/schema.ts`
2. **Add Storage Method**: Extend `server/storage.ts`
3. **Create Route**: Add to `server/routes.ts`
4. **Add Frontend API**: Update `client/src/lib/api.ts`
5. **Create UI Component**: Add to `client/src/components/`

#### Adding New Page:
1. **Create Page Component**: Add to `client/src/pages/`
2. **Add Route**: Update `client/src/App.tsx`
3. **Add Navigation**: Update `client/src/components/app-sidebar.tsx`
4. **Add Permissions**: Update role-based access

#### Adding Database Table:
1. **Define Schema**: Add to `shared/schema.ts`
2. **Create Migration**: Run `npm run db:push`
3. **Add Storage Methods**: Extend `server/storage.ts`
4. **Add API Routes**: Update `server/routes.ts`

### 6.5 Code Standards
```typescript
// File naming: PascalCase for components, camelCase for utilities
// Component structure:
export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks first
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {};
  
  // Render
  return <div>...</div>;
}

// API naming: RESTful conventions
GET /api/resource
POST /api/resource
PUT /api/resource/:id
DELETE /api/resource/:id
```

---

## 7. Migration Guide

### 7.1 Overview
The application supports both legacy and new master table structures for smooth migration:

**Legacy Tables (UUID-based)**:
- `branches` → `mst_branch`
- `users` → `mst_user`
- `clients` → `mst_client`
- `transactions` → `transaction`
- `portfolios` (unchanged)

**New Master Tables (Integer ID-based)**:
- `mst_role` - Role management
- `mst_user` - User management with role-based access
- `mst_branch` - Branch management
- `mst_client` - Client management
- `mst_indicator` - Transaction indicators
- `transaction` - New transaction structure

### 7.2 Key Differences
1. **ID Structure**: UUID strings vs Auto-increment integers
2. **Audit Fields**: Simple timestamps vs Full audit trail
3. **Role Management**: Simple strings vs Proper role table
4. **Transaction Structure**: Type-based vs Indicator-based

### 7.3 Migration Steps
1. **Database Setup**: Run SQL scripts to create new tables
2. **Data Migration**: Optional migration from legacy to master tables
3. **API Integration**: Update to use new endpoints
4. **Frontend Updates**: Implement role-based access control

### 7.4 Backward Compatibility
- Legacy APIs continue to work
- Authentication supports both user systems
- Gradual migration approach supported

---

## 8. Third-Party Integration

### 8.1 Client Sync API

#### Authentication
```
Authorization: Bearer sync-api-token-2024
```

#### Sync Clients
**Endpoint**: `POST /api/sync/clients`

**Request Body**:
```json
{
  "clients": [
    {
      "code": "CL001",
      "name": "John Doe",
      "mobile": "9876543210",
      "email": "john.doe@example.com",
      "dob": "1990-01-15",
      "panNo": "ABCDE1234F",
      "aadhaarNo": "123456789012",
      "branch": "Mumbai",
      "address": "123 Main Street, Mumbai",
      "city": "Mumbai",
      "pincode": 400001
    }
  ]
}
```

#### Get Synced Clients
**Endpoint**: `GET /api/sync/clients`

### 8.2 Transaction Sync API

#### Sync Transactions
**Endpoint**: `POST /api/sync/transactions`

**Request Body**:
```json
{
  "transactions": [
    {
      "clientCode": "CL001",
      "indicatorName": "Investment",
      "amount": "50000.00",
      "transactionDate": "2024-01-15",
      "remark": "Initial investment"
    }
  ]
}
```

#### Indicator Mapping
- **Investment** → ID: 1
- **Payout** → ID: 2
- **Withdrawal** → ID: 3
- **Closure** → ID: 4

#### Get Transactions
**Endpoint**: `GET /api/sync/transactions`

**Query Parameters**:
- `clientCode`: Filter by client code
- `indicatorName`: Filter by indicator
- `limit`: Maximum results (default: 100)

---

## 9. Design Guidelines

### 9.1 Design Approach
Reference-based design inspired by modern fintech leaders like Robinhood, Wealthfront, and Betterment, focusing on trust, clarity, and professional sophistication.

### 9.2 Color Palette
**Light Mode:**
- Primary: 220 85% 25% (Deep professional blue)
- Secondary: 220 15% 96% (Light neutral background)
- Accent: 142 76% 36% (Success green for gains)
- Warning: 25 95% 53% (Alert red for losses)
- Text: 220 15% 20% (Dark charcoal)

**Dark Mode:**
- Primary: 220 85% 65% (Lighter blue for contrast)
- Secondary: 220 15% 8% (Dark background)
- Accent: 142 76% 45% (Brighter success green)
- Warning: 25 95% 60% (Softer alert red)
- Text: 220 15% 90% (Light text)

### 9.3 Typography
- **Primary Font**: Inter (Google Fonts)
- **Display Font**: Inter (weights: 400, 500, 600, 700)
- **Monospace**: JetBrains Mono for numerical data

### 9.4 Layout System
**Tailwind Spacing Units**: Primarily 2, 4, 6, 8, 12, 16
- Tight spacing (p-2, m-2) for form elements
- Medium spacing (p-4, p-6) for cards and sections
- Large spacing (p-8, p-12) for page layouts

### 9.5 Key Design Principles
- **Trust & Security**: Professional colors, security badges
- **Data Clarity**: High contrast, color-coded indicators
- **Progressive Disclosure**: Dashboard overview with drill-down
- **Accessibility**: WCAG 2.1 AA compliance

---

## 10. Deployment & Operations

### 10.1 Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

### 10.2 Environment Configuration
```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# JWT
JWT_SECRET=your-secret-key

# Email (Optional)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# Server
PORT=5000
NODE_ENV=production

# Sync API
SYNC_API_TOKEN=your-secure-token-here
```

### 10.3 Database Setup
```sql
-- Create database
CREATE DATABASE gandharva_design;

-- Tables will be created automatically via Drizzle
```

### 10.4 Security Considerations
- Use strong JWT secrets
- Enable HTTPS in production
- Configure CORS properly
- Validate all inputs
- Use environment variables for secrets
- Regular security updates

### 10.5 Monitoring & Logging
- Application logging
- Error tracking
- Performance monitoring
- User activity logging

### 10.6 Deployment Checklist
**Before Deployment:**
- [ ] Run tests: `npm test`
- [ ] Build successfully: `npm run build`
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Check security configurations

**Production Environment:**
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper database URL
- [ ] Set strong JWT secret
- [ ] Configure email service
- [ ] Set up monitoring and logging
- [ ] Configure HTTPS
- [ ] Set up backup procedures

---

## Conclusion

This comprehensive documentation provides complete guidance for understanding, developing, and maintaining the Gandharva Design investment management platform. The system is built with modern technologies, follows best practices, and supports both legacy and new architectures for smooth migration and scalability.

All modules are fully dynamic and can be customized according to business requirements. The dual-table approach ensures backward compatibility while enabling modern features and improved performance.