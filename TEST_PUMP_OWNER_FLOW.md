# Pump Owner Account Flow - Complete Test

## Objective
Verify that pump owner credentials created from `/dashboard/pumps` work exactly on `/auth/login` and open the correct dashboard.

---

## Test Flow

### Step 1: Clear All Data (Fresh Start)
```
1. Open http://localhost:3000/
2. Open DevTools (F12 → Application → Storage → localStorage)
3. Clear localStorage completely (delete all keys)
4. Close DevTools
5. Verify page refreshes cleanly
```

### Step 2: Admin Creates Pump
```
URL: http://localhost:3000/dashboard/pumps

1. Click "Add New Pump" button
2. Fill form with:
   - Pump Name: "TestPump123"
   - Company Name: "Test Company"
   - Owner Name: "Muhammad"
   - Password: "SecurePass456!"
   - City: "Karachi"
   - Address: "Test Street" (optional)
   - Phone: "03001234567" (optional)
3. Click "Add Pump" button

VERIFY:
- Pump appears in the table
- No errors in console
```

### Step 3: Verify Pump Created with Correct Credentials
```
1. Click on the pump row to open modal
2. VERIFY credentials shown:
   - Email should show: "muhammad@testpump123gmail.com"
   - Password field shows: ••••••••

3. Click "Show" button to reveal password
4. VERIFY password shows: "SecurePass456!"

5. Copy email using Copy button next to email
6. Copy password using Copy button next to password

CRITICAL CHECKS:
- Email is lowercase with NO spaces
- Password is EXACTLY what was entered
- Both can be copied to clipboard
```

### Step 4: Verify Data Persistence
```
1. Refresh page (F5 or Cmd+R)
2. Navigate to /dashboard/pumps again
3. VERIFY pump still appears in list
4. Click pump row again
5. VERIFY credentials still show exactly the same
6. Close modal

CRITICAL: Data must survive refresh without any changes
```

### Step 5: Check localStorage Directly
```
1. Open DevTools (F12 → Application → Storage → localStorage)
2. Click on "petromanage:pumps" key
3. VERIFY JSON contains:
   {
     id: "PUMP-01",
     name: "TestPump123",
     owner: "Muhammad",
     ownerEmail: "muhammad@testpump123gmail.com",
     password: "SecurePass456!",
     role: "pump-owner",
     accountStatus: "Active",
     ...other fields...
   }

CRITICAL CHECKS:
- Email is stored EXACTLY as shown in modal
- Password is stored EXACTLY as entered
- No separate "users" or "petromanage:users" records
- Single source of truth in petromanage:pumps
```

### Step 6: Admin Can Reset Password
```
1. Modal still open showing pump
2. Click "Reset Password" button
3. Form appears for new password
4. Enter new password: "UpdatedPassword789!"
5. Click "Update Password" button
6. VERIFY password in modal updates immediately
7. VERIFY localStorage shows new password

CRITICAL: Password change takes effect instantly
```

### Step 7: Pump Owner Logs In
```
URL: http://localhost:3000/auth/login

1. Form loads with EMPTY email and password fields
2. NO demo credentials pre-filled
3. Enter email: "muhammad@testpump123gmail.com"
4. Enter password: "UpdatedPassword789!" (the new password from reset)
5. Click "Sign In" button

CRITICAL CHECKS:
- Email entered MUST match exactly (case-insensitive, so "MUHAMMAD@..." also works)
- Password entered MUST match exactly (case-sensitive)
- If password doesn't match → "Invalid email or password" error
- If account status not Active → status-specific error
```

### Step 8: Verify Login Success and Dashboard Opens
```
AFTER clicking "Sign In":

1. Page redirects to: http://localhost:3000/pump-owner/dashboard
2. Dashboard loads with pump information:
   - Pump ID: "PUMP-01"
   - Status: "Online"
   - Location: "Karachi"
   - Contact: "03001234567"
   - Fuel Inventory shows petrol and diesel levels
   - Account Status: "Active"

NO ERRORS:
- Should NOT show "Pump information not found"
- Should NOT show invalid session error
- Should load all pump data correctly
```

### Step 9: Verify Session Persistence
```
1. Refresh page (F5 or Cmd+R)
2. VERIFY dashboard still loads
3. All pump data still displays
4. No login redirect

CRITICAL: Session must survive page refresh
```

### Step 10: Verify Session Cleanup
```
1. Open DevTools (F12 → Application → Storage → localStorage)
2. VERIFY these keys exist:
   - "petromanage:pumps" - pump records
   - "user-session" - current user session
   - "pump_owner_session" - pump owner specific session

3. VERIFY values are correct:
   - pump_owner_session has pumpId: "PUMP-01"
   - pump_owner_session has email: "muhammad@testpump123gmail.com"

NO DEMO DATA:
- No "demo@petromanage.demo" credentials
- No hardcoded demo accounts
```

### Step 11: Test Invalid Credentials
```
1. Navigate to /auth/login
2. Enter email: "muhammad@testpump123gmail.com"
3. Enter WRONG password: "WrongPassword123"
4. Click "Sign In"
5. VERIFY error: "Invalid email or password"

CRITICAL: Wrong password must be rejected
```

### Step 12: Test Non-Existent Email
```
1. Navigate to /auth/login
2. Enter email: "nobody@example.com"
3. Enter password: "AnyPassword123"
4. Click "Sign In"
5. VERIFY error: "Invalid email or password"

CRITICAL: Non-existent account must be rejected
```

### Step 13: Test Account Status
```
1. Open DevTools (F12 → Application → Storage → localStorage)
2. Edit petromanage:pumps JSON
3. Find the pump record
4. Change "accountStatus" from "Active" to "Inactive"
5. Save and close DevTools
6. Navigate to /auth/login
7. Try to login with correct email/password
8. VERIFY error: "This pump account is inactive. Please contact administrator."

CRITICAL: Account status must be enforced
```

### Step 14: Test All Login Entry Points
```
Test from three different URLs:

A. http://localhost:3000/auth/login
   - Login with email and password
   - Should work

B. http://localhost:3000/login?role=pump-owner
   - Select pump owner role if shown
   - Login with email and password
   - Should work

C. http://localhost:3000/pump-owner/login
   - Direct pump owner login
   - Login with email and password
   - Should work

CRITICAL: All three entry points must work identically
```

---

## Expected Results

✅ **Pump Creation**
- Email auto-generated: lowercase, no spaces
- Password stored exactly as entered
- Single pump record in localStorage
- Visible immediately in pump list

✅ **Credentials Display**
- Email shown in modal
- Password toggleable (Show/Hide)
- Both copyable to clipboard
- Match stored values exactly

✅ **Password Reset**
- Form appears in modal
- New password stored immediately
- Takes effect on next login
- Old password no longer works

✅ **Login Validation**
- Checks pump records (not separate user table)
- Email matching: case-insensitive
- Password validation: exact match, case-sensitive
- Account status: must be "Active"

✅ **Dashboard Access**
- Correct pump loads
- All pump data displays
- No "Pump information not found" error
- Session persists across refresh

✅ **Session Management**
- User-session created with email, role, pumpId
- Pump-owner-session created with pumpId, email
- Server-side cookie set for authentication
- Session survives page refresh

✅ **Error Handling**
- Wrong password → "Invalid email or password"
- Non-existent email → "Invalid email or password"
- Inactive account → "This pump account is inactive..."
- Suspended account → "This pump account has been suspended..."

✅ **No Demo Data**
- LoginForm has empty email/password fields
- /auth/login shows pump owner instructions (not demo accounts)
- No hardcoded demo credentials anywhere

---

## Success Criteria

ALL of the following must pass:

1. ✅ Pump created from /dashboard/pumps with exact email + password
2. ✅ Email and password stored in single pump record in localStorage
3. ✅ Admin can view exact credentials in modal (Show/Hide works)
4. ✅ Admin can reset password and change takes effect immediately
5. ✅ Pump owner can login from /auth/login with exact saved email + password
6. ✅ Login validates against stored pump record (not separate table)
7. ✅ Pump owner is redirected to /pump-owner/dashboard
8. ✅ Dashboard displays correct pump with all data
9. ✅ Session persists across page refresh
10. ✅ Invalid email/password rejected with appropriate error
11. ✅ Account status is checked and enforced
12. ✅ All three login entry points work identically
13. ✅ No demo credentials or hardcoded test data
14. ✅ localStorage is single source of truth
15. ✅ Build passes without TypeScript errors

---

## Notes

- Use EXACT email and password as shown in modal
- Email is case-INsensitive, password is case-SENSITIVE
- Account status must be "Active" to login
- Data persists across browser refresh (F5)
- Session lost on browser close (not persistent)
- Single pump record contains all data needed

---

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Pump creation | | |
| Email generation | | |
| Password storage | | |
| Credentials display | | |
| Password Show/Hide | | |
| Password reset | | |
| Data persistence | | |
| Login validation | | |
| Dashboard load | | |
| Session persistence | | |
| Invalid credentials | | |
| Account status check | | |
| All login entry points | | |
| No demo data | | |
| Build success | | |

---

## Issue Resolution Log

If any test fails:

1. Check browser console for JavaScript errors
2. Check localStorage in DevTools for correct data
3. Verify email matches exactly (case-INsensitive)
4. Verify password matches exactly (case-SENSITIVE)
5. Verify accountStatus is "Active"
6. Check network tab for failed API calls
7. Review git log for recent changes

---

**Status**: Ready for testing
**Last Updated**: 2026-09-17
