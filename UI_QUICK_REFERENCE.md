# 🚀 UI Developer Quick Reference Card

## 📍 Most Common UI Updates

### 🧭 **Sidebar/Navigation Changes**
**File:** `/client/src/components/app-sidebar.tsx`

```typescript
// Add new menu item
const moduleConfig = {
  "New Module": { 
    icon: IconName, 
    url: "/new-route" 
  }
};

// Add submenu
"Parent Module": {
  icon: ParentIcon,
  url: "/parent",
  children: {
    "Sub Item": { icon: SubIcon, url: "/parent/sub" }
  }
}
```

### 🏠 **Dashboard Updates**
**Main File:** `/client/src/components/RoleBasedDashboard.tsx`

```tsx
// Add new widget to dashboard
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <ExistingWidget />
  <NewWidget />  {/* Add here */}
</div>
```

### 📄 **New Page Creation**
1. **Create:** `/client/src/pages/NewPage.tsx`
2. **Add Route:** In `/client/src/App.tsx`
   ```tsx
   <Route path="/new-page" component={() => <NewPage />} />
   ```
3. **Add Navigation:** In `app-sidebar.tsx` moduleConfig

### 🎨 **Header Modifications**
**File:** `/client/src/App.tsx` (AppContent component)

```tsx
<header className="flex items-center justify-between p-4 border-b">
  <SidebarTrigger />
  {/* Add new elements here */}
  <ThemeToggle />
</header>
```

### 📊 **Table Column Updates**
**File:** Respective table component (e.g., `ClientTable.tsx`)

```tsx
const columns = [
  {
    accessorKey: "fieldName",
    header: "Column Title",
    cell: ({ row }) => <span>{row.getValue("fieldName")}</span>
  }
];
```

### 📝 **Form Field Addition**
**File:** Respective form component

```tsx
// Schema
const formSchema = z.object({
  newField: z.string().min(1, "Required")
});

// JSX
<FormField
  control={form.control}
  name="newField"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
    </FormItem>
  )}
/>
```

---

## 🎯 File Location Cheat Sheet

| Component Type | Location | Example |
|----------------|----------|---------|
| **Pages** | `/pages/` | `Dashboard.tsx` |
| **Forms** | `/components/` | `PaymentForm.tsx` |
| **Tables** | `/components/` | `ClientTable.tsx` |
| **UI Base** | `/components/ui/` | `button.tsx` |
| **Navigation** | `/components/` | `app-sidebar.tsx` |
| **Context** | `/contexts/` | `AuthContext.tsx` |
| **Hooks** | `/hooks/` | `useAuth.ts` |
| **Utils** | `/lib/` | `utils.ts` |

---

## 🎨 Common CSS Classes

### Layout
```css
/* Containers */
.container mx-auto px-4
.space-y-6          /* Vertical spacing */
.space-x-4          /* Horizontal spacing */

/* Grid */
.grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

/* Flex */
.flex items-center justify-between
.flex-1             /* Flex grow */
```

### Components
```css
/* Cards */
.bg-card border rounded-lg p-6 shadow-sm

/* Buttons */
.bg-primary text-primary-foreground hover:bg-primary/90

/* Forms */
.space-y-4          /* Form spacing */
.grid grid-cols-2 gap-4  /* Form grid */
```

---

## 🔧 Component Patterns

### Standard Card
```tsx
<Card className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Data Display
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label>Field Name</Label>
    <p className="font-medium">{value}</p>
  </div>
</div>
```

### Loading State
```tsx
{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
) : (
  <Content />
)}
```

---

## 🚨 Important Notes

### Role-Based Rendering
```tsx
{userRole === "admin" && (
  <AdminOnlyComponent />
)}

{["admin", "leader"].includes(userRole) && (
  <AdminLeaderComponent />
)}
```

### Responsive Design
```tsx
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Theme Support
```tsx
<div className="bg-background text-foreground">
  {/* Automatically adapts to light/dark theme */}
</div>
```

---

## 🔍 Debugging Tips

1. **Component not showing?** Check route in `App.tsx`
2. **Sidebar item missing?** Verify `moduleConfig` in `app-sidebar.tsx`
3. **Styling issues?** Check Tailwind classes and CSS variables
4. **Data not loading?** Check API calls and React Query setup
5. **Permission issues?** Verify role-based access logic

---

## 📱 Testing Checklist

- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Mobile responsive design
- [ ] Light/dark theme
- [ ] Different user roles (admin, client, leader)
- [ ] Form validation
- [ ] Loading states
- [ ] Error handling

---

**🎯 Quick Start:** Most UI changes happen in `/client/src/components/` and `/client/src/pages/`. Start there!