# Employee Invitation & Admin Approval Signup Flow

## Overview
This document describes the complete Employee Invitation and Admin Approval workflow implemented in PetroManage.

## System Architecture

### Data Storage
- All employee data stored in secure cookies with JSON serialization
- Persists across server restarts
- Supports distributed environments

### Core Components

#### 1. Employee Invitation System
**Location**: `/lib/employee/actions.ts`

```typescript
EmployeeInvitation {
  id: string (INV-timestamp)
  name: string
  email: string
  phone: string
  role: string (from ROLES)
  createdAt: ISO timestamp
  createdBy: Owner ID
}
```

#### 2. Signup Request System
**Status Options**: `pending | approved | rejected`

```typescript
SignupRequest {
  id: string (REQ-timestamp)
  invitationId: string
  email: string
  password?: string (optional field)
  status: "pending" | "approved" | "rejected"
  createdAt: ISO timestamp
  approvedAt?: timestamp
  approvedBy?: Admin ID
  rejectionReason?: string
}
```

#### 3. Employee Account System
**Status Options**: `active | inactive`

```typescript
EmployeeAccount {
  id: string (EMP-timestamp)
  name: string
  email: string
  phone: string
  role: string
  passwordHash: string (using scrypt)
  signupRequestId: string
  status: "active" | "inactive"
  createdAt: ISO timestamp
  lastLogin?: timestamp
}
```

## User Flows

### Flow 1: Company Owner → Invite Employee

**URL**: `/owner/employees/invite`

**Steps**:
1. Owner fills form:
   - Full Name
   - Email Address
   - Phone Number
   - Assigned Role (from existing ROLES)
2. System checks if email already invited
3. Creates `EmployeeInvitation` record
4. Stores in cookie storage
5. Shows confirmation message

**Success Response**:
```json
{
  "success": true,
  "invitationId": "INV-1234567890"
}
```

### Flow 2: Employee → Signup with Invitation Verification

**URL**: `/auth/employee-signup`

**Step 1: Email Verification**
1. Employee enters email address
2. System calls `findInvitationByEmail(email)`
3. If not found: Show error "Email not found in invitations"
4. If found: Display invitation details and proceed to password step

**Step 2: Create Account**
1. Employee enters password (min 6 characters)
2. System verifies password match
3. Creates `SignupRequest` with status `"pending"`
4. Stores signup request
5. Redirects to `/auth/signup-pending`

**Status Page**: `/auth/signup-pending`
- Shows "Pending Admin Approval" message
- Explains next steps
- Provides support contact

### Flow 3: Admin → Review & Approve/Reject Requests

**URL**: `/admin/signup-requests` (requires admin login)

**Display**:
- Table showing all pending signup requests
- Columns: Name, Email, Phone, Role, Requested Date, Actions

**Admin Actions**:

**Action 1: Approve**
- Clicks "Approve" button
- System:
  - Updates `SignupRequest.status` to `"approved"`
  - Sets `approvedAt` timestamp
  - Sets `approvedBy` to admin ID
  - Stores update
  - Reloads page

**Action 2: Reject**
- Clicks "Reject" button
- Modal appears asking for optional reason
- System:
  - Updates `SignupRequest.status` to `"rejected"`
  - Stores rejection reason if provided
  - Sets `approvedBy` to admin ID
  - Reloads page

## Login Integration

### Employee Login Verification

**Before login allowed**, system checks:

```
checkSignupStatus(email) {
  1. Find invitation by email
  2. If not found: status = "not-invited"
  3. If found:
     - Check signup request status
     - If no request: status = "pending"
     - If pending: status = "pending" (waiting)
     - If rejected: status = "rejected" (show reason)
     - If approved: verify password & check account active
     - If active: status = "active" (login allowed)
}
```

### Login Error Messages

| Condition | Message |
|-----------|---------|
| Email not in invitations | "Email not found in invitations" |
| Invitation exists, no request yet | "Ready to signup" |
| Signup request pending | "Your account is pending admin approval" |
| Signup request rejected | Show rejection reason |
| Invalid password | "Invalid email or password" |
| Account not active | Cannot login |

## Testing the Complete Flow

### Test Scenario 1: Happy Path

```
1. Owner invites: john@company.com as Finance Manager
   → /owner/employees/invite
   → Name: John Doe
   → Email: john@company.com
   → Phone: 0300-1234567
   → Role: finance-manager

2. Employee signs up
   → /auth/employee-signup?email=john@company.com
   → Enter password: Test1234
   → Redirected to /auth/signup-pending
   → Shows "Pending Admin Approval"

3. Admin approves request
   → /admin/signup-requests (requires admin login)
   → Find john@company.com request
   → Click "Approve"
   → Request status changes to "approved"

4. Employee logs in
   → /auth/login
   → Email: john@company.com
   → Password: Test1234
   → Successfully authenticated
   → Redirected to /dashboard/finance (Finance Manager dashboard)
```

### Test Scenario 2: Rejected Invitation

```
1. Owner invites jane@company.com as HR Manager

2. Employee signs up

3. Admin rejects with reason: "Not qualified"

4. Employee tries to login
   → Gets error: "Your invitation was rejected: Not qualified"
```

### Test Scenario 3: Invalid Email

```
1. Employee goes to /auth/employee-signup
   → Enters: unknown@company.com
   → System shows: "Email not found in invitations"
   → Cannot proceed
```

## API Functions

### Owner Functions
- `inviteEmployee(name, email, phone, role, ownerId)` → `{ success, error?, invitationId? }`
- `findInvitationByEmail(email)` → `EmployeeInvitation | null`

### Employee Functions
- `createSignupRequest(email, role)` → `{ success, error?, requestId? }`
- `checkSignupStatus(email)` → `{ status, message? }`

### Admin Functions
- `getPendingSignupRequests()` → Array of requests with invitation details
- `approveSignupRequest(requestId, adminId)` → `{ success, error? }`
- `rejectSignupRequest(requestId, adminId, reason?)` → `{ success, error? }`

### Account Creation
- `createEmployeeAccount(requestId, passwordHash)` → `{ success, error?, accountId? }`
- `employeeLogin(email, password)` → `{ success, error?, employee?, status? }`

## Security Features

1. **Password Security**
   - Uses scrypt key derivation (Node.js built-in crypto)
   - 16-byte salt per password
   - 64-byte hash output
   - Timing-safe comparison for verification

2. **Email Verification**
   - Pre-invitation required before signup
   - Role validation (must match invitation role)
   - Prevents unauthorized access

3. **Status-Based Access Control**
   - Only approved employees can login
   - Rejected invitations cannot be reused
   - Pending requests must wait for admin approval

4. **Admin-Only Features**
   - Signup request review requires admin authentication
   - Approval/rejection tracked with admin ID
   - Audit trail via timestamps

## Integration with Existing Systems

### Roles System
- Reuses existing `ROLES` array from `/lib/roles.ts`
- Each role has assigned dashboard and permissions
- Employee role determines dashboard access upon login

### Authentication System
- Extends existing cookie-based session system
- Compatible with admin auth structure
- Uses same password hashing approach

### Permissions System
- Respects existing role-based access control
- Employee role maps to appropriate permission set
- No modification to existing permission logic required

## Storage Mechanism

All data stored in HTTP cookies with secure settings:
```
maxAge: 60 * 60 * 24 * 365 (1 year)
sameSite: "lax"
httpOnly: false (for accessibility)
secure: process.env.NODE_ENV === "production"
```

## Future Enhancements

1. **Email Notifications**
   - Invite confirmation email
   - Approval/rejection notifications
   - Resend invitation link

2. **Bulk Invitations**
   - CSV import for multiple employees
   - Batch approval workflows

3. **Invitation Expiry**
   - Time-limited invitation links
   - Auto-expiry after 30 days

4. **Audit Logging**
   - Track all signup request actions
   - Admin action history
   - Employee creation audit trail

5. **Database Migration**
   - Move from cookie storage to database
   - Support for larger organizations
   - Better data persistence

## Deployment Checklist

- [x] Employee invitation system implemented
- [x] Signup request workflow created
- [x] Admin approval interface built
- [x] Login integration updated
- [x] Password verification added
- [x] Role assignment working
- [x] Error messages defined
- [x] Storage mechanism established
- [x] Code committed to GitHub

## Support & Troubleshooting

### Owner Cannot Add Employee
- Verify owner is logged in
- Check if email is already invited
- Clear browser cache and try again

### Employee Cannot Signup
- Verify email matches exactly (case-sensitive)
- Check that owner invitation exists
- Confirm role is supported

### Admin Cannot See Requests
- Must be logged in as admin
- Check `/admin/signup-requests` URL
- Verify admin session is active

### Employee Cannot Login After Approval
- Verify request was approved (not just created)
- Check that password is correct
- Ensure account status is "active"
- Try clearing browser cache
