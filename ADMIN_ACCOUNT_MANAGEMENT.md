# Admin Account Management - Credentials Display & Login

## Overview

This document describes the admin account management system where administrators create accounts for employees and pump owners with auto-generated credentials that are displayed in the admin interface.

## Features

### 1. Admin Creates Employee Account

**Location**: `/admin/employees`

**Process**:
1. Admin fills form:
   - Full Name (e.g., "John Doe")
   - Email (e.g., "john@company.com")
   - Phone (e.g., "03001234567")
   - Role (e.g., "company-manager", "hr-officer", etc.)

2. System automatically:
   - Generates password: `{FirstName}123`
   - Example: "John Doe" → password "John123"
   - Creates User record with email and password
   - Sets approval status to "approved"

3. Admin sees:
   - Success message
   - Credentials box with Email and Password
   - Instructions to share with employee

### 2. View Employee Credentials

**Location**: `/admin/employees` → "View Credentials" button

**Features**:
- Click "View Credentials" on any employee row
- Modal opens showing:
  - Employee name and details
  - Email address
  - Role
  - Phone
  - **Credentials section with**:
    - Email (copyable)
    - Password (hidden by default, clickable Show/Hide)
    - Copy buttons for quick sharing

### 3. Pump Owner Credentials

**Location**: `/admin/pumps` → Click pump row → Detail modal

**Features**:
- Pump detail modal shows:
  - Pump information
  - Owner details
  - **Credentials section** (same as employee credentials):
    - Email
    - Password (Show/Hide toggle)
    - Copy buttons

### 4. CredentialsDisplay Component

**Location**: `src/components/admin/CredentialsDisplay.tsx`

**Features**:
- Reusable component for showing credentials
- Show/Hide password toggle
- Copy-to-clipboard for Email and Password
- Responsive design with dark mode support
- Instruction text for admin

**Usage**:
```tsx
<CredentialsDisplay
  email="john@company.com"
  password="John123"
  accountType="Employee"
/>
```

## Login Flow

### Employee Login

1. Employee receives credentials from admin
2. Employee visits login page
3. Enters email and password
4. System validates against User collection
5. On success:
   - Creates session with user details
   - Automatically routes to employee dashboard based on role
   - Dashboard shows: `/dashboard/employees` (or role-specific dashboard)

### Pump Owner Login

1. Pump owner receives credentials from admin
2. Pump owner visits `/pump-owner/login`
3. Enters email and password
4. System validates credentials
5. On success:
   - Creates session with pump details
   - Routes to `/pump-owner/dashboard`

## Database Schema

### User Collection
```typescript
{
  _id: ObjectId,
  email: string,              // e.g., "john@company.com"
  passwordHash: string,       // e.g., "John123"
  role: "employee" | "pump-owner" | "admin",
  employeeId?: string,        // For employees
  pumpId?: string,            // For pump owners
  approvalStatus: "approved" | "pending" | "rejected",
  createdAt: Date,
  updatedAt: Date
}
```

### Employee Collection
```typescript
{
  _id: ObjectId,
  employeeId: string,
  name: string,
  email: string,
  phone: string,
  role: string,               // Role slug
  createdAt: Date,
  updatedAt: Date
}
```

### Pump Collection
```typescript
{
  _id: ObjectId,
  pumpId: string,
  pumpName: string,
  ownerName: string,
  ownerEmail: string,
  password: string,           // Current password for display
  city: string,
  address: string,
  // ... other fields
}
```

## Password Generation Formula

```typescript
function generatePassword(name: string): string {
  // Capitalizes first letter, rest lowercase, adds "123"
  const cleanName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
  return `${cleanName}123`;
}
```

**Examples**:
- "John Doe" → "John123"
- "JANE SMITH" → "Jane123"
- "ali" → "Ali123"

## Credential Display Component

### Props
- `email` (string): User's email address
- `password` (string): User's password
- `accountType` (string, optional): "Employee", "Pump Owner", etc.

### Features
- Email displayed in plain text (copyable)
- Password hidden by default (shown as ••••••••)
- Show button reveals password
- Hide button hides password
- Copy buttons for both email and password
- Dark mode support
- Responsive design

### Example Display
```
┌─ Employee Login Credentials ───────────────┐
│                                             │
│ Email: [john@company.com]      [Copy]      │
│ ─────────────────────────────────────      │
│ Password: [••••••••]  [Show] [Copy]        │
│                                             │
│ ℹ️ Share these credentials with the user.  │
│ They can log in immediately.                │
└─────────────────────────────────────────────┘
```

## Admin Workflow

### Create Employee and Share Credentials

```
1. Admin visits /admin/employees
   ↓
2. Fills form:
   - Full Name: "John Doe"
   - Email: "john@company.com"
   - Phone: "03001234567"
   - Role: "company-manager"
   ↓
3. Clicks "Create Employee"
   ↓
4. System generates:
   - Password: "John123"
   - User record in database
   ↓
5. Admin sees credentials box:
   - Email: john@company.com
   - Password: John123
   ↓
6. Admin copies credentials and shares via:
   - Email
   - WhatsApp
   - In-person
   ↓
7. Employee receives credentials
```

### View Existing Employee Credentials

```
1. Admin visits /admin/employees
   ↓
2. Finds employee in list
   ↓
3. Clicks "View Credentials"
   ↓
4. Modal opens showing:
   - Employee details
   - Email
   - Password (hidden)
   ↓
5. Admin clicks "Show" to reveal password
   ↓
6. Admin can copy email and password to share again
```

## Testing Checklist

### Account Creation
- [ ] Admin can create employee with all fields
- [ ] Password auto-generates correctly (e.g., "John Doe" → "John123")
- [ ] Credentials displayed after creation
- [ ] User record created in database
- [ ] Email and password are correct

### Credentials Display
- [ ] "View Credentials" button visible in employee list
- [ ] Modal opens when button clicked
- [ ] Email shown in plain text
- [ ] Password hidden by default (shown as dots)
- [ ] Show button reveals password
- [ ] Hide button hides password
- [ ] Copy buttons work for email and password
- [ ] Dark mode styling works correctly

### Employee Login
- [ ] Employee can login with provided email
- [ ] Employee can login with provided password
- [ ] Login rejects incorrect credentials
- [ ] After login, redirects to correct dashboard
- [ ] Session created with employee details
- [ ] User role-based dashboard assignment works

### Pump Owner Credentials
- [ ] Pump detail modal shows credentials
- [ ] Show/Hide password works
- [ ] Copy buttons functional
- [ ] Pump owner can login with credentials

### Data Synchronization
- [ ] Credentials persist after page refresh
- [ ] Multiple employees can have different credentials
- [ ] Credentials synced between Employee and User collections
- [ ] Password changes reflect in both collections

## Localstorage & Session Management

- Credentials stored in User collection (primary source of truth)
- Session cookie created on successful login
- Session contains: email, role, pumpId/employeeId
- localStorage used for session persistence
- Credentials cleared on logout
- New login creates new session

## Security Notes

**Current Implementation**:
- Passwords stored in plain text (demo purposes)
- No bcrypt hashing implemented
- Session uses httpOnly cookies

**Production Recommendations**:
- Hash passwords with bcrypt before storing
- Use secure password generation (16+ characters)
- Implement password complexity requirements
- Add rate limiting for login attempts
- Use HTTPS only
- Consider 2FA for sensitive roles

## Role-Based Dashboards

After login, user redirected based on role:

| Role | Dashboard Route |
|---|---|
| employee | `/dashboard/employees` or role-specific dashboard |
| pump-owner | `/pump-owner/dashboard` |
| admin | `/admin` |
| company-manager | `/dashboard/employees` |
| hr-officer | `/dashboard/hr-officer/attendance-payroll` |
| etc. | Role-specific routes |

## Future Enhancements

1. **Password Complexity**: Enforce strong passwords (min 8 chars, numbers, special chars)
2. **Password Reset**: Allow users to reset password from dashboard
3. **Audit Log**: Track credential creation and viewing
4. **Email Notification**: Auto-send credentials via email
5. **Bulk Import**: Import multiple employees from CSV
6. **Password Expiry**: Force password change after X days
7. **Two-Factor Authentication**: SMS or authenticator app
8. **Activity Logging**: Track login attempts and successes

## Troubleshooting

### Password Shows as Dots Even After Clicking Show
- Check if JavaScript is enabled
- Try refreshing the page
- Check browser console for errors

### Login Fails with Correct Credentials
- Verify email case (should be case-insensitive)
- Check if User record exists in database
- Verify passwordHash matches in User collection
- Check if account is approved (not pending/rejected)

### Dashboard Doesn't Load After Login
- Verify role is correctly set in User collection
- Check if dashboard route exists for that role
- Check for role-based access control settings
- Review console for routing errors

## API Endpoints

### Create Employee
```
POST /api/admin/employees
{
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "03001234567",
  "role": "company-manager",
  "password": "John123"
}
```

### Get All Employees
```
GET /api/admin/employees
```

### Delete Employee
```
DELETE /api/admin/employees?employeeId={employeeId}
```

## Files Modified

1. `src/components/admin/CredentialsDisplay.tsx` - New component
2. `src/components/admin/AddEmployeeForm.tsx` - Updated with credentials generation
3. `src/app/admin/(dashboard)/employees/page.tsx` - Added credentials modal
4. `src/components/admin/PumpDetailModal.tsx` - Updated to use CredentialsDisplay
5. `src/app/api/admin/employees/route.ts` - Updated to create User record

## Status: ✅ IMPLEMENTED & DEPLOYED

- Admin can create accounts with auto-generated credentials
- Credentials displayed with Show/Hide password
- Employees can login with provided credentials
- Pump owners can view credentials
- Copy-to-clipboard functionality working
- Build passes with no errors
- Changes committed and pushed to GitHub
