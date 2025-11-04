# 🗺️ UI Component Mapping Guide

## Visual Element → File Location Mapping

This guide helps you quickly identify which file to modify based on what you see in the UI.

---

## 🖥️ **Main Layout Components**

### Top Header Bar
**What you see:** Logo, sidebar toggle, theme toggle, user info
**File to modify:** `/client/src/App.tsx` (AppContent component)
```tsx
<header className="flex items-center justify-between p-4 border-b">
  <SidebarTrigger />           {/* Hamburger menu */}
  <ThemeToggle />              {/* Dark/light mode toggle */}
</header>
```

### Left Sidebar Navigation
**What you see:** Menu items, user profile, logout button
**File to modify:** `/client/src/components/app-sidebar.tsx`
```tsx
<SidebarHeader>              {/* App title "Gandharva" */}
<SidebarContent>             {/* Navigation menu items */}
<SidebarFooter>              {/* User info & logout */}
```

### Main Content Area
**What you see:** Page content, forms, tables, dashboards
**Files to modify:** `/client/src/pages/*.tsx` or `/client/src/components/*.tsx`

---

## 🏠 **Dashboard Elements**

### Dashboard Cards/Widgets
**What you see:** Statistics cards, charts, summary boxes
**Files to modify:**
- **Main Dashboard:** `/client/src/components/RoleBasedDashboard.tsx`
- **Stats Cards:** `/client/src/components/DashboardStats.tsx`
- **Custom Widgets:** `/client/src/components/DashboardWidgets.tsx`
- **Analytics:** `/client/src/components/AnalyticsDashboard.tsx`

```tsx
// Example widget structure
<Card className="p-6">
  <CardHeader>
    <CardTitle>Total Investments</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">₹1,25,000</div>
  </CardContent>
</Card>
```

### Charts and Graphs
**What you see:** Line charts, bar charts, pie charts
**Files to modify:**
- `/client/src/components/TrendChart.tsx`
- `/client/src/components/AnalyticsDashboard.tsx`
- Any component using `recharts` library

---

## 📊 **Data Tables**

### Client Management Table
**What you see:** Client list with name, email, phone, actions
**File to modify:** `/client/src/components/ClientTable.tsx`

### Transaction Tables
**What you see:** Investment/withdrawal/payout transaction lists
**Files to modify:**
- **Generic Table:** `/client/src/components/DataTable.tsx`
- **Page-specific tables:** Check respective page files

### Table Filters
**What you see:** Search boxes, date pickers, dropdown filters above tables
**File to modify:** `/client/src/components/TransactionFilters.tsx`

```tsx
// Table column structure
const columns = [
  {
    accessorKey: "name",
    header: "Client Name",
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button variant="outline" size="sm">
        Edit
      </Button>
    ),
  },
];
```

---

## 📝 **Forms and Modals**

### Login/Authentication Forms
**What you see:** Email/password fields, login button, forgot password link
**Files to modify:**
- **Login:** `/client/src/components/LoginForm.tsx`
- **Forgot Password:** `/client/src/components/ForgotPassword.tsx`
- **Reset Password:** `/client/src/components/ResetPassword.tsx`

### Payment Forms
**What you see:** Amount fields, payment method selection, submit buttons
**File to modify:** `/client/src/components/PaymentForm.tsx`

### Withdrawal Forms
**What you see:** Withdrawal amount, bank details, request submission
**File to modify:** `/client/src/components/WithdrawalForm.tsx`

### Client Details Modal
**What you see:** Popup with client information, edit fields
**File to modify:** `/client/src/components/ClientDetailsModal.tsx`

### File Upload Components
**What you see:** Drag-and-drop areas, file selection buttons, upload progress
**Files to modify:**
- **Generic Upload:** `/client/src/components/FileUpload.tsx`
- **Excel Uploads:** `/client/src/components/*ExcelUpload.tsx`

---

## 📄 **Page-Level Components**

### Investment Management Page
**What you see:** Investment list, add investment button, filters
**File to modify:** `/client/src/pages/InvestmentPage.tsx`

### Client Management Page
**What you see:** Client table, add client button, bulk operations
**File to modify:** `/client/src/pages/ClientManagementPage.tsx`

### Reports Page
**What you see:** Report generation forms, download buttons, charts
**File to modify:** `/client/src/pages/ReportsPage.tsx`

### Import/Export Page
**What you see:** File upload areas, import history, export options
**File to modify:** `/client/src/pages/ImportPage.tsx`

---

## 🎨 **UI Base Components**

### Buttons
**What you see:** Primary, secondary, outline, destructive buttons
**File to modify:** `/client/src/components/ui/button.tsx`

### Input Fields
**What you see:** Text inputs, number inputs, search boxes
**File to modify:** `/client/src/components/ui/input.tsx`

### Dropdown Menus
**What you see:** Select dropdowns, multi-select, comboboxes
**File to modify:** `/client/src/components/ui/select.tsx`

### Cards
**What you see:** Content containers with borders and shadows
**File to modify:** `/client/src/components/ui/card.tsx`

### Dialogs/Modals
**What you see:** Popup windows, confirmation dialogs
**File to modify:** `/client/src/components/ui/dialog.tsx`

### Toast Notifications
**What you see:** Success/error messages that appear temporarily
**Files to modify:**
- **Component:** `/client/src/components/ui/toast.tsx`
- **Provider:** `/client/src/components/ui/toaster.tsx`

---

## 🔧 **Utility Components**

### Theme Toggle
**What you see:** Sun/moon icon for switching light/dark mode
**File to modify:** `/client/src/components/ThemeToggle.tsx`

### PWA Install Prompt
**What you see:** "Install App" notification banner
**File to modify:** `/client/src/components/PWAInstallPrompt.tsx`

### Loading Spinners
**What you see:** Spinning circles or skeleton loaders
**Files to check:**
- Individual components for loading states
- `/client/src/components/ui/skeleton.tsx` for skeleton loaders

---

## 🎯 **Role-Based Elements**

### Admin-Only Elements
**What you see:** User management, system settings, all data access
**Files to check:**
- Look for `userRole === "admin"` conditions
- `/client/src/components/UsersPage.tsx`
- `/client/src/components/RolesPage.tsx`

### Client-Only Elements
**What you see:** Personal investment data, withdrawal requests
**Files to check:**
- Look for `userRole === "client"` conditions
- `/client/src/pages/client/*.tsx`

### Leader-Only Elements
**What you see:** Team management, client oversight
**Files to check:**
- Look for `userRole === "leader"` conditions
- Components with leader-specific logic

---

## 🔍 **Quick Identification Tips**

### 1. **Find by Visual Element**
- **Button/Link not working?** → Check the `onClick` handler or `href` attribute
- **Text needs changing?** → Search for the exact text in the codebase
- **Icon needs updating?** → Look for `lucide-react` imports

### 2. **Find by URL/Route**
- **URL `/dashboard`** → `/client/src/pages/Dashboard.tsx`
- **URL `/clients`** → `/client/src/pages/ClientManagementPage.tsx`
- **URL `/reports`** → `/client/src/pages/ReportsPage.tsx`

### 3. **Find by Functionality**
- **Data fetching/API calls** → Check `/client/src/lib/api.ts` or `/client/src/lib/*Api.ts`
- **Form validation** → Look for `zod` schemas in form components
- **State management** → Check `useState`, `useQuery`, or context files

### 4. **Find by Component Name**
Use VS Code's "Go to Symbol" (Ctrl+Shift+O) or search for:
- Component names in PascalCase
- Function names in camelCase
- CSS class names

---

## 📱 **Responsive Elements**

### Mobile-Specific Elements
**What you see:** Hamburger menus, collapsed sidebars, stacked layouts
**Look for:** `md:hidden`, `lg:block`, `sm:grid-cols-1` classes

### Desktop-Specific Elements
**What you see:** Expanded sidebars, multi-column layouts
**Look for:** `hidden md:block`, `md:grid-cols-2` classes

---

## 🚨 **Common Gotchas**

1. **Element appears but doesn't work** → Check event handlers and API connections
2. **Styling looks wrong** → Verify Tailwind classes and CSS custom properties
3. **Component not showing for certain users** → Check role-based rendering conditions
4. **Form not submitting** → Check form validation and API endpoints
5. **Navigation not working** → Verify routes in `App.tsx` and sidebar configuration

---

**💡 Pro Tip:** Use your browser's developer tools to inspect elements and find their class names, then search for those classes in the codebase to locate the exact file!