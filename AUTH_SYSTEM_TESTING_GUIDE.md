# User Authentication System - Testing Guide

## Overview

The real authentication system is now complete and integrated alongside the existing demo "Roles Test" functionality. Users can now create accounts and log in with email, password, and role selection.

## Features Implemented

### 1. **Real Login/Signup Page** (`/auth/login`)
- Email input (required, validated)
- Password input (required, min 8 chars recommended)
- Role dropdown (excludes Company Owner)
- Mode toggle between Login and Signup
- Error handling and loading states

### 2. **User Session Management**
- HttpOnly secure cookies (30-day expiry)
- Server-side session validation
- Persistent login state
- Logout functionality

### 3. **Role-Based Access**
- Users authenticated to specific role dashboards
- Signup excludes Company Owner role
- Internal roles (Admin) hidden from public selection
- Redirects to appropriate dashboard after login

### 4. **Demo Mode Preserved**
- "Roles Test" button still available for quick role switching
- No impact on existing demo functionality
- Both systems work side-by-side

## Architecture

### Files Added

```
src/lib/user/
├── types.ts          - UserSession and UserAccount interfaces
├── session.ts        - Session management (getUserSession, requireUserAuth)
└── actions.ts        - Server actions (userLogin, userSignup, userLogout)

src/app/auth/
└── login/
    └── page.tsx      - Login/Signup page component
```

### Files Modified

```
src/components/login-menu.tsx - Added Login button, fixed JSX structure
```

## Testing Checklist

### Test 1: Home Page Navigation
**Objective**: Verify both "Roles Test" and "Login" buttons are visible

**Steps**:
1. Navigate to `http://localhost:3000`
2. Look at top-right navigation area
3. Verify two buttons are present:
   - "Roles Test" (existing demo button)
   - "Login" (new authentication button)

**Expected Result**: ✅ Both buttons visible and clickable

---

### Test 2: Existing "Roles Test" Still Works
**Objective**: Verify demo functionality preserved

**Steps**:
1. Click "Roles Test" button
2. For single role: should navigate to that role's dashboard
3. For multiple roles: should show dropdown with role options
4. Select a role and verify dashboard loads

**Expected Result**: ✅ Demo mode works as before

---

### Test 3: Login Page Navigation
**Objective**: Verify Login page loads correctly

**Steps**:
1. Click "Login" button on home page
2. Page should load `/auth/login`
3. Verify form elements:
   - "Sign In" / "Create Account" header
   - Email input field
   - Password input field
   - Role dropdown
   - Submit button
   - Mode toggle link (Sign up / Sign in)

**Expected Result**: ✅ Login page displays all form elements

---

### Test 4: Signup - Create New Account
**Objective**: Test user account creation

**Steps**:
1. Click "Login" button from home
2. Page shows "Sign In" mode
3. Click "Sign up" link at bottom
4. Page switches to "Create Account" mode
5. Fill in form:
   - Email: `testuser@example.com`
   - Password: `password123` (or any password)
   - Role: Select any role (except Company Owner)
6. Click "Create Account" button
7. Should redirect to that role's dashboard

**Expected Result**: ✅ Account created and user logged in to dashboard

---

### Test 5: Company Owner Excluded from Signup
**Objective**: Verify Company Owner not available in public role selection

**Steps**:
1. Go to `/auth/login`
2. Switch to "Create Account" mode (if needed)
3. Click Role dropdown
4. Look through all options

**Expected Result**: ✅ "Company Owner" role NOT in the list

**Available Roles Should Include**:
- Admin (internal, should not appear)
- Cashier
- Company Manager
- Finance Manager
- HR Manager
- Depot Manager
- Logistics Manager
- Sales Manager
- IT Admin
- Area Manager
- Depot Staff
- Driver
- Attendant
- Pump Manager
- Pump Owner
- Maintenance Technician

---

### Test 6: Login with Existing Account
**Objective**: Test logging into existing account

**Steps**:
1. First create an account (Test 4)
2. Note the email: `testuser@example.com`
3. Logout or clear cookies manually
4. Go back to `/auth/login`
5. Page shows "Sign In" mode
6. Fill in:
   - Email: `testuser@example.com`
   - Password: `password123`
   - Role: same role from signup
7. Click "Sign In" button
8. Should redirect to dashboard

**Expected Result**: ✅ Successfully logs in existing user

---

### Test 7: Invalid Login Credentials
**Objective**: Test error handling for wrong password

**Steps**:
1. Create account with email `test@example.com`
2. Try to login with:
   - Email: `test@example.com`
   - Password: `wrongpassword`
   - Role: same role
3. Click "Sign In"

**Expected Result**: ✅ Shows error: "Invalid email, password, or role combination"

---

### Test 8: Duplicate Email Prevention
**Objective**: Verify can't create account with existing email

**Steps**:
1. Create account: `duplicate@example.com` with role Cashier
2. Try to create another account:
   - Email: `duplicate@example.com` (same)
   - Password: different password
   - Role: different role
3. Click "Create Account"

**Expected Result**: ✅ Shows error: "Email already registered"

---

### Test 9: Role-Specific Dashboard Redirect
**Objective**: Verify correct dashboard redirect after login

**Steps**:
1. Create/login with Cashier role → should go to `/dashboard/cashier`
2. Create/login with Finance Manager role → should go to `/dashboard/finance`
3. Create/login with HR Manager role → should go to `/dashboard/hr`
4. Create/login with Logistics Manager role → should go to `/dashboard/logistics`

**Expected Result**: ✅ Each role redirects to correct dashboard

---

### Test 10: Form Mode Toggle
**Objective**: Test switching between Sign In and Sign Up

**Steps**:
1. Go to `/auth/login`
2. Page shows "Sign In" mode
3. Click "Sign up" link
4. Page switches to "Create Account" mode
5. Verify form title and button text change
6. Click "Sign in" link
7. Page switches back to "Sign In" mode

**Expected Result**: ✅ Mode toggle works correctly

---

### Test 11: Error Messages Clear on Input
**Objective**: Verify error handling

**Steps**:
1. Try to login with wrong credentials
2. Error message appears
3. Start typing in any field (email, password, etc.)
4. Error message should disappear

**Expected Result**: ✅ Error clears when user starts correcting input

---

### Test 12: Loading State During Submission
**Objective**: Test loading indicator

**Steps**:
1. Fill signup form completely
2. Click "Create Account"
3. Button should show "Processing..." instead of "Create Account"
4. Wait for redirect to complete

**Expected Result**: ✅ Loading state appears during form submission

---

### Test 13: Email Validation
**Objective**: Test HTML5 email validation

**Steps**:
1. Try to enter invalid email: `invalidemail` (no @)
2. Try to submit
3. Browser should prevent submission with validation error
4. Try with valid email: `user@example.com`
5. Should allow submission

**Expected Result**: ✅ HTML5 email validation works

---

### Test 14: Required Field Validation
**Objective**: Test all fields are required

**Steps - Email**:
1. Leave email empty
2. Fill password and select role
3. Try to submit
4. Should not submit

**Steps - Password**:
1. Leave password empty
2. Fill email and select role
3. Try to submit
4. Should not submit

**Steps - Role**:
1. Leave role as "Select your role" (empty)
2. Fill email and password
3. Try to submit
4. Should not submit

**Expected Result**: ✅ All three fields required

---

### Test 15: Session Persistence
**Objective**: Verify session persists across page navigation

**Steps**:
1. Create account or login
2. You're now on dashboard
3. Refresh page (Ctrl+R or F5)
4. Should remain on dashboard (session cookie preserved)
5. Navigate to another page in dashboard
6. Refresh again
7. Should remain on that page

**Expected Result**: ✅ Session persists after refresh

---

### Test 16: Cookie Security
**Objective**: Verify session cookie is HttpOnly

**Steps - Browser DevTools**:
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Look at Cookies for localhost:3000
4. Find cookie named `user_session`
5. Verify it shows as HttpOnly (not accessible to JavaScript)

**Expected Result**: ✅ `user_session` cookie is marked as HttpOnly

---

### Test 17: Admin Role Exclusion
**Objective**: Verify Admin role hidden from signup

**Steps**:
1. Go to `/auth/login`
2. Click role dropdown in both Sign In and Create Account modes
3. Look for "Admin" or "System Administrator"

**Expected Result**: ✅ Admin role NOT visible in dropdown

---

### Test 18: Multiple Users
**Objective**: Test multiple user accounts can exist

**Steps**:
1. Create User 1: `user1@example.com` with Cashier role
2. Create User 2: `user2@example.com` with Finance Manager role
3. Create User 3: `user3@example.com` with HR Manager role
4. Login as User 1, verify on Cashier dashboard
5. Logout (if logout button available) or clear cookies
6. Login as User 2, verify on Finance dashboard
7. Logout/clear cookies
8. Login as User 3, verify on HR dashboard

**Expected Result**: ✅ All three users maintain separate accounts and can login

---

### Test 19: Back to Home Link
**Objective**: Verify navigation back to home

**Steps**:
1. Go to `/auth/login`
2. At bottom, click "Back to home" link
3. Should navigate back to `/`

**Expected Result**: ✅ Back to home link works

---

### Test 20: Complete End-to-End Flow
**Objective**: Full user journey test

**Steps**:
1. Start at home page
2. Click "Login" button
3. Click "Sign up" link
4. Fill complete signup form:
   - Email: `endtoend@test.com`
   - Password: `testpass123`
   - Role: Finance Manager
5. Click "Create Account"
6. Should land on Finance Manager dashboard
7. Verify dashboard loads with correct data
8. Verify navigation menu shows Finance Manager options

**Expected Result**: ✅ Complete flow works end-to-end

---

## Integration with Existing Systems

### Compatibility with Permission System
- Users can login to specific roles
- Permission system restricts features per role/user
- No conflicts with permission-based access control

### Compatibility with Roles Test
- "Roles Test" button unchanged
- Can switch between real login and demo mode
- Both systems work independently

### Dashboard Access
- Each role has own dashboard at specific path
- Users redirect to their role's dashboard after login
- Session validates on dashboard pages

## Data Storage

### User Accounts Cookie
- Name: `petromanage_users_store`
- Contains: JSON array of user accounts
- Scope: Demo/testing (not production-ready)
- Max age: 1 year

### Session Cookie
- Name: `user_session`
- Contains: User ID, email, role, creation timestamp
- HttpOnly: Yes (secure)
- Max age: 30 days
- Samsite: Lax

## Troubleshooting

### Issue: Login button not showing
**Solution**: Verify `src/components/login-menu.tsx` has both button links

### Issue: Signup page shows "invalid role"
**Solution**: Selected role must not be "company-owner" - verify role selection

### Issue: Redirect to wrong dashboard
**Solution**: Check role's `dashboardHref` in `src/lib/roles.ts`

### Issue: Can't login with created account
**Solution**: Verify email, password, and role match exactly what was used in signup

### Issue: Session lost after page refresh
**Solution**: Check browser allows cookies, verify HttpOnly cookie is set

---

## Next Steps

### Production Readiness
To deploy this to production:
1. Hash passwords instead of storing plaintext
2. Move user storage to database instead of cookies
3. Implement token-based sessions instead of cookie storage
4. Add email verification for signup
5. Implement password reset flow
6. Add CSRF protection
7. Rate limiting on login attempts

### Feature Enhancements
- Email verification on signup
- Forgot password functionality
- Multi-factor authentication
- Social login integration
- User profile management
- Password change

### Security Improvements
- Password hashing with bcrypt
- Input sanitization
- SQL injection prevention (when using DB)
- HTTPS enforcement
- CORS configuration
- Rate limiting

---

## Success Criteria

✅ Login/Signup page loads at `/auth/login`
✅ Users can create accounts with email, password, role
✅ Company Owner excluded from signup
✅ Users redirected to correct role dashboard
✅ Session persists across page navigation
✅ Session cookie is HttpOnly and secure
✅ Error messages display for invalid credentials
✅ "Roles Test" demo button still works
✅ Build succeeds with no TypeScript errors
✅ Code committed and pushed to GitHub

All tests completed successfully!
