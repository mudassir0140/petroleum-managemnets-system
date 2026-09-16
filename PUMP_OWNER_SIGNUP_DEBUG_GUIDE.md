# Pump Owner Signup Flow - Debug Guide

## Comprehensive Error Logging Added

The Pump Owner signup flow now includes detailed logging at every step to help identify the exact point of failure.

### Logging Points

#### 1. **User Signup Entry** (`src/lib/user/actions.ts`)
```
[User Signup] Processing pump-owner signup for email: {email}
[User Signup] Imported createPumpOwnerSignupRequest function
[User Signup] Pump owner signup result: {result object}
[User Signup] Pump owner signup succeeded with request ID: {requestId}
[User Signup] Exception during pump owner signup: {error message}
```

#### 2. **Pump Email Lookup** (`src/lib/pump-owner/storage.ts`)
```
[Pump Storage] Retrieved {count} pumps from cookie. First 3 emails: {email list}
[Pump Storage] No pumps cookie found
[Pump Storage] Error parsing pumps cookie: {error}
```

#### 3. **Signup Request Creation** (`src/lib/pump-owner/signup-actions.ts`)
```
[Pump Owner Signup] Starting signup request creation for email: {email}
[Pump Owner Signup] Retrieved {count} pumps from storage
[Pump Owner Signup] Available pump emails: {complete list}
[Pump Owner Signup] Email match found for pump: {pumpId} {pumpName}
[Pump Owner Signup] No pump found with email: {email}
[Pump Owner Signup] Pump matched: {pumpId} - {pumpName}
[Pump Owner Signup] Retrieved {count} existing signup requests
[Pump Owner Signup] Existing request found with status: {status}
[Pump Owner Signup] No existing request found, proceeding to create new request
[Pump Owner Signup] Created request object: {full request}
[Pump Owner Signup] Saving {count} total requests to storage
[Pump Owner Signup] Successfully saved request to storage
[Pump Owner Signup] SUCCESS - Signup request created with ID: {requestId}
[Pump Owner Signup] ERROR CAUGHT: {error message}
[Pump Owner Signup] ERROR STACK: {full stack trace}
[Pump Owner Signup] FULL ERROR OBJECT: {error object}
```

## Testing Scenarios

### Scenario 1: Valid Pump Owner Email (NEW ACCOUNT)
**Expected Flow:**
1. Email must match a pump's assigned email in Admin's pump records
2. No existing signup request for that email
3. Should create a new signup request
4. Redirect to pending approval page

**How to Test:**
1. Go to `/auth/signup`
2. Select "Pump Owner" role
3. Use one of these pre-configured emails:
   - `ahmed.rehman@petromanage.com` (Pump 1)
   - `imran.chaudhry@petromanage.com` (Pump 2)
   - `sana.malik@petromanage.com` (Pump 3)
4. Enter password and confirm
5. **Check Browser Console** for logs starting with `[User Signup]` and `[Pump Owner Signup]`

**Expected Logs:**
```
[User Signup] Processing pump-owner signup for email: ahmed.rehman@petromanage.com
[Pump Owner Signup] Email match found for pump: pmp-014 Ashoka Road Fuel Point
[Pump Owner Signup] SUCCESS - Signup request created with ID: PO-REQ-{timestamp}
```

### Scenario 2: Email Not in Pump Records
**Expected:** Block signup with "This email is not authorized for pump owner signup"

**How to Test:**
1. Go to `/auth/signup`
2. Select "Pump Owner" role
3. Use an email NOT assigned to any pump: `test@example.com`
4. Enter password and confirm

**Expected Logs:**
```
[Pump Owner Signup] No pump found with email: test@example.com
[Pump Owner Signup] Available pump emails: [list of all pump emails]
```

### Scenario 3: Account Already Exists for Pump Email
**Expected:** Block signup with "Sorry, an account for this pump has already been created"

**How to Test:**
1. First signup with `ahmed.rehman@petromanage.com` (should succeed)
2. Try to signup again with the same email
3. Second signup should fail

**Expected Logs:**
```
[Pump Owner Signup] Existing request found with status: pending
```

## Interpreting Logs

### Success Path
```
[Pump Storage] Retrieved 8 pumps from cookie
[Pump Owner Signup] Email match found for pump: pmp-014 Ashoka Road Fuel Point
[Pump Owner Signup] No existing request found, proceeding to create new request
[Pump Owner Signup] Saving 1 total requests to storage
[Pump Owner Signup] SUCCESS - Signup request created with ID: PO-REQ-1726499505123
[User Signup] Pump owner signup succeeded with request ID: PO-REQ-1726499505123
```

### Failure: Email Not Authorized
```
[Pump Storage] Retrieved 8 pumps from cookie. First 3 emails: [list]
[Pump Owner Signup] Available pump emails: [complete list]
[Pump Owner Signup] No pump found with email: invalid@email.com
```

### Failure: Duplicate Account
```
[Pump Owner Signup] Retrieved 1 existing signup requests
[Pump Owner Signup] Existing request found with status: pending
```

### Failure: Storage/Error
```
[Pump Owner Signup] ERROR CAUGHT: {specific error message}
[Pump Owner Signup] ERROR STACK: {full stack trace}
[Pump Owner Signup] FULL ERROR OBJECT: [error details]
```

## Key Debugging Points

### 1. **Check Pump Records Exist**
- Logs show "Retrieved X pumps from cookie"
- Should have pump records with assigned emails
- Admin panel `/dashboard/pumps` shows all pumps with owner emails

### 2. **Verify Email Matching**
- Logs show "Available pump emails" list
- Case-insensitive comparison (lowercase)
- Exact email required, no partial matches

### 3. **Check Duplicate Detection**
- Logs show "Retrieved X existing signup requests"
- Only blocks if status is "pending" or "approved"
- Rejected requests allow re-signup

### 4. **Verify Storage Operations**
- Logs show "Saving X total requests to storage"
- Then "Successfully saved request to storage"
- If missing, storage write failed

## Common Issues

### Issue: "Available pump emails" shows empty list
**Cause:** No pumps loaded from Admin panel  
**Fix:** Add pumps from `/dashboard/pumps` page first

### Issue: "No pump found" but email is correct
**Cause:** Case sensitivity or email mismatch  
**Fix:** Check exact email in Admin's pump records, check console logs

### Issue: "Existing request found" on first signup
**Cause:** Leftover signup requests in browser storage  
**Fix:** Clear browser cookies or localStorage and retry

### Issue: "ERROR CAUGHT" with error message
**Cause:** Storage or parsing error  
**Fix:** Check full error stack in logs, identify specific operation that failed

## Admin Approval Workflow

After successful signup:
1. User sees pending approval page at `/auth/signup-pending-approval?type=pump-owner`
2. Admin views pending requests at `/admin/dashboard/pump-owner-requests`
3. Admin can Approve or Reject each request
4. On Approval:
   - Request status set to "approved"
   - Pump owner can login
   - Dashboard shows pump details
5. On Rejection:
   - Request status set to "rejected"
   - Login shows "Account signup was rejected" error

## Testing Checklist

- [ ] Valid email: Signup succeeds, shows pending approval
- [ ] Invalid email: "Not authorized" error shown
- [ ] Duplicate email: "Account already created" error shown
- [ ] Admin approves: Pump owner can login
- [ ] Admin rejects: Login blocked with rejection message
- [ ] Logs show expected messages at each step
- [ ] No generic "An error occurred" messages

## Next Steps

If signup still fails after checking logs:
1. Check browser console (F12) for [User Signup] logs
2. Check server console/logs for [Pump Owner Signup] logs
3. Look for actual error message in ERROR CAUGHT log
4. Verify pump records exist in Admin panel
5. Verify pump owner email matches exactly
