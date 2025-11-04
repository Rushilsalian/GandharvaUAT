# Gandharva Investment Platform - UI Developer Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [UI Component Architecture](#ui-component-architecture)
5. [Module-wise File Guide](#module-wise-file-guide)
6. [Common UI Updates](#common-ui-updates)
7. [Styling Guidelines](#styling-guidelines)
8. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

Gandharva is a React-based investment platform with role-based access control, featuring:
- **Admin Dashboard**: Complete system management
- **Client Portal**: Investment tracking and transactions
- **Leader Dashboard**: Team and client management
- **Real-time Updates**: Live data synchronization
- **PWA Support**: Progressive Web App capabilities

---

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Wouter** for routing
- **TanStack Query** for data fetching
- **Tailwind CSS** for styling
- **Radix UI** for component primitives
- **Lucide React** for icons
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **MySQL** database
- **Drizzle ORM**
- **JWT** authentication

---

## 📁 Project Structure

```
client/
├── public/                 # Static assets
│   ├── icons/             # PWA icons
│   ├── favicon.svg        # Site favicon
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Base UI components (Radix + Tailwind)
│   │   ├── app-sidebar.tsx    # Main navigation sidebar
│   │   ├── LoginForm.tsx      # Authentication forms
│   │   ├── *Dashboard*.tsx    # Dashboard components
│   │   ├── *Form.tsx         # Form components
│   │   ├── *Table.tsx        # Data table components
│   │   └── *Page.tsx         # Page-level components
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx   # Authentication state
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   │   ├── api.ts        # API client
│   │   └── utils.ts      # Helper functions
│   ├── pages/            # Route components
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # App entry point
│   └── index.css         # Global styles
├── tailwind.config.ts    # Tailwind configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies
```

---

## 🧩 UI Component Architecture

### Component Hierarchy
```
App.tsx (Root)
├── AuthProvider (Context)
├── ThemeProvider (Context)
├── SidebarProvider (Layout)
│   ├── AppSidebar (Navigation)
│   ├── Header (Top bar)
│   └── Main Content (Pages)
└── Global Components
    ├── Toaster (Notifications)
    ├── PWAInstallPrompt
    └── SessionGuard
```

### Base UI Components (`/components/ui/`)
All base components are built with Radix UI primitives and Tailwind CSS:
- **button.tsx** - Button variants
- **card.tsx** - Card layouts
- **table.tsx** - Data tables
- **dialog.tsx** - Modal dialogs
- **form.tsx** - Form controls
- **sidebar.tsx** - Navigation sidebar
- **toast.tsx** - Notifications

---

## 📂 Module-wise File Guide

### 🏠 **Dashboard Module**
**Files to modify for dashboard updates:**

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Main Dashboard | `/pages/Dashboard.tsx` | Entry point for all dashboards |
| Role-based Dashboard | `/components/RoleBasedDashboard.tsx` | Renders different dashboards by role |
| Analytics Dashboard | `/components/AnalyticsDashboard.tsx` | Charts and analytics |
| Enhanced Dashboard | `/components/EnhancedDashboard.tsx` | Advanced dashboard features |
| Real-time Dashboard | `/components/RealTimeDashboard.tsx` | Live data updates |
| Dashboard Stats | `/components/DashboardStats.tsx` | Statistics widgets |
| Dashboard Widgets | `/components/DashboardWidgets.tsx` | Reusable dashboard widgets |
| Dashboard Customizer | `/components/DashboardCustomizer.tsx` | User customization options |

**To update dashboard:**
1. Modify `/components/RoleBasedDashboard.tsx` for layout changes
2. Update `/components/DashboardStats.tsx` for new metrics
3. Edit `/components/DashboardWidgets.tsx` for new widgets

### 🧭 **Navigation/Sidebar Module**
**Files to modify for navigation updates:**

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Main Sidebar | `/components/app-sidebar.tsx` | Primary navigation |
| Sidebar Config | `/components/app-sidebar.tsx` (moduleConfig) | Menu items and routes |

**To update navigation:**
1. **Add new menu item**: Edit `moduleConfig` object in `/components/app-sidebar.tsx`
2. **Change menu icons**: Update icon imports and assignments
3. **Modify menu structure**: Update `getMenuItems` function
4. **Add role-based menus**: Modify module access logic

**Example - Adding new menu item:**
```typescript
// In /components/app-sidebar.tsx
const moduleConfig = {
  "New Module": { 
    icon: NewIcon, 
    url: "/new-module",
    children: {
      "Sub Item": { icon: SubIcon, url: "/new-module/sub" }
    }
  }
};
```

### 🔐 **Authentication Module**
**Files to modify for auth UI updates:**

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Login Form | `/components/LoginForm.tsx` | Login interface |
| Forgot Password | `/components/ForgotPassword.tsx` | Password reset request |
| Reset Password | `/components/ResetPassword.tsx` | Password reset form |
| Auth Context | `/contexts/AuthContext.tsx` | Authentication state |
| Session Guard | `/components/SessionGuard.tsx` | Route protection |

### 📊 **Data Tables Module**
**Files to modify for table updates:**

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Generic Data Table | `/components/DataTable.tsx` | Reusable table component |
| Client Table | `/components/ClientTable.tsx` | Client management table |
| Transaction Filters | `/components/TransactionFilters.tsx` | Table filtering |

**To update tables:**
1. **Add new columns**: Modify column definitions in respective table files
2. **Change table styling**: Update Tailwind classes in table components
3. **Add filters**: Edit `/components/TransactionFilters.tsx`

### 📝 **Forms Module**
**Files to modify for form updates:**

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Payment Form | `/components/PaymentForm.tsx` | Payment processing |
| Withdrawal Form | `/components/WithdrawalForm.tsx` | Withdrawal requests |
| Branch Form | `/components/BranchForm.tsx` | Branch management |
| File Upload | `/components/FileUpload.tsx` | File upload interface |

### 📄 **Pages Module**
**Files to modify for page-level updates:**

| Page | File Path | Purpose |
|------|-----------|---------|
| Client Management | `/pages/ClientManagementPage.tsx` | Client CRUD operations |
| Investment Page | `/pages/InvestmentPage.tsx` | Investment management |
| Withdrawal Page | `/pages/WithdrawalPage.tsx` | Withdrawal management |
| Reports Page | `/pages/ReportsPage.tsx` | Reporting interface |
| Import Page | `/pages/ImportPage.tsx` | Data import functionality |

### 🎨 **Theme Module**
**Files to modify for theme/styling updates:**

| Component | File Path | Purpose |
|-----------|-----------|---------|
| Theme Provider | `/components/ThemeProvider.tsx` | Theme context |
| Theme Toggle | `/components/ThemeToggle.tsx` | Dark/light mode toggle |
| Global Styles | `/index.css` | CSS variables and globals |
| Tailwind Config | `/tailwind.config.ts` | Design system configuration |

---

## 🎨 Styling Guidelines

### Color System
The app uses CSS custom properties for theming:

```css
/* Light theme colors */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96%;
  /* ... more colors */
}

/* Dark theme colors */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... more colors */
}
```

### Component Styling Patterns

**Card Component:**
```tsx
<Card className="p-6 shadow-sm border-border">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

**Button Variants:**
```tsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
```

**Form Styling:**
```tsx
<form className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <Input placeholder="Enter value" />
    <Select>...</Select>
  </div>
</form>
```

### Responsive Design
Use Tailwind's responsive prefixes:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

---

## 🔄 Common UI Updates

### 1. **Adding a New Page**

**Step 1:** Create page component
```tsx
// /pages/NewPage.tsx
export default function NewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Page</h1>
      {/* Page content */}
    </div>
  );
}
```

**Step 2:** Add route in App.tsx
```tsx
// In App.tsx Router component
<Route path="/new-page" component={() => <NewPage />} />
```

**Step 3:** Add navigation item
```tsx
// In /components/app-sidebar.tsx
const moduleConfig = {
  "New Page": { icon: FileIcon, url: "/new-page" }
};
```

### 2. **Modifying Header**

**File:** `/client/src/App.tsx` (AppContent component)
```tsx
<header className="flex items-center justify-between p-4 border-b">
  <SidebarTrigger />
  {/* Add new header elements here */}
  <div className="flex items-center gap-2">
    <NotificationBell /> {/* New component */}
    <ThemeToggle />
  </div>
</header>
```

### 3. **Updating Sidebar Width**

**File:** `/client/src/App.tsx`
```tsx
const style = {
  "--sidebar-width": "24rem",        // Increase width
  "--sidebar-width-icon": "4rem",
};
```

### 4. **Adding New Dashboard Widget**

**Step 1:** Create widget component
```tsx
// /components/NewWidget.tsx
export function NewWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Widget content */}
      </CardContent>
    </Card>
  );
}
```

**Step 2:** Add to dashboard
```tsx
// In /components/RoleBasedDashboard.tsx
import { NewWidget } from './NewWidget';

// Add to dashboard grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <ExistingWidget />
  <NewWidget />
</div>
```

### 5. **Customizing Table Columns**

**File:** Respective table component (e.g., `/components/ClientTable.tsx`)
```tsx
const columns = [
  {
    accessorKey: "name",
    header: "Client Name",
  },
  {
    accessorKey: "email", 
    header: "Email",
  },
  // Add new column
  {
    accessorKey: "newField",
    header: "New Field",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("newField")}
      </Badge>
    ),
  },
];
```

### 6. **Adding Form Fields**

**File:** Respective form component
```tsx
// Add to form schema
const formSchema = z.object({
  existingField: z.string(),
  newField: z.string().min(1, "Required"), // New field
});

// Add to form JSX
<FormField
  control={form.control}
  name="newField"
  render={({ field }) => (
    <FormItem>
      <FormLabel>New Field</FormLabel>
      <FormControl>
        <Input placeholder="Enter value" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## 🚀 Development Workflow

### 1. **Setup Development Environment**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 2. **File Modification Process**
1. **Identify the module** you need to update
2. **Locate the specific file** using this guide
3. **Make changes** following the component patterns
4. **Test locally** with `npm run dev`
5. **Check responsive design** on different screen sizes

### 3. **Adding New Dependencies**
```bash
# UI components
npm install @radix-ui/react-new-component

# Icons
npm install lucide-react

# Utilities
npm install date-fns
```

### 4. **Component Development Best Practices**

**File Naming:**
- Components: `PascalCase.tsx`
- Pages: `PascalCase.tsx` 
- Utilities: `camelCase.ts`

**Import Organization:**
```tsx
// External libraries
import React from 'react';
import { Button } from '@/components/ui/button';

// Internal components
import { CustomComponent } from './CustomComponent';

// Types
import type { ComponentProps } from './types';
```

**Component Structure:**
```tsx
interface ComponentProps {
  // Props definition
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {};
  
  // Render
  return (
    <div className="component-styles">
      {/* JSX content */}
    </div>
  );
}
```

### 5. **Testing UI Changes**
- **Desktop**: Test on Chrome, Firefox, Safari
- **Mobile**: Test responsive design on mobile devices
- **Themes**: Test both light and dark themes
- **Roles**: Test with different user roles (admin, client, leader)

---

## 📞 Quick Reference

### Key Files for Common Updates

| Update Type | Primary File | Secondary Files |
|-------------|--------------|-----------------|
| **Navigation** | `app-sidebar.tsx` | `App.tsx` (routes) |
| **Dashboard** | `RoleBasedDashboard.tsx` | `Dashboard*.tsx` |
| **Forms** | `*Form.tsx` | `pages/*Page.tsx` |
| **Tables** | `*Table.tsx` | `DataTable.tsx` |
| **Styling** | `tailwind.config.ts` | `index.css` |
| **Authentication** | `LoginForm.tsx` | `AuthContext.tsx` |
| **Theme** | `ThemeProvider.tsx` | `index.css` |

### Component Import Paths
```tsx
// UI Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Custom Components  
import { AppSidebar } from "@/components/app-sidebar";

// Pages
import Dashboard from "@/pages/Dashboard";

// Contexts
import { useAuth } from "@/contexts/AuthContext";

// Utilities
import { cn } from "@/lib/utils";
```

---

**💡 Pro Tips:**
- Always check existing components before creating new ones
- Use the established design patterns and color system
- Test changes across different user roles
- Follow the responsive design principles
- Keep components small and focused on single responsibility

This guide should help you navigate and modify the Gandharva Investment Platform UI efficiently. For specific implementation details, refer to the existing component code as examples.