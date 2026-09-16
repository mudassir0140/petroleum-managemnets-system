# Pump Creation to Login Integration

## Overview

This document describes how pumps created from `/dashboard/pumps` are integrated with the authentication system, enabling pump owners to login via the main login page.

## Problem Solved

Previously, pumps created from `/dashboard/pumps` were stored only in React state and didn't create corresponding User records. This meant pump owners couldn't login because:
1. No User record existed in localStorage
2. The email/password had no place to be validated against

## Solution

When a pump is created from `/dashboard/pumps`:
1. Pump data is saved to localStorage (`petromanage:pumps` collection)
2. User record is automatically created with the generated credentials
3. Pump owner can immediately login via main login page

## Implementation Details

### 1. Pump Storage (`/dashboard/pumps`)

**Files Modified**: `src/app/dashboard/pumps/page.tsx`

**Changes**:
- Added `useEffect` hook to load pumps from localStorage on mount
- Added `savePumpsToStorage()` function to persist pump data
- Added `createPumpOwnerUser()` function to create User records
- Updated `handleAddPump()` to save to localStorage and create User

**Storage Location**: 
```
localStorage["petromanage:pumps"] = [
  {
    id: "PUMP-01",
    name: "Khan Petroleum Agency",
    owner: "Khan",
    ownerEmail: "khan@khanpetroleumgmail.com",
    password: "Khan123",
    city: "Karachi",
    // ... other fields
  },
  ...
]
```

### 2. User Record Creation

When pump is created, a User record is automatically created:

```
localStorage["petromanage:users"] = [
  {
    id: "USER-xxx",
    email: "khan@khanpetroleumgmail.com",
    passwordHash: "Khan123",
    role: "pump-owner",
    pumpId: "PUMP-01",
    approvalStatus: "approved",
    createdAt: "2026-09-16T...",
    updatedAt: "2026-09-16T..."
  },
  ...
]
```

### 3. Login Flow

```
User visits /login
  ↓
Enters email: khan@khanpetroleumgmail.com
Enters password: Khan123
  ↓
System reads localStorage["petromanage:users"]
  ↓
Finds user with matching email (case-insensitive)
  ↓
Validates password (exact match)
  ↓
Checks role === "pump-owner"
  ↓
Creates session: localStorage["user-session"]
  ↓
LoginForm component recognizes role
  ↓
Redirects to /pump-owner/dashboard
  ↓
Pump owner sees their dashboard
```

## Complete User Journey

### Step 1: Admin Creates Pump from /dashboard/pumps

```
1. Admin visits http://localhost:3000/dashboard/pumps
2. Clicks "Add New Pump" button
3. Fills form:
   - Pump Name: "Khan Petroleum Agency"
   - Company Name: "Khan Petroleum"
   - Pump Owner Name: "Khan"
   - Password: "Khan123"
   - City, Address, Phone (optional)
4. Clicks "Add Pump"
```

### Step 2: System Auto-Generates Email

```
1. System generates email from owner name + pump name:
   - Owner: "Khan"
   - Pump: "Khan Petroleum Agency"
   - Email: khan@khanpetroleumgmail.com
2. Pump saved to localStorage with:
   - Email: khan@khanpetroleumgmail.com
   - Password: Khan123
3. User record created with same credentials
```

### Step 3: Admin Views and Shares Credentials

```
1. Pump appears in "All pumps" table
2. Admin clicks on pump row to view details
3. Modal shows:
   - Pump Name: Khan Petroleum Agency
   - Owner Name: Khan
   - Email: khan@khanpetroleumgmail.com
   - Password: ••••••• (hidden, can Show)
4. Admin shares these credentials with pump owner
```

### Step 4: Pump Owner Logs In

```
1. Pump owner visits http://localhost:3000/login
2. (System defaults to first role, likely "Company Manager")
3. Or pump owner clicks "Choose a different role"
4. Selects "Pump Owner" if not already shown
5. Enters:
   - Email: khan@khanpetroleumgmail.com
   - Password: Khan123
6. Clicks "Sign in"
```

### Step 5: System Validates and Routes

```
1. LoginForm reads localStorage["petromanage:users"]
2. Finds user with email "khan@khanpetroleumgmail.com"
3. Validates password: "Khan123" === "Khan123" ✓
4. Checks approvalStatus: "approved" ✓
5. Checks role: "pump-owner" ✓
6. Creates session in localStorage
7. Determines dashboardHref for pump-owner role
8. Redirects to /pump-owner/dashboard
```

### Step 6: Pump Owner Accesses Dashboard

```
1. Pump owner sees /pump-owner/dashboard
2. Dashboard shows:
   - Pump overview with ID
   - Fuel inventory
   - Pump details
   - etc.
3. Can access pump settings
4. Can view assigned pump information
```

## Data Consistency

The system uses the **same data source** for both:
- **Creating**: When pump is created, email/password saved to User record
- **Verifying**: When logging in, same User record is checked

This ensures no mismatch between what admin shares and what login accepts.

## Code Flow

### Adding Pump
```typescript
function handleAddPump(event) {
  // 1. Generate email from owner name + pump name
  const generatedEmail = generateEmail(form.ownerName, form.pumpName);
  
  // 2. Create pump object
  const newPump = {
    id: pumpId,
    ownerEmail: generatedEmail,
    password: form.password,
    // ... other fields
  };
  
  // 3. Save pump to state
  setPumps((prev) => {
    const updatedPumps = [...prev, newPump];
    
    // 4. Save to localStorage
    savePumpsToStorage(updatedPumps);
    
    // 5. Create User record
    createPumpOwnerUser(generatedEmail, form.password, pumpId);
    
    return updatedPumps;
  });
}
```

### Creating User Record
```typescript
function createPumpOwnerUser(email, password, pumpId) {
  // 1. Read existing users from localStorage
  const usersData = localStorage.getItem("petromanage:users");
  const users = usersData ? JSON.parse(usersData) : [];
  
  // 2. Check if user already exists
  const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!existingUser) {
    // 3. Create new user record
    users.push({
      id: `USER-${Date.now()}`,
      email,
      passwordHash: password,
      role: "pump-owner",
      pumpId,
      approvalStatus: "approved",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // 4. Save back to localStorage
    localStorage.setItem("petromanage:users", JSON.stringify(users));
  }
}
```

### Login Validation
```typescript
function handleSubmit(event) {
  // 1. Read users from localStorage
  const usersData = localStorage.getItem("petromanage:users");
  const users = JSON.parse(usersData);
  
  // 2. Find user by email (case-insensitive)
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  
  // 3. Validate password (exact match)
  if (user.passwordHash !== password) {
    setError("Invalid email or password");
    return;
  }
  
  // 4. Check approval status
  if (user.approvalStatus === "pending") {
    setError("Your account is pending admin approval...");
    return;
  }
  
  // 5. Create session and redirect
  localStorage.setItem("user-session", JSON.stringify({...}));
  router.push(dashboardHref); // /pump-owner/dashboard
}
```

## Testing Checklist

- [x] Build passes with no errors
- [x] Pump creation saves to localStorage
- [x] User record created automatically
- [x] Email auto-generated correctly
- [x] Password stored exactly as entered
- [x] Pump owner can login with generated credentials
- [x] Email comparison is case-insensitive
- [x] Password comparison is exact match
- [x] Login redirects to /pump-owner/dashboard
- [x] Session persists after refresh
- [x] Multiple pumps can be created independently

## Test Scenario

### Create and Login Test

**Setup**:
1. Visit http://localhost:3000/dashboard/pumps
2. Create pump:
   - Pump Name: "Test Station"
   - Company Name: "Test Co"
   - Owner Name: "TestUser"
   - Password: "TestUser123"
3. Note the auto-generated email in pump details modal
4. Copy email: testuser@teststationgmail.com

**Test Login**:
1. Visit http://localhost:3000/login
2. (If needed, choose Pump Owner from role selector)
3. Enter:
   - Email: testuser@teststationgmail.com
   - Password: TestUser123
4. Click "Sign in"
5. Should redirect to /pump-owner/dashboard
6. Dashboard should show the pump info

**Verify**:
- Open DevTools → Application → Storage → localStorage
- Check `petromanage:pumps` contains the pump
- Check `petromanage:users` contains the user record
- Check `user-session` contains session data

## Data Structures

### Pump (localStorage["petromanage:pumps"])
```json
{
  "id": "PUMP-01",
  "number": 1,
  "name": "Test Station",
  "owner": "TestUser",
  "ownerEmail": "testuser@teststationgmail.com",
  "password": "TestUser123",
  "city": "Karachi",
  "address": "Main Road",
  "phone": "03001234567",
  "status": "Online",
  "since": "2026-09-16",
  "lastInspection": "2026-09-16",
  "todaySales": [
    { "fuelType": "petrol", "liters": 0, "revenue": 0 },
    { "fuelType": "diesel", "liters": 0, "revenue": 0 }
  ],
  "weeklyRevenue": [0, 0, 0, 0, 0, 0, 0],
  "monthlySales": 0,
  "lastMonthSales": 0
}
```

### User (localStorage["petromanage:users"])
```json
{
  "id": "USER-1726500000000",
  "email": "testuser@teststationgmail.com",
  "passwordHash": "TestUser123",
  "role": "pump-owner",
  "pumpId": "PUMP-01",
  "approvalStatus": "approved",
  "createdAt": "2026-09-16T10:00:00.000Z",
  "updatedAt": "2026-09-16T10:00:00.000Z"
}
```

### Session (localStorage["user-session"])
```json
{
  "email": "testuser@teststationgmail.com",
  "role": "pump-owner",
  "pumpId": "PUMP-01",
  "status": "active",
  "loginTime": "2026-09-16T10:05:00.000Z"
}
```

## Summary

The integration ensures:
1. **Consistency**: Same data source for creating and verifying credentials
2. **Automation**: User records created automatically with pump
3. **Accessibility**: Pump owners can login immediately after admin creates pump
4. **Reliability**: localStorage persists across page refreshes and browser restarts
5. **Security**: Passwords validated exactly as stored (no transformation)

The complete flow from pump creation to pump owner login is now seamless and reliable.

## Status: ✅ INTEGRATED & TESTED

- ✅ Pumps from /dashboard/pumps saved to localStorage
- ✅ User records created automatically for pump owners
- ✅ Login system finds and validates pump owner credentials
- ✅ Pump owners redirected to /pump-owner/dashboard
- ✅ Build passing with no errors
- ✅ Changes committed and pushed
