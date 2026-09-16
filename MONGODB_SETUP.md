# MongoDB Setup Guide

This guide walks you through setting up MongoDB locally for the PetroManage system.

## Prerequisites

- Windows 10/11
- MongoDB Community Edition (download from https://www.mongodb.com/try/download/community)

## Installation Steps

### 1. Install MongoDB

1. Download MongoDB Community Edition for Windows
2. Run the installer and follow the default installation steps
3. MongoDB will be installed in `C:\Program Files\MongoDB\Server\<version>`

### 2. Start MongoDB Service

**Option A: Using Windows Service (Recommended)**

MongoDB should be installed as a Windows service automatically. To start it:

```powershell
# Start the MongoDB service
net start MongoDB

# To stop it later:
net stop MongoDB

# To check if it's running:
Get-Service -Name MongoDB | Select-Object Status, Name
```

**Option B: Using Command Line**

Open PowerShell and run:

```powershell
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

## Initialize Database

Once MongoDB is running:

### 1. Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000/api/init in your browser. You should see:

```json
{
  "success": true,
  "message": "Database initialized successfully",
  "collections": ["pumps", "employees", "users", "approval_requests"]
}
```

If you get an error, make sure MongoDB is running!

## Admin Signup & Testing

### Access Admin Panel

1. Navigate to: http://localhost:3000/admin
2. You'll be directed to admin login

### Create Test Data

1. Go to http://localhost:3000/admin/dashboard/pumps
2. Add a test pump:
   - **Pump Name**: Test Pump 1
   - **Owner Name**: John Doe
   - **Owner Email**: testowner@example.com
   - **Owner Phone**: 03001234567
   - **Address**: 123 Main St
   - **City**: Karachi
   - **Petrol Capacity**: 1000
   - **Diesel Capacity**: 1000

3. Go to http://localhost:3000/admin/dashboard/employees
4. Add a test employee:
   - **Full Name**: Jane Smith
   - **Email**: janesmith@company.com
   - **Phone**: 03009876543
   - **Role**: Company Manager

## Test Pump Owner Flow

### 1. Try to Sign Up as Pump Owner

1. Go to http://localhost:3000/login
2. Click on "Pump-level roles" section
3. Select "Pump Owner" role
4. Try signing up with email: `testowner@example.com`
5. You should see: "Signup request created successfully!"

### 2. Admin Approves the Request

1. Go to http://localhost:3000/admin/dashboard/pump-owner-requests
2. Review the pending request from `testowner@example.com`
3. Click "Approve" button
4. Status should change to "approved"

### 3. Login as Approved Pump Owner

1. Go to http://localhost:3000/login
2. Login with:
   - **Email**: testowner@example.com
   - **Password**: (any password, demo mode accepts anything)
3. You should be redirected to pump owner dashboard

## Test Employee Flow

### 1. Try to Sign Up as Employee

1. Go to http://localhost:3000/login
2. Click on "Pump-level roles" section
3. Try signing up as "Company Manager" with email: `janesmith@company.com`
4. You should see: "Signup request created successfully!"

### 2. Admin Approves the Request

1. Go to http://localhost:3000/admin/dashboard/signup-requests
2. Review the pending request from `janesmith@company.com`
3. Click "Approve" button
4. Status should change to "approved"

### 3. Login as Approved Employee

1. Go to http://localhost:3000/login
2. Login with:
   - **Email**: janesmith@company.com
   - **Password**: (any password)
3. You should be redirected to company manager dashboard

## Troubleshooting

### MongoDB Service Not Starting

```powershell
# Check if MongoDB is installed
Get-ChildItem "C:\Program Files\MongoDB"

# Reinstall the service:
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --install

# Start the service:
net start MongoDB
```

### Connection Error

Make sure:
1. MongoDB is running (`mongod` process should be active)
2. `.env.local` file exists with: `MONGODB_URI=mongodb://localhost:27017/petromanage`
3. Port 27017 is not blocked by firewall

### Database Not Initialized

Visit http://localhost:3000/api/init again to reinitialize the database

## Database File Location

MongoDB stores data at:
```
C:\Program Files\MongoDB\Server\7.0\data\db
```

You can backup or move this directory to preserve your data.

## Stopping MongoDB

```powershell
net stop MongoDB
```

Or kill the process using Task Manager if needed.
