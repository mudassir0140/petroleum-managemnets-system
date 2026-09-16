# Admin-Generated Pump Owner Credentials Flow

## Overview
Pump Owners no longer sign up themselves. Admin creates everything with minimal info, and credentials are auto-generated.

**Flow:**
1. Admin creates pump with just name and owner name (2 fields!)
2. System auto-generates owner email from owner name + pump name
3. System auto-generates password from owner name
4. Pump immediately appears in list with credentials visible
5. Admin shares credentials with pump owner
6. Pump owner logs in immediately with email + password
7. Pump owner can change password from their settings

## Admin Pump Creation (Super Simple!)

### Navigate to Pump Management
1. Go to: `http://localhost:3000/admin/dashboard/pumps`
2. Fill in just TWO fields!

### Form Fields (Required)

- **Pump Name**: e.g., "Khan Petroleum Agency"
- **Owner Name**: e.g., "Mudassir"

### Auto-Generated Fields (Shown in Preview)

**Email**:
- Format: `{lowercase_owner_name}@{lowercase_pump_name}.com`
- Example: `mudassir@khanpetroleumagency.com`

**Password**:
- Format: `{OwnerName}123`
- Example: `Mudassir123`

### Click "Create Pump"

After successful creation, admin sees:

```
Pump Owner Login Credentials (Share with Owner)
─────────────────────────────────────────────
Email:    mudassir@khanpetroleumagency.com
Password: Mudassir123
```

**Copy and share these credentials with the pump owner.**

## Admin Pump Details & Password Management

### View Pump Details
1. On Pump Management page, click **"View Details"** button for any pump
2. Modal opens showing:
   - **Pump Name**: e.g., "Khan Petroleum Agency"
   - **Owner Name**: e.g., "Mudassir"
   - **Owner Email**: e.g., "mudassir@khanpetroleumagency.com" (with copy button)
   - **Status**: e.g., "open"
   - **Current Password**: Hidden by default (shown as dots: ••••••••)

### View/Reveal Password
- Click **"Show"** button next to password to reveal the actual password
- Click **"Hide"** to hide it again
- Copy button available to copy email or password

### Reset Password
1. In the detail modal, click **"Reset Password"** button
2. System generates new password (based on owner name): `Mudassir123`
3. New password displayed in green success box with copy button
4. Share new password with pump owner
5. Admin always sees the current, up-to-date password in the modal

### Password Updates Reflect Automatically
- If pump owner changes password from their own dashboard settings
- Admin's modal will show the updated password on next view
- Password stored in both User table and Pump table for admin reference

## Pump Owner Login

### Navigate to Login
1. Go to: `http://localhost:3000/pump-owner/login`

### Enter Credentials
- **Email**: mudassir@khanpetroleumagency.com (from admin)
- **Password**: Mudassir123 (from admin, or new one if reset by admin)

### Click "Sign in"

### Access Dashboard
After successful login, pump owner is redirected to their dashboard:
- `http://localhost:3000/pump-owner/dashboard`
- Shows their assigned pump only
- Can view fuel stock, sales, staff, payments, etc.

## Technical Details

### Database Changes
- **User** collection: Stores email, passwordHash, pumpId, approvalStatus
- **Pump** collection: Contains pump details (no email field needed)
- User account is **auto-approved** when created by admin

### Password Handling
**Note**: Current implementation stores passwords as plain text for demo.
**Production**: Should use bcrypt to hash passwords before storing.

### Email Generation Logic
```typescript
function generateEmail(ownerName: string, pumpName: string): string {
  const cleanOwner = ownerName.toLowerCase().trim();
  const cleanPump = pumpName.toLowerCase().trim().replace(/\s+/g, "");
  return `${cleanOwner}@${cleanPump}.com`;
}

function generatePassword(ownerName: string): string {
  const cleanName = ownerName.trim().charAt(0).toUpperCase() + ownerName.trim().slice(1);
  return `${cleanName}123`;
}
```

## API Endpoints

### Create Pump with Credentials
```
POST /api/admin/pumps
{
  "pumpName": "Khan Petroleum Agency",
  "ownerName": "Mudassir",
  "ownerEmail": "mudassir@khanpetroleumagency.com",  // auto-generated
  "password": "Mudassir123"  // auto-generated
}
```

Returns:
- `pump`: the created pump object with pumpId and owner details
- `user`: the created user account with auto-approved status

### Pump Owner Login
```
POST /pump-owner/login
{
  "email": "mudassir@khanpetroleumagency.com",
  "password": "Mudassir123"
}
```

Returns session cookie if credentials match and account is approved.

### Reset Pump Owner Password (Admin Only)
```
POST /api/admin/pumps/reset-password
{
  "pumpId": "PUMP-1234567890-ABC"
}
```

Returns:
- `success`: true on success
- `password`: The newly generated password
- `message`: Success message

Updates both User table (passwordHash) and Pump table (password field).

## Testing Checklist

### Pump Creation
- [ ] Admin navigates to Pump Management page
- [ ] Form shows only two fields: Pump Name and Owner Name
- [ ] Auto-generated credentials display in amber preview while typing
- [ ] Email auto-generates correctly (format: `owner@pump.com`)
- [ ] Password auto-generates correctly (format: `OwnerName123`)
- [ ] "Create Pump" button successfully creates pump
- [ ] Blue credential box displays generated email and password after creation
- [ ] Pump appears in list immediately with Owner Name and Owner Email columns

### Admin Pump Details & Password Management
- [ ] Admin clicks "View Details" button on a pump in the list
- [ ] Detail modal opens showing Pump Name, Owner Name, Email, Status
- [ ] Current Password field shows as dots (••••••••) by default
- [ ] Click "Show" button reveals the actual password
- [ ] Click "Hide" button hides the password again
- [ ] Copy button copies email to clipboard
- [ ] Admin clicks "Reset Password" button
- [ ] Green success box appears showing new password
- [ ] New password follows format: `OwnerName123`
- [ ] Copy button in success box copies new password

### Pump Owner Login & Dashboard
- [ ] Pump owner can login with generated email and password
- [ ] After login, pump owner sees only their assigned pump dashboard
- [ ] Pump owner can view all dashboard sections (stock, sales, staff, etc.)

### Password Update Reflection
- [ ] Admin opens pump detail modal, sees password (e.g., "Mudassir123")
- [ ] Pump owner logs in and changes their password in settings
- [ ] Admin closes and reopens pump detail modal
- [ ] Modal displays the new password changed by pump owner

### Backward Compatibility
- [ ] Existing pump owner accounts (signup-based) still work

## Backward Compatibility

- Old pump owner signup flow still works (if old data exists)
- Login tries MongoDB user first, then falls back to old pump data
- Existing pump owners can still login with old flow

## Implemented Features

- ✅ **Admin Pump Details Modal**: View pump info, email, status
- ✅ **Password Visibility Toggle**: Show/Hide password with button
- ✅ **Password Reset**: Admin can reset and regenerate pump owner password
- ✅ **Password Sync**: Updates reflected in both User and Pump tables
- ✅ **Copy to Clipboard**: Quick copy for email and password sharing

## Future Enhancements

1. **Password Hashing**: Use bcrypt for production (demo uses plain text)
2. **Password Change by Owner**: Pump owners change password from dashboard/settings
3. **Account Management**: Admin can view/edit/disable pump owner accounts
4. **Real Emails**: Send credentials via email instead of showing on screen
5. **Audit Log**: Track who created pumps, reset passwords, when changes occurred
6. **MFA**: Two-factor authentication for pump owners
7. **Password Expiry**: Require password changes after X days
8. **Bulk Operations**: Reset passwords for multiple pumps at once
