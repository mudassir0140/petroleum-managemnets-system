# Dashboard Pumps Page Update

## Overview
Updated `/dashboard/pumps` page to implement a new pump creation flow with auto-generated pump owner login credentials.

## Key Features

### 1. Add Pump Form
**Location**: `/dashboard/pumps` → Click "Add New Pump" button

**Form Fields**:
- **Pump Name** (required): Display name for the pump
  - Example: "Khan Petroleum Agency"
- **Company Name** (required): Company identifier
  - Example: "Khan Petroleum"
- **Pump Owner Name** (required): Name of the person who owns the pump
  - Example: "Mudassir"
- **Password** (required): Manual entry by admin
  - Example: "SecurePass123"
- City (optional, defaults to first city)
- Address (optional)
- Phone (optional)

### 2. Auto-Generated Login Credentials

**Email Generation**:
- Format: `{ownername}@{pumpname}gmail.com`
- Process:
  1. Convert owner name to lowercase
  2. Remove all spaces from owner name
  3. Convert pump name to lowercase
  4. Remove all spaces from pump name
  5. Combine: `{cleanowner}@{cleanpump}gmail.com`

**Examples**:
```
Owner: "Mudassir", Pump: "Khan Petroleum Agency"
→ Email: mudassir@khanpetroleumagencygmail.com

Owner: "Ahmed Khan", Pump: "Khan Petroleum"
→ Email: ahmedkhan@khanpetroleumgmail.com

Owner: "Muhammad Rizwan", Pump: "Royal Petrol Station"
→ Email: muhammadrizwan@royalpetrolstationgmail.com
```

**Password**:
- Entered manually by admin during pump creation
- Stored with pump record

### 3. Pump Details Modal

**Location**: Click on any pump row in the "All pumps" table

**Login Credentials Section**:
- Shows a blue highlighted box with:
  - "Login Credentials for Pump Owner" header
  - Email: `mudassir@khanpetroleumagencygmail.com`
  - Password: `••••••••` (masked)
- Instructions: "Share these credentials with the pump owner. They can log in immediately at /pump-owner/login"

**Other Details**:
- Owner name
- Email (non-masked)
- Phone
- City
- Status
- Operating since
- Last inspection
- Fuel sales data
- Weekly and monthly revenue

### 4. Email Generation Preview

**Live Preview in Form**:
- When user types in owner name and pump name fields
- Auto-generated email displays in a blue info box below password field
- Updates in real-time as user types
- Shows "—" if either field is empty

## Flow Diagram

```
Admin visits /dashboard/pumps
    ↓
Clicks "Add New Pump" button
    ↓
Fills form:
├─ Pump Name: "Khan Petroleum Agency"
├─ Company Name: "Khan Petroleum"
├─ Owner Name: "Mudassir"
├─ Password: "MySecurePass123"
└─ Other fields (optional)
    ↓
Form auto-generates email: mudassir@khanpetroleumagencygmail.com
    ↓
Admin clicks "Add Pump"
    ↓
Pump saved to local state with:
├─ Name: "Khan Petroleum Agency"
├─ Owner: "Mudassir"
├─ Email: mudassir@khanpetroleumagencygmail.com
├─ Password: MySecurePass123
└─ Other fields
    ↓
Pump appears in "All pumps" table
    ↓
Admin clicks on pump row to view details
    ↓
Modal shows login credentials:
├─ Email: mudassir@khanpetroleumagencygmail.com
└─ Password: ••••••••
    ↓
Admin shares email & password with pump owner
    ↓
Pump Owner visits http://localhost:3000/pump-owner/login
    ↓
Logs in with:
├─ Email: mudassir@khanpetroleumagencygmail.com
└─ Password: MySecurePass123
    ↓
Accesses /pump-owner/dashboard
```

## Implementation Details

### Files Modified

#### `src/app/dashboard/pumps/page.tsx`
- Updated `PumpFormState` type to include new fields
- Added `generateEmail()` function
- Updated form submission handler `handleAddPump()`
- Enhanced form UI with new fields and email preview
- Updated detail modal to show credentials section
- Added password field to pump creation

#### `src/lib/dashboard/data/pumps.ts`
- Extended `Pump` type to include optional `password` field
- Allows password storage in local pump data

### Email Generation Function

```typescript
function generateEmail(ownerName: string, pumpName: string): string {
  if (!ownerName || !pumpName) return "";
  const cleanOwner = ownerName.toLowerCase().trim().replace(/\s+/g, "");
  const cleanPump = pumpName.toLowerCase().trim().replace(/\s+/g, "");
  return `${cleanOwner}@${cleanPump}gmail.com`;
}
```

**Key Features**:
- Handles single and multi-word owner names
- Removes all whitespace (spaces, tabs, etc.)
- Converts to lowercase for consistency
- Returns empty string if inputs are missing

## Integration with Pump Owner System

1. **No Signup Required**: Pump owners login directly with admin-created credentials
2. **Auto-Generated Email**: Format ensures unique, memorable email addresses
3. **Manual Password**: Admin controls password during pump creation
4. **Dashboard Access**: Pump owner accesses only their assigned pump dashboard
5. **Credential Display**: Admin can view credentials anytime by clicking pump details

## Testing Checklist

- [x] Form accepts all required fields
- [x] Email auto-generates correctly for various owner names
- [x] Email handles multi-word owner names (spaces removed)
- [x] Email handles multi-word pump names (spaces removed)
- [x] Pump saves with password to local state
- [x] Pump details modal displays credentials
- [x] Password is masked in credentials section (shown as dots)
- [x] Email preview updates in real-time as user types
- [x] Form validation works correctly
- [x] Build passes with no errors
- [x] Changes committed and pushed to GitHub

## Future Enhancements

1. **Database Integration**: Save pumps to MongoDB instead of local state
2. **Password Reset**: Admin ability to reset pump owner password
3. **Password Visibility Toggle**: Show/hide password in credentials section
4. **Copy to Clipboard**: Quick copy buttons for email and password
5. **Bulk Import**: Import multiple pumps from CSV
6. **Email Notification**: Auto-send credentials to pump owner via email

## Notes

- Currently uses local state (React useState) for pump storage
- Email format is case-insensitive by convention (smtp doesn't distinguish case)
- Password is stored in plain text in this demo version
- For production: implement password hashing (bcrypt) and database persistence
- Admin interface is accessible at `/dashboard/pumps`
- Pump owner login is at `/pump-owner/login`
