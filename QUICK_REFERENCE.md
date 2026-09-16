# QUICK REFERENCE - MongoDB & Admin Panel

## Environment Setup
- .env.local: MONGODB_URI=mongodb://localhost:27017/petromanage

## Startup
1. Start MongoDB: net start MongoDB
2. npm run dev
3. Visit http://localhost:3000/api/init (initialize database)

## Admin URLs
- Pump Management: http://localhost:3000/admin/dashboard/pumps
- Employee Management: http://localhost:3000/admin/dashboard/employees
- Pump Owner Approvals: http://localhost:3000/admin/dashboard/pump-owner-requests
- Employee Approvals: http://localhost:3000/admin/dashboard/signup-requests

## API Endpoints
- POST   /api/admin/pumps
- GET    /api/admin/pumps
- DELETE /api/admin/pumps?pumpId=X
- POST   /api/admin/employees
- GET    /api/admin/employees
- DELETE /api/admin/employees?employeeId=X
- GET    /api/admin/approval-requests?pending=true
- PATCH  /api/admin/approval-requests/[id]

## Database Collections
- pumps: Pump stations with owner emails
- employees: Company employees with roles
- users: Login accounts with approval status
- approval_requests: Pending signup requests

## Testing Flow
1. Add pump with email: testowner@example.com
2. Signup as Pump Owner with that email
3. Admin approves request
4. Login works with approved status

## Key Files
Database: src/lib/db/*.ts
APIs: src/app/api/admin/*.ts
Admin UI: src/app/admin/(dashboard)/pumps/page.tsx
         src/app/admin/(dashboard)/employees/page.tsx
Signup: src/lib/pump-owner/signup-actions.ts
        src/lib/employee/signup-actions.ts

## Troubleshooting
- MongoDB not starting: net start MongoDB
- Connection error: Check MONGODB_URI in .env.local
- Database init error: Visit http://localhost:3000/api/init
- Port 27017 in use: Change MongoDB port or kill existing process
