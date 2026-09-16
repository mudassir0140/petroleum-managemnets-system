# Admin-Generated Pump Owner Credentials Flow

## Overview
Pump Owners no longer sign up themselves. Admin creates everything and provides credentials directly.

**Flow:**
1. Admin creates pump with owner details and password
2. System auto-generates owner email from owner name + pump name
3. Admin sees generated credentials and shares with pump owner
4. Pump owner logs in immediately with email + password
5. Pump owner accesses their assigned pump dashboard

## Admin Pump Creation

### Navigate to Pump Management
1. Go to: `http://localhost:3000/admin/dashboard/pumps`
2. Fill in the form:

### Form Fields

- **Pump Name**: e.g., "Khan Petroleum Agency"
- **Company Name**: e.g., "Khan Group"
- **Owner Name**: e.g., "Mudassir"
- **Phone**: e.g., "03001234567"
- **Address**: e.g., "123 Main St"
- **City**: e.g., "Karachi"
- **Password**: e.g., "SecurePass123!"

### Auto-Generated Fields

**Email** (shown as read-only):
- Format: `{lowercase_owner_name}@{lowercase_pump_name_no_spaces}gmail.com`
- Example: `mudassir@khanpetroleumagencygmail.com`

### Click "Create Pump"

After successful creation, admin sees:

```
Pump Owner Login Credentials (Share with Owner)
─────────────────────────────────────────────
Email:    mudassir@khanpetroleumagencygmail.com
Password: SecurePass123!
```

**Copy and share these credentials with the pump owner.**

## Pump Owner Login

### Navigate to Login
1. Go to: `http://localhost:3000/pump-owner/login`

### Enter Credentials
- **Email**: mudassir@khanpetroleumagencygmail.com (from admin)
- **Password**: SecurePass123! (from admin)

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
  return `${cleanOwner}@${cleanPump}gmail.com`;
}
```

## API Endpoints

### Create Pump with Credentials
```
POST /api/admin/pumps
{
  "pumpName": "Khan Petroleum Agency",
  "companyName": "Khan Group",
  "ownerName": "Mudassir",
  "ownerEmail": "mudassir@khanpetroleumagencygmail.com",  // auto-generated
  "ownerPhone": "03001234567",
  "address": "123 Main St",
  "city": "Karachi",
  "password": "SecurePass123!",
  "status": "open",
  "petrolCapacity": 1000,
  "dieselCapacity": 1000
}
```

### Pump Owner Login
```
POST /pump-owner/login
{
  "email": "mudassir@khanpetroleumagencygmail.com",
  "password": "SecurePass123!"
}
```

Returns session cookie if credentials match and account is approved.

## Testing Checklist

- [ ] Admin navigates to Pump Management page
- [ ] Form shows all required fields
- [ ] Email auto-generates correctly from owner name + pump name
- [ ] "Create Pump" button successfully creates pump
- [ ] Success message shows generated credentials
- [ ] Copy credentials and share with pump owner
- [ ] Pump owner can login with credentials
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
