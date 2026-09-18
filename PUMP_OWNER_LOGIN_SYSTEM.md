# Pump Owner Login System - Complete Implementation

## Overview
This document outlines the complete Admin → Pump Owner login system implementation with password management.

## System Components

### 1. Admin Side - Add Pump
**Location**: `/admin/pumps`

**Features**:
- Simplified form asking only for:
  - Pump Name (e.g., "Khan Petroleum")
  - Pump Owner Name (e.g., "Ahmed Khan")
  
- Auto-generates on save:
  - Email: Format `{ownername}@{pumpname}gmail.com` (lowercase, no spaces)
    - Example: "Ahmed Khan" + "Khan Petroleum" → `ahmed@khanpetroleumgmail.com`
  - Password: Format `{OwnerName}123`
    - Example: "Ahmed Khan" → `Ahmed123`

- Saves to database:
  - Creates Pump record with email and password
  - Creates User record with role "pump-owner" and auto-approved status
  - Pump immediately appears in "All Pumps" list

**Files**:
- `src/components/admin/AddPumpForm.tsx` - Form component
- `src/app/api/admin/pumps/route.ts` - POST endpoint (create pump)

### 2. Admin Side - Pump Details Modal
**Location**: Accessed by clicking "View Details" on any pump in the list

**Features**:
- Shows pump information:
  - Pump Name
  - Owner Name
  - Owner Email
  - Status
  - Current Password (hidden by default, shown as dots)

- Actions:
  - Show/Hide password toggle
  - Copy email to clipboard
  - Reset password button
  - Delete pump option

- Password Reset:
  - Admin clicks "Reset Password"
  - System generates new password: `{OwnerName}123`
  - Updates both User and Pump records in database
  - Shows success message with new password
  - Admin sees updated password in modal

**Files**:
- `src/components/admin/PumpDetailModal.tsx` - Detail modal component
- `src/app/api/admin/pumps/reset-password/route.ts` - POST endpoint (reset password)

### 3. Pump Owner Login
**Location**: `/pump-owner/login`

**Process**:
1. Pump Owner enters email and password (provided by admin)
2. System validates against User database
3. On success:
   - Creates session cookie with pump details
   - Redirects to `/pump-owner/dashboard`
4. On failure:
   - Shows error message with instructions

**Features**:
- No signup process required
- Auto-approved accounts (created by admin)
- Session persists for 30 days
- Responsive design for all devices

**Files**:
- `src/app/pump-owner/login/page.tsx` - Login page
- `src/lib/pump-owner/actions.ts` - Server action `pumpOwnerLogin()`

### 4. Pump Owner Dashboard
**Location**: `/pump-owner/dashboard`

**Features**:
- Shows pump information:
  - Pump ID, Status, Location, Contact
  - Fuel inventory (Petrol & Diesel) with progress bars
  - Pump details (address, email, created date)

- Navigation:
  - Settings button (top right) - to change password
  - Logout button (top right) - to logout

**Files**:
- `src/app/pump-owner/dashboard/page.tsx` - Main dashboard page
- `src/app/pump-owner/dashboard/layout.tsx` - Dashboard layout with header

### 5. Pump Owner Settings - Change Password
**Location**: `/pump-owner/dashboard/settings`

**Features**:
- Form fields:
  - Email (required)
  - Current Password (with Show/Hide toggle)
  - New Password (with Show/Hide toggle)
  - Confirm New Password (with Show/Hide toggle)

- Validation:
  - All fields required
  - New passwords must match
  - Minimum 4 characters
  - Must be different from current password

- On success:
  - Shows success message
  - Updates User passwordHash in database
  - Updates Pump password field in database
  - Redirects to dashboard after 2 seconds

- Error handling:
  - Invalid current password
  - Password mismatch
  - Database errors

**Important**: When pump owner changes password, it automatically updates in:
- User collection (passwordHash field)
- Pump collection (password field)
- Admin sees the updated password in pump detail modal

**Files**:
- `src/app/pump-owner/dashboard/settings/page.tsx` - Settings page
- `src/app/api/pump-owner/change-password/route.ts` - POST endpoint

## Database Schema

### User Collection
```typescript
{
  _id: ObjectId,
  email: string,
  passwordHash: string,
  role: "pump-owner" | "employee" | "admin",
  pumpId: string,
  approvalStatus: "approved",
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
  password: string,  // Current password (synced from User.passwordHash)
  ownerPhone: string,
  address: string,
  city: string,
  status: "open" | "low-stock" | "closed" | "disabled",
  petrolStock: number,
  petrolCapacity: number,
  dieselStock: number,
  dieselCapacity: number,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Create Pump (Admin)
```
POST /api/admin/pumps
Content-Type: application/json

{
  "pumpName": "Khan Petroleum",
  "ownerName": "Ahmed Khan",
  "ownerEmail": "ahmed@khanpetroleumgmail.com",
  "password": "Ahmed123"
}

Response 201:
{
  "success": true,
  "pump": { ... },
  "user": { ... },
  "message": "Pump and owner account created successfully"
}
```

### Get All Pumps (Admin)
```
GET /api/admin/pumps

Response 200:
{
  "success": true,
  "pumps": [ ... ]
}
```

### Reset Pump Owner Password (Admin)
```
POST /api/admin/pumps/reset-password
Content-Type: application/json

{
  "pumpId": "PUMP-123456-ABC"
}

Response 200:
{
  "success": true,
  "password": "Ahmed123",
  "message": "Password reset successfully"
}
```

### Change Pump Owner Password (Pump Owner)
```
POST /api/pump-owner/change-password
Content-Type: application/json

{
  "email": "ahmed@khanpetroleumgmail.com",
  "currentPassword": "Ahmed123",
  "newPassword": "NewPassword456"
}

Response 200:
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Complete Flow - Step by Step

### 1. Admin Creates Pump
```
Admin visits /admin/pumps
→ Fills form: Pump Name = "Khan Petroleum", Owner Name = "Ahmed Khan"
→ System auto-generates:
   - Email: ahmed@khanpetroleumgmail.com
   - Password: Ahmed123
→ Clicks "Create Pump"
→ Pump saved to database with generated credentials
→ Success message shown with credentials to share
→ Pump appears in "All Pumps" list
```

### 2. Admin Views Pump Details
```
Admin clicks "View Details" on pump
→ Modal opens showing:
   - Pump Name: "Khan Petroleum"
   - Owner Name: "Ahmed Khan"
   - Email: ahmed@khanpetroleumgmail.com
   - Status: open
   - Password: ••••••• (hidden)
→ Admin clicks "Show" to reveal password: Ahmed123
→ Admin can copy credentials or reset password
```

### 3. Admin Resets Password
```
Admin clicks "Reset Password"
→ System generates new password: Ahmed123 (same format)
→ Updates User.passwordHash and Pump.password
→ Shows new password in modal: Ahmed123
→ Admin can share with pump owner
```

### 4. Pump Owner Logs In
```
Pump Owner visits /pump-owner/login
→ Enters email: ahmed@khanpetroleumgmail.com
→ Enters password: Ahmed123
→ System authenticates against User collection
→ Creates session cookie
→ Redirects to /pump-owner/dashboard
→ Dashboard shows pump information
```

### 5. Pump Owner Changes Password
```
Pump Owner clicks "Settings" in dashboard header
→ Visits /pump-owner/dashboard/settings
→ Fills form:
   - Email: ahmed@khanpetroleumgmail.com
   - Current Password: Ahmed123
   - New Password: MyNewPassword789
   - Confirm: MyNewPassword789
→ Clicks "Change Password"
→ System validates current password
→ Updates User.passwordHash = "MyNewPassword789"
→ Updates Pump.password = "MyNewPassword789"
→ Shows success message
→ Redirects to dashboard after 2 seconds
```

### 6. Admin Sees Updated Password
```
Admin visits /admin/pumps
→ Clicks "View Details" on same pump
→ Modal now shows updated password: MyNewPassword789
→ Password field reflects the change made by pump owner
```

## Security Features

1. **Password Verification**: Current password verified before allowing change
2. **Session Management**: 30-day session cookies with httpOnly flag
3. **Approval Status**: Pump owner accounts auto-approved by admin
4. **Database Transactions**: Both User and Pump records updated atomically
5. **Input Validation**: Email format, password requirements, field validation
6. **Error Handling**: Graceful error messages without exposing sensitive info

## Testing Checklist

- [ ] Build passes with no TypeScript errors
- [ ] Admin can create pump with only name inputs
- [ ] Email and password are auto-generated correctly
- [ ] Pump appears immediately in list
- [ ] Admin can view pump details
- [ ] Password shown/hidden toggle works
- [ ] Admin can reset password
- [ ] Pump owner can login with generated credentials
- [ ] Pump owner can access dashboard
- [ ] Pump owner can navigate to settings
- [ ] Pump owner can change password
- [ ] Admin sees updated password after owner changes it
- [ ] All existing dashboards still work (no regressions)
- [ ] Build passes in production mode

## Notes

- Passwords are stored in plain text in this demo (not bcrypt hashed)
- In production, implement proper password hashing with bcrypt
- Session cookies are httpOnly for security
- Email format follows pattern: `{lowercase-owner}@{lowercase-pump}gmail.com`
- Password pattern: `{CapitalizedOwner}123` (simple for demo)
- Both User and Pump records must be kept in sync
