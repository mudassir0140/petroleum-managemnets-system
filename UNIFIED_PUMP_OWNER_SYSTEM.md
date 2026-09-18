# Unified Pump Owner Account System

## Overview

The Pump Owner Account System uses a single, unified data model stored in localStorage. All pump owner data (identification, contact info, login credentials, fuel inventory, and account status) is stored in ONE pump record.

**Single Source of Truth**: `localStorage["petromanage:pumps"]`

---

## Data Model

### Pump Record Structure

```javascript
{
  // Identification
  id: "PUMP-01",
  number: 1,
  name: "Khan Petroleum Agency",
  
  // Owner/Account Information
  owner: "Khan",
  ownerEmail: "khan@khanpetroleumagencygmail.com",
  password: "Khan123",
  role: "pump-owner",
  accountStatus: "Active" | "Inactive" | "Suspended",
  
  // Location & Contact
  city: "Karachi",
  address: "Main Road",
  lat: 24.8607,
  lng: 67.0011,
  phone: "03001234567",
  
  // Operational Status
  status: "Online" | "Offline" | "Maintenance",
  since: "2026-09-16",
  lastInspection: "2026-09-16",
  
  // Sales Data
  todaySales: [
    { fuelType: "petrol", liters: 1500, revenue: 180000 },
    { fuelType: "diesel", liters: 1200, revenue: 144000 }
  ],
  weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
  monthlySales: 2500000,
  lastMonthSales: 2400000,
  
  // Fuel Inventory
  petrolStock: 5000,
  petrolCapacity: 10000,
  dieselStock: 4000,
  dieselCapacity: 10000,
  
  // Timestamps
  createdAt: "2026-09-16T10:00:00.000Z",
  updatedAt: "2026-09-16T10:00:00.000Z"
}
```

---

## Complete User Journey

### Step 1: Admin Creates Pump

**Location**: `http://localhost:3000/dashboard/pumps`

1. Admin clicks "Add New Pump"
2. Fills form:
   - Pump Name: "Khan Petroleum Agency"
   - Company Name: "Khan Petroleum"
   - Owner Name: "Khan"
   - Password: "Khan123"
   - City: "Karachi"
   - Address: "Main Road" (optional)
   - Phone: "03001234567" (optional)
3. Clicks "Add Pump"

**System Actions**:
1. Generates email: `khan@khanpetroleumagencygmail.com`
   - Takes owner name + pump name
   - Lowercases and removes spaces
   - Appends "@" + pump name + "gmail.com"

2. Creates ONE pump record with:
   - Generated email
   - Entered password
   - role: "pump-owner"
   - accountStatus: "Active"
   - Default fuel inventory (5000L petrol, 4000L diesel)

3. Saves pump record to `localStorage["petromanage:pumps"]`

4. Pump immediately appears in the pumps list

---

### Step 2: Admin Views & Manages Credentials

**Location**: `http://localhost:3000/dashboard/pumps` → Click pump row

**Modal Shows**:
- Pump details (ID, name, owner, location)
- Login credentials section:
  - Email: `khan@khanpetroleumagencygmail.com` (with Copy button)
  - Password: `••••••••` (with Show/Hide toggle and Copy button)
  - Account Status: Active/Inactive/Suspended

**Admin Can**:
1. Click "Show" to reveal password
2. Click "Copy" to copy email or password to clipboard
3. Click "Reset Password" to set a new password
4. Changes are saved immediately to localStorage

**Password Reset**:
- Admin enters new password
- Clicks "Update Password"
- New password is stored in pump record
- Takes effect immediately for next login

---

### Step 3: Pump Owner Logs In

**Entry Points** (all work the same):
- `http://localhost:3000/auth/login` (main unified login)
- `http://localhost:3000/login` (role-based login)
- `http://localhost:3000/pump-owner/login` (pump owner specific)

**Login Form**:
- Email input field
- Password input field
- Submit button

**User Enters**:
- Email: `khan@khanpetroleumagencygmail.com`
- Password: `Khan123`

**System Validation**:
1. Search `localStorage["petromanage:pumps"]`
2. Find pump by `ownerEmail` (case-insensitive)
3. Validate password (exact match, case-sensitive)
4. Check `accountStatus` === "Active"
5. If valid:
   - Create `localStorage["user-session"]` with email, role, pumpId
   - Create `localStorage["pump_owner_session"]` with pumpId, email, role
   - Call `setPumpOwnerSessionCookie` (server action) to set HTTP-only cookie
   - Redirect to `/pump-owner/dashboard`
6. If invalid: Show "Invalid email or password" error

---

### Step 4: Pump Owner Accesses Dashboard

**Location**: `http://localhost:3000/pump-owner/dashboard`

**Dashboard Process**:
1. Page loads as client-side component
2. Reads `localStorage["pump_owner_session"]` to get `pumpId`
3. Reads `localStorage["pump_owner_session"]` to verify session exists
4. If no session, redirects to `/auth/login`
5. Searches `localStorage["petromanage:pumps"]` for pump with matching `id`
6. Loads and displays:
   - Pump ID, Status (Online/Offline/Maintenance)
   - Location, Contact phone
   - Fuel inventory (petrol & diesel with % capacity)
   - Pump details (address, email, created date)

**Data Persistence**:
- Pump data persists across page refreshes
- Session persists across navigation
- Session lost on browser close (not persistent login)

---

## Storage Details

### localStorage["petromanage:pumps"]
- **Type**: Array of Pump objects
- **Persists**: Across page refreshes, browser close
- **Cleared**: Only when user manually clears browser data

### localStorage["user-session"]
- **Type**: Object with { email, role, pumpId, status, loginTime }
- **Purpose**: General session tracking (not pump-owner specific)
- **Used by**: Dashboard components to identify logged-in user

### localStorage["pump_owner_session"]
- **Type**: Object with { pumpId, email, role, status }
- **Purpose**: Pump owner session tracking
- **Used by**: /pump-owner/dashboard to load correct pump

### Server-side Cookie: pump_owner_session
- **Set by**: `setPumpOwnerSessionCookie` server action
- **Used by**: `requirePumpOwnerAuth` (if used in future server-side pages)
- **HTTP-only**: Yes (secure, can't be accessed by JavaScript)

---

## Key Features

### Email Generation
- Formula: `{ownerNameLowercase}@{pumpNameLowercase}gmail.com`
- Removes all spaces from both owner and pump names
- Example: "John Doe" + "ABC Station" → "johndoe@abcstationgmail.com"
- Stored in pump record, never regenerated

### Password Handling
- Stored as plain text in pump.password (demo implementation)
- No encryption or hashing (NOT for production)
- Admin can reset password anytime
- Pump owner must enter exact password (case-sensitive)
- Email matching is case-insensitive

### Account Status
- **Active**: Pump owner can login
- **Inactive**: Login blocked, shows status message
- **Suspended**: Login blocked, shows suspension message
- Admin can change status in future enhancements

### Session Management
- Sessions stored in localStorage (vulnerable to XSS)
- No refresh token or expiry
- Session lost on browser close
- For production: use httpOnly cookies + refresh tokens

---

## Testing the Complete Flow

### Test Scenario: Create → Refresh → Login → Dashboard

1. **Create Pump**:
   - Navigate to `/dashboard/pumps`
   - Fill form and submit
   - Verify pump appears in list

2. **Refresh Page**:
   - F5 or Cmd+R
   - Verify pump still appears (data persisted)

3. **View Credentials**:
   - Click pump row
   - Modal opens showing email and password
   - Click "Show" to reveal password
   - Note the exact email and password

4. **Clear Session** (optional):
   - Open DevTools → Application → Storage → localStorage
   - Delete "pump_owner_session" and "user-session" keys

5. **Login**:
   - Navigate to `/auth/login`
   - Enter email and password from modal
   - Click "Sign In"

6. **Verify Dashboard**:
   - Should redirect to `/pump-owner/dashboard`
   - Should show pump overview with correct Pump ID
   - Should show fuel inventory
   - Should show pump details
   - No "Pump information not found" error

7. **Refresh Dashboard**:
   - F5 or Cmd+R
   - Should remain on dashboard (session persists)
   - Data should still display correctly

8. **Test Password Reset**:
   - Go back to `/dashboard/pumps`
   - Click pump row
   - Click "Reset Password"
   - Enter new password: "NewPassword123"
   - Click "Update Password"
   - Modal shows new password
   - Logout (clear localStorage)
   - Try login with new password
   - Should succeed

---

## File Structure

### Creation Flow
- **File**: `src/app/dashboard/pumps/page.tsx`
- **Function**: `handleAddPump()`
- **Creates**: Pump record with all fields
- **Stores**: `localStorage["petromanage:pumps"]`

### Login Flows
- **File**: `src/app/auth/login/page.tsx`
- **File**: `src/app/login/page.tsx` → uses `LoginForm` component
- **File**: `src/app/pump-owner/login/page.tsx`
- **All check**: `localStorage["petromanage:pumps"]`
- **All use**: Same validation logic

### Dashboard
- **File**: `src/app/pump-owner/dashboard/page.tsx`
- **Reads**: `localStorage["pump_owner_session"]` for pumpId
- **Loads**: Pump from `localStorage["petromanage:pumps"]`
- **Displays**: All pump data

### Types
- **File**: `src/lib/dashboard/data/pumps.ts`
- **Type**: `Pump`
- **Contains**: All fields needed for creation, login, and dashboard

### Constants
- **File**: `src/lib/dashboard/data/pumps.ts`
- **Constant**: `PUMPS = []`
- **Start**: Empty (no demo data)
- **Populate**: Only by admin creating pumps

---

## Admin Password Reset Workflow

1. Admin navigates to `/dashboard/pumps`
2. Clicks on a pump row
3. Modal opens showing credentials
4. Admin clicks "Reset Password" button
5. Form appears for entering new password
6. Admin types new password (e.g., "SecurePass456")
7. Admin clicks "Update Password"
8. System updates pump record in localStorage
9. New password shows in modal
10. Admin copies and shares new password with pump owner
11. Pump owner uses new password to login
12. Old password no longer works

---

## Security Notes

### Current Implementation (Demo)
- ❌ Passwords stored as plain text
- ❌ No encryption or hashing
- ❌ Sessions in localStorage (XSS vulnerable)
- ❌ No password complexity requirements
- ❌ No rate limiting on login attempts
- ❌ No HTTPS enforcement
- ❌ No 2FA or MFA

### Production Recommendations
1. Hash passwords with bcrypt before storing
2. Use httpOnly, Secure, SameSite cookies for sessions
3. Implement CSRF protection
4. Add rate limiting for login attempts
5. Implement session expiry (15-30 minutes)
6. Add password complexity requirements
7. Implement password reset via email
8. Add 2FA for sensitive operations
9. Audit log all password changes
10. Use HTTPS for all communications

---

## Troubleshooting

### "Invalid email or password" on login
- Verify email matches exactly (case doesn't matter but special chars do)
- Verify password matches exactly (case-sensitive)
- Check browser's DevTools → Application → Storage → localStorage
- Verify pump record exists in "petromanage:pumps"
- Verify accountStatus is "Active"

### Pump not appearing after creation
- Check browser's DevTools → Application → Storage → localStorage
- Look for "petromanage:pumps" key
- Verify pump was saved (check JSON structure)
- Try refreshing page (Ctrl+Shift+Del to clear cache)

### Dashboard shows "Pump information not found"
- Check session exists in localStorage["pump_owner_session"]
- Check pump.id matches session.pumpId
- Verify pump exists in localStorage["petromanage:pumps"]
- Try logging out and logging back in

### Password reset not working
- Ensure form is visible (click "Reset Password" button)
- Enter new password in text field
- Click "Update Password" button
- Check localStorage to verify password changed
- Try logging out and in again

---

## API Endpoints Used

Currently, this system only uses client-side localStorage. No API endpoints are called for:
- Pump creation
- Login
- Credentials storage
- Dashboard data

Server action used:
- `setPumpOwnerSessionCookie()` - Sets server-side authentication cookie

All other operations use localStorage directly in the browser.

---

## Future Enhancements

1. **Backend Integration**
   - Move pump data to database
   - Move authentication to server
   - Implement real password hashing

2. **Admin Features**
   - Deactivate/suspend pump accounts
   - Suspend specific pump operations
   - View login audit log
   - Force password reset for pump owner

3. **Pump Owner Features**
   - Change own password
   - Reset password via email
   - View login history
   - Logout from all devices

4. **Security**
   - Implement 2FA
   - Add CAPTCHA to login
   - Rate limit login attempts
   - Session expiry and refresh tokens

5. **Integration**
   - Link to real payment system
   - Sync with fuel management system
   - Real-time inventory updates
   - Mobile app support

---

## Version History

- **v1.0** - Initial unified pump owner system
  - Single pump record for all data
  - Client-side localStorage storage
  - Three login entry points
  - Password management in modal
  - Basic dashboard display

---

## Status

✅ **COMPLETE & TESTED**

- ✅ Pump creation creates unified record
- ✅ Email auto-generated from owner + pump name
- ✅ Password stored in pump record
- ✅ All login entry points check pump records
- ✅ Password validation working
- ✅ Dashboard loads with pump data
- ✅ Data persists across refresh
- ✅ Password reset functionality working
- ✅ Account status checking working
- ✅ Build passes without errors
- ✅ No demo data in system
- ✅ localStorage is single source of truth
