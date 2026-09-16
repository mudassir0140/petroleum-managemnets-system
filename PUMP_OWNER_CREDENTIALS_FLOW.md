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

## Pump Owner Login

### Navigate to Login
1. Go to: `http://localhost:3000/pump-owner/login`

### Enter Credentials
- **Email**: mudassir@khanpetroleumagency.com (from admin)
- **Password**: Mudassir123 (from admin)

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

## Testing Checklist

- [ ] Admin navigates to Pump Management page
- [ ] Form shows only two fields: Pump Name and Owner Name
- [ ] Auto-generated credentials display in amber preview while typing
- [ ] Email auto-generates correctly (format: `owner@pump.com`)
- [ ] Password auto-generates correctly (format: `OwnerName123`)
- [ ] "Create Pump" button successfully creates pump
- [ ] Blue credential box displays generated email and password after creation
- [ ] Pump appears in list immediately with Owner Name and Owner Email columns
- [ ] Pump owner can login with generated email and password
- [ ] After login, pump owner sees only their assigned pump dashboard
- [ ] Pump owner can view all dashboard sections (stock, sales, staff, etc.)
- [ ] Existing pump owner accounts (signup-based) still work (backward compatibility)

## Backward Compatibility

- Old pump owner signup flow still works (if old data exists)
- Login tries MongoDB user first, then falls back to old pump data
- Existing pump owners can still login with old flow

## Future Enhancements

1. **Password Hashing**: Use bcrypt for production
2. **Password Reset**: Admin can reset pump owner password
3. **Account Management**: Admin can view/edit/disable pump owner accounts
4. **Real Emails**: Send credentials via email instead of showing on screen
5. **Audit Log**: Track who created pumps and when
6. **MFA**: Two-factor authentication for pump owners
