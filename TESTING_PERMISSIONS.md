# Testing Guide: Admin Permission Management System

## System Overview

The permission management system allows admins to:
1. Grant specific features to users
2. Revoke permissions anytime
3. View all granted permissions and audit trail
4. Manage user access to Finance, HR, Operations, and other features

## Files Created

### Core Permission System
- **src/lib/admin/permissions.ts** - Feature definitions and types
- **src/lib/admin/permission-actions.ts** - Grant/revoke logic and storage
- **src/lib/admin/permission-utils.ts** - Utility functions for permission checks

### UI Components
- **src/components/admin/PermissionGrantDialog.tsx** - Form to grant permissions
- **src/components/admin/PermissionsClient.tsx** - Client-side permission management UI
- **src/app/admin/dashboard/permissions/page.tsx** - Admin permissions page

### Hooks & Utilities
- **src/hooks/usePermissions.ts** - Hook for client-side permission checking
- **src/app/api/admin/permissions/route.ts** - API endpoint to fetch permissions

### Documentation
- **PERMISSIONS_GUIDE.md** - Detailed guide and implementation notes
- **src/lib/admin/demo-permissions.ts** - Demo data for testing

## Test Scenarios

### Test 1: Access the Permission Management Page
**Objective**: Verify the permissions page loads and displays correctly

**Steps**:
1. Navigate to admin dashboard
2. Look for "Permission Management" in the left sidebar (under System Management)
3. Click on it
4. Verify you see:
   - "Grant Permission" button
   - "Available Features" table with all 20+ features
   - "Users with Custom Permissions" section

**Expected Result**: ✅ Page loads with all sections visible

### Test 2: Grant Permission to a User
**Objective**: Test the permission grant workflow

**Steps**:
1. On the Permission Management page, click "Grant Permission" button
2. A form appears with three fields:
   - User ID
   - User Email
   - Feature (dropdown)
3. Fill in the form with test data:
   - User ID: `TEST-USR-001`
   - User Email: `testuser@example.com`
   - Feature: Select "View Finance" from the dropdown
4. Click "Grant Permission"
5. Look for a success message

**Expected Result**: 
✅ Success message appears
✅ User appears in "Users with Custom Permissions" section
✅ Permission shows as a badge next to the user

### Test 3: Grant Multiple Permissions to Same User
**Objective**: Verify a user can have multiple permissions

**Steps**:
1. Click "Grant Permission" again
2. Same User ID and Email
3. Select "Manage Finance"
4. Click "Grant Permission"
5. Repeat for "View Reports" and "View Payroll"
6. Find the user in the list
7. Verify all permissions are shown

**Expected Result**:
✅ All 4 permissions appear as badges
✅ User shows in correct order
✅ Each permission is distinct

### Test 4: Grant Permission to Different Users
**Objective**: Test multiple users with different permissions

**Steps**:
1. Grant permissions to:
   - `HR-USER@example.com` (User ID: HR-001): "Manage Employees", "View Payroll"
   - `OPS-USER@example.com` (User ID: OPS-001): "Manage Pumps", "View Fuel Management"
   - `REPORT-USER@example.com` (User ID: RPT-001): "View Reports", "Manage Reports"
2. Verify each user appears in the list
3. Verify each user has correct permissions

**Expected Result**:
✅ Three separate user cards appear
✅ Each has their specific permissions
✅ Permissions are grouped correctly

### Test 5: Check Feature Statistics
**Objective**: Verify the feature table shows correct permission counts

**Steps**:
1. Look at "Available Features" table
2. For "View Finance", check "Users Granted" column
3. Should show 2 (TEST-USR-001 and HR-USER from previous tests)
4. For "Manage Employees", should show 1 (HR-001)
5. For "Manage Pumps", should show 1 (OPS-001)

**Expected Result**:
✅ All feature counts match the granted permissions
✅ Features with no users show 0

### Test 6: Revoke a Permission
**Objective**: Test the permission revocation workflow

**Steps**:
1. Find a user with multiple permissions (TEST-USR-001)
2. Hover over one of the permission badges (e.g., "View Finance")
3. An × button appears on the badge
4. Click the × button
5. A confirmation dialog may appear
6. Confirm revocation

**Expected Result**:
✅ Permission is immediately removed
✅ Badge disappears
✅ Success message appears
✅ Feature count in table decreases by 1

### Test 7: Revoke All Permissions for a User
**Objective**: Test what happens when all permissions are revoked

**Steps**:
1. Find TEST-USR-001 in the list
2. Revoke all remaining permissions one by one
3. After revoking the last permission, the user card should disappear

**Expected Result**:
✅ User completely removed from "Users with Custom Permissions" section
✅ "Users with Custom Permissions" section updates accordingly

### Test 8: Permission Feature Coverage
**Objective**: Verify all feature categories are present

**Steps**:
1. Look at "Available Features" table
2. Scroll through all features
3. Verify these categories exist:
   - Core (View Dashboard)
   - Administration (Manage Roles, Users, Permissions, etc.)
   - Finance (View/Manage Finance, Payroll, etc.)
   - Reports (View/Manage Reports)
   - Operations (View/Manage Pumps, Fuel Management)
   - HR (View/Manage Employees)
   - Logistics (View/Manage Tankers)

**Expected Result**:
✅ All 7 categories represented
✅ At least 20 features total
✅ Each feature has clear name and description

### Test 9: Browser Data Persistence
**Objective**: Verify permissions persist across page reloads

**Steps**:
1. Grant a new permission to a test user
2. Refresh the page (F5)
3. Check if the granted permission still appears

**Expected Result**:
✅ Permission persists after refresh
✅ User and their permissions remain in the list

### Test 10: Error Handling - Duplicate Permission
**Objective**: Test the system doesn't allow duplicate permissions

**Steps**:
1. Try to grant the same permission twice to the same user
2. Fill form with:
   - User ID: `DUP-USR-001`
   - Email: `dupuser@example.com`
   - Feature: "View Finance"
3. Click "Grant Permission"
4. Try to grant "View Finance" again to same user
5. Check for error message

**Expected Result**:
✅ First grant succeeds
✅ Second grant shows error: "Permission already granted"
✅ No duplicate permission is created

### Test 11: Data Format Validation
**Objective**: Test form validation

**Steps**:
1. Try to grant permission without filling User ID - submit
2. Try to grant without filling email - submit
3. Try to grant without selecting feature - submit
4. Fill all fields correctly and submit

**Expected Result**:
✅ Empty fields show error message: "Please fill in all fields"
✅ Correctly filled form submits successfully

### Test 12: Permission Categories Display
**Objective**: Verify feature grouping in dropdown

**Steps**:
1. Click "Grant Permission"
2. Click on the Feature dropdown
3. Verify features are organized by category:
   - Core
   - Administration
   - Finance
   - Reports
   - Operations
   - HR
   - Logistics

**Expected Result**:
✅ Dropdown shows all categories as optgroups
✅ Features grouped under correct category
✅ Each feature shows full name and description

## Performance Tests

### Test 13: Large Number of Permissions
**Objective**: Test system performance with many permissions

**Steps**:
1. Grant 50+ permissions to various users
2. Navigate to permissions page
3. Scroll through the user list
4. Check page responsiveness

**Expected Result**:
✅ Page loads within 2 seconds
✅ Scrolling is smooth
✅ All permissions display correctly
✅ Grant/revoke still works smoothly

## Integration Tests

### Test 14: Permission Audit Trail
**Objective**: Verify permission grant history is tracked

**Steps**:
1. Grant a permission
2. Hover over the permission badge
3. Check if it shows when it was granted and by whom

**Expected Result**:
✅ Timestamp is visible (e.g., "Granted: 09/15/2026")
✅ Admin info is shown in the user card
✅ Each grant has complete audit info

## Admin Navigation

### Test 15: Permission Management Link
**Objective**: Verify admin sidebar shows the permission management link

**Steps**:
1. Login to admin panel
2. Look at left sidebar
3. Under "System Management" section, look for "Permission Management"
4. Click the link

**Expected Result**:
✅ Link is visible in sidebar
✅ It's grouped under System Management
✅ Clicking navigates to permissions page
✅ Navigation link highlights when on permissions page

## User Scenario Testing

### Scenario 1: Finance Manager Gets Additional Reports Access
**Setup**: Finance Manager needs access to View Reports

**Steps**:
1. Admin navigates to Permission Management
2. Clicks "Grant Permission"
3. Enters:
   - User ID: `FIN-MGR-001`
   - Email: `finance-manager@company.com`
   - Feature: "View Reports"
4. Click "Grant Permission"

**Verification**:
- Finance Manager appears in custom permissions
- They have "View Reports" badge
- Feature table shows increased count for "View Reports"

### Scenario 2: HR Manager Gets Finance Access for Payroll Review
**Setup**: HR Manager needs to review payroll payments

**Steps**:
1. Admin grants:
   - "View Finance" to `HR-MGR-001`
   - "View Payroll" (already have, verify shown)
2. Grant "View Reports" as well

**Verification**:
- HR Manager now has 3 permissions
- All badges display correctly
- Finance feature shows 2 users have access

### Scenario 3: Temporary Manager Gets Full Access Then Partial Revoke
**Setup**: Temp Manager needs access then restrictions

**Steps**:
1. Grant "Manage Finance", "Manage Employees", "Manage Pumps"
2. Verify all appear
3. Later, revoke "Manage Finance" and "Manage Employees"
4. Keep only "Manage Pumps"

**Verification**:
- Temp Manager still appears with only "Manage Pumps"
- Revoked permissions are gone
- Feature counts update correctly

## Troubleshooting Tests

### Test 16: Clear Browser Cache
**Objective**: Ensure system works after cache clear

**Steps**:
1. Grant several permissions
2. Open DevTools (F12)
3. Go to Application > Cookies
4. Delete `petromanage_user_permissions` and `petromanage_permission_grants`
5. Refresh page

**Expected Result**:
- All permissions disappear (as they're stored in cookies)
- "Users with Custom Permissions" section is empty
- Feature counts all show 0

### Test 17: Grant After Cache Clear
**Objective**: Test fresh grant after cleared data

**Steps**:
1. After cache clear, grant a new permission
2. Check if it appears
3. Refresh page
4. Verify it persists

**Expected Result**:
✅ New cookies are created
✅ Permission persists after refresh
✅ System works normally

## Success Criteria

All tests pass if:
- ✅ Permission page loads and displays correctly
- ✅ Can grant permissions to users
- ✅ Can grant multiple permissions to same user
- ✅ Can revoke permissions
- ✅ Feature counts update correctly
- ✅ Data persists across refreshes
- ✅ Errors are handled gracefully
- ✅ UI is responsive
- ✅ Navigation works correctly
- ✅ Audit trail is present

## Quick Test Checklist

- [ ] Permission page accessible from admin sidebar
- [ ] Can grant permission successfully
- [ ] Can grant multiple permissions
- [ ] Can revoke permissions
- [ ] Feature statistics update
- [ ] Data persists on refresh
- [ ] Error handling works
- [ ] No console errors
- [ ] Mobile-friendly (test on phone width)
- [ ] All feature categories present

## Notes for Future Development

1. **Database Migration**: Currently uses cookies. Migrate to PostgreSQL/MongoDB for production
2. **Role-Based Permissions**: Add ability to grant permissions to entire roles
3. **Permission Templates**: Create preset permission bundles
4. **Expiring Permissions**: Add expiration dates for temporary access
5. **Approval Workflow**: Require approval for certain permission grants
6. **Bulk Operations**: Grant/revoke permissions to multiple users at once
