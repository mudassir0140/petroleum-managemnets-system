# Admin Permission Management System

## Overview

The Admin Permission Management System allows administrators to grant specific feature access to users beyond their base role. This enables fine-grained control over which features different users can access in the dashboard.

## Key Features

1. **Feature-Based Permissions**: Define granular permissions across different system features (Finance, Payroll, Reports, Pumps, Employees, etc.)
2. **Role-Based Defaults**: Users have base permissions from their role, which can be extended with custom permissions
3. **User-Specific Grants**: Admins can grant/revoke specific features to individual users
4. **Permission Audit Trail**: Track who granted permissions and when
5. **Real-Time Management**: Grant and revoke permissions instantly through the admin dashboard

## Available Features

### Core
- `view-dashboard`: Access to admin dashboard overview

### Administration  
- `manage-roles`: View and manage company roles
- `manage-users`: Create, edit, and manage user accounts
- `manage-permissions`: Grant and revoke permissions to users
- `view-pump-owners`: View pump owner information
- `manage-pump-owners`: Manage pump owner accounts

### Finance
- `view-finance`: Access financial data and reports
- `manage-finance`: Create and modify financial transactions
- `view-payroll`: View payroll information
- `manage-payroll`: Create and process payroll

### Reports
- `view-reports`: Access system reports
- `manage-reports`: Create and manage custom reports

### Operations
- `view-pumps`: View pump information
- `manage-pumps`: Create, edit, and manage pumps
- `view-fuel-management`: View fuel stock and distribution
- `manage-fuel-management`: Manage fuel stock and distribution

### HR
- `view-employees`: View employee records
- `manage-employees`: Create and manage employee records

### Logistics
- `view-tankers`: View tanker fleet information
- `manage-tankers`: Manage tanker fleet

## How to Use

### Granting Permissions

1. Navigate to **Admin Dashboard > Permission Management**
2. Click **Grant Permission** button
3. Fill in the form:
   - **User ID**: The unique identifier of the user (e.g., USR-001)
   - **User Email**: The email address of the user
   - **Feature**: Select the feature/permission to grant
4. Click **Grant Permission**
5. The user can now access the granted feature

### Revoking Permissions

1. In the **Permission Management** page, find the user in the "Users with Custom Permissions" section
2. Hover over the permission badge you want to remove
3. Click the **×** button to revoke
4. Confirm the action
5. The permission is immediately revoked

### Viewing Permission Details

- **Available Features Table**: Shows all system features and how many users have access to each
- **Users with Custom Permissions**: Lists all users who have been granted additional permissions beyond their base role

## Testing the System

### Demo Users

Three demo users are provided with sample permissions:

1. **finance-manager@petromanage.demo** (USR-001)
   - Base Role: Finance Manager
   - Additional Permissions:
     - View Finance
     - Manage Finance
     - View/Manage Payroll
     - View Reports

2. **company-manager@petromanage.demo** (USR-002)
   - Base Role: Company Manager
   - Additional Permissions:
     - View Dashboard
     - Manage Pumps
     - Manage Employees
     - View Reports
     - View Finance

3. **pump-manager@petromanage.demo** (USR-003)
   - Base Role: Pump Manager
   - Additional Permissions:
     - View Dashboard
     - View Pumps
     - Manage Employees

### Test Scenarios

#### Scenario 1: Grant Finance Access to HR Manager
1. Go to Permission Management page
2. Click "Grant Permission"
3. Enter:
   - User ID: `USR-004`
   - User Email: `hr-manager@petromanage.demo`
   - Feature: `View Finance`
4. Click "Grant Permission"
5. Verify the user appears in the "Users with Custom Permissions" section
6. Verify they have the "View Finance" badge

#### Scenario 2: Grant Multiple Permissions
1. Repeat the grant process for the same user with:
   - `Manage Finance`
   - `View Payroll`
   - `View Reports`
2. Verify all permissions are shown under the user

#### Scenario 3: Revoke a Permission
1. Find the user with multiple permissions
2. Hover over a permission badge
3. Click the × button
4. Confirm the revocation
5. Verify the permission is removed from the list

#### Scenario 4: Check Feature Distribution
1. Look at the "Available Features" table
2. Note which features have the most users granted
3. This helps understand which permissions are most commonly assigned

## Implementation Details

### Data Storage

Permissions are currently stored in browser cookies for demo purposes:
- `petromanage_user_permissions`: Stores user permission mappings
- `petromanage_permission_grants`: Stores the audit trail of permission grants

**Note**: In production, this should be migrated to a database (PostgreSQL, MongoDB, etc.)

### Permission Checking

Permissions are checked using the `usePermissions` hook on the client side:

```typescript
import { usePermissions } from "@/hooks/usePermissions";

export function MyComponent() {
  const { hasPermission, getUserPermissions } = usePermissions();
  
  const userHasFinanceAccess = hasPermission("user-id", "manage-finance");
  
  if (!userHasFinanceAccess) {
    return <div>You don't have permission to access this feature</div>;
  }
  
  return <FinanceComponent />;
}
```

### Permission Utilities

Use `permission-utils.ts` for common permission operations:

```typescript
import { canAccessFeature, getAccessibleFeatures, groupFeaturesByCategory } from "@/lib/admin/permission-utils";

// Check if user can access a feature
const canAccess = canAccessFeature(userPermissions, "manage-finance");

// Get all accessible features
const features = getAccessibleFeatures(userPermissions);

// Group by category
const grouped = groupFeaturesByCategory(userPermissions);
```

## Integration with Dashboards

To restrict dashboard access based on permissions:

1. Use the `usePermissions` hook in dashboard components
2. Check permissions before rendering sensitive features
3. Display permission-denied messages for restricted features
4. Update navigation items based on user permissions

Example:

```typescript
import { usePermissions } from "@/hooks/usePermissions";

export function DashboardNav({ userId }) {
  const { hasPermission } = usePermissions();
  
  return (
    <nav>
      {hasPermission(userId, "view-finance") && (
        <Link href="/dashboard/finance">Finance</Link>
      )}
      {hasPermission(userId, "manage-employees") && (
        <Link href="/dashboard/employees">Employees</Link>
      )}
    </nav>
  );
}
```

## API Endpoints

### Get All Permissions
```
GET /api/admin/permissions
```

Returns an array of all user permissions.

## Future Enhancements

1. **Role-Based Permissions**: Define permission sets for roles instead of individual users
2. **Permission Expiry**: Set expiration dates for temporary permission grants
3. **Approval Workflow**: Require approval for certain permissions
4. **Permission History**: View full history of permission changes
5. **Bulk Operations**: Grant/revoke permissions to multiple users at once
6. **Permission Templates**: Create reusable permission templates for common role combinations

## Troubleshooting

### Permissions Not Showing
- Clear browser cookies: `petromanage_user_permissions` and `petromanage_permission_grants`
- Refresh the page
- Check the browser console for errors

### Permission Revoke Not Working
- Ensure you have admin privileges
- Check if the permission grant actually exists
- Try refreshing the page

### Users Not Appearing
- Verify the User ID is correct
- Ensure the user email is valid
- Check browser console for error messages

## Security Considerations

1. **Admin-Only Access**: Permission management is restricted to admin accounts
2. **Permission Validation**: Always validate permissions on the server side
3. **Audit Trail**: All permission changes are logged with admin info and timestamp
4. **Production Migration**: Switch to database storage with proper encryption for production

## Contact

For questions or issues with the permission management system, please contact the development team.
