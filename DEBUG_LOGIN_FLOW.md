# Debugging Pump Owner Login Flow

## Quick Debug Steps

### 1. Clear All Data and Start Fresh
```javascript
// In browser console, run:
localStorage.clear();
console.log("localStorage cleared");
```

### 2. Create a Pump from /dashboard/pumps

1. Navigate to http://localhost:3000/dashboard/pumps
2. Click "Add New Pump"
3. Fill in:
   - Pump Name: `TestPump`
   - Company Name: `TestCo`
   - Owner Name: `TestUser`
   - Password: `Test123!`
   - City: `Karachi`
4. Click "Add Pump"

### 3. Verify Pump Was Saved

```javascript
// In browser console, run:
const pumps = JSON.parse(localStorage.getItem("petromanage:pumps"));
console.log("Number of pumps:", pumps.length);
console.log("Last pump:", JSON.stringify(pumps[pumps.length - 1], null, 2));
```

**Expected output:**
```
Number of pumps: 1
Last pump: {
  id: "PUMP-01",
  name: "TestPump",
  owner: "TestUser",
  ownerEmail: "testuser@testpumptgmail.com",
  password: "Test123!",
  role: "pump-owner",
  accountStatus: "Active",
  ...
}
```

### 4. Verify Email Format

```javascript
// In browser console, run:
const pumps = JSON.parse(localStorage.getItem("petromanage:pumps"));
const pump = pumps[pumps.length - 1];
console.log("Email:", pump.ownerEmail);
console.log("Email lowercase:", pump.ownerEmail.toLowerCase());
console.log("Email has spaces?", pump.ownerEmail.includes(" "));
```

**Expected:**
- Email: `testuser@testpumptgmail.com` (all lowercase, no spaces)
- No spaces in email

### 5. Check Password Storage

```javascript
// In browser console, run:
const pumps = JSON.parse(localStorage.getItem("petromanage:pumps"));
const pump = pumps[pumps.length - 1];
console.log("Stored password:", `"${pump.password}"`);
console.log("Password length:", pump.password.length);
console.log("Password bytes:", Array.from(pump.password).map(c => c.charCodeAt(0)));
```

**Check for:**
- Trailing/leading spaces
- Special characters
- Exact match with what you entered

### 6. Test Login Manually in Console

```javascript
// In browser console, run this simulation:
const email = "testuser@testpumptgmail.com";
const password = "Test123!";

const pumpsData = localStorage.getItem("petromanage:pumps");
const pumps = JSON.parse(pumpsData);
const pumpAccount = pumps.find(p => 
  p.ownerEmail?.toLowerCase() === email.toLowerCase()
);

console.log("=== LOGIN TEST ===");
console.log("Email searched for:", email.toLowerCase());
console.log("Pump found?", !!pumpAccount);

if (pumpAccount) {
  console.log("Stored password:", `"${pumpAccount.password}"`);
  console.log("Entered password:", `"${password}"`);
  console.log("Passwords match?", pumpAccount.password === password);
  console.log("Account status:", pumpAccount.accountStatus);
  console.log("Role:", pumpAccount.role);
} else {
  console.log("Available pump emails:");
  pumps.forEach((p, i) => {
    console.log(`  [${i}] ${p.ownerEmail}`);
  });
}
```

### 7. Navigate to Login and Check Console

1. Navigate to http://localhost:3000/auth/login
2. Open DevTools Console (F12 → Console tab)
3. Enter email: `testuser@testpumptgmail.com`
4. Enter password: `Test123!`
5. Click "Sign In"
6. Check console for debug messages starting with `[LOGIN DEBUG]`

**Look for messages like:**
```
[LOGIN DEBUG] Pumps data exists: true
[LOGIN DEBUG] Total pumps found: 1
[LOGIN DEBUG] Email searching for (lowercased): testuser@testpumptgmail.com
[LOGIN DEBUG] Available pump emails: ['testuser@testpumptgmail.com']
[LOGIN DEBUG] Pump account found: true
[LOGIN DEBUG] Stored password: "Test123!"
[LOGIN DEBUG] Entered password: "Test123!"
[LOGIN DEBUG] Passwords match: true
```

## If Login Fails

### Symptom: "Pumps data exists: false"
- **Problem**: localStorage["petromanage:pumps"] doesn't exist
- **Solution**: Make sure you created a pump first. Check localStorage keys in DevTools.

### Symptom: "Pump account found: false"
- **Problem**: Email is not being found
- **Causes**:
  - Email has trailing spaces: `"testuser@testpumptgmail.com "`
  - Email has different casing issue (shouldn't happen but check)
  - No pumps saved yet
- **Debug**:
  ```javascript
  const pumps = JSON.parse(localStorage.getItem("petromanage:pumps"));
  console.log("Pump emails:", pumps.map(p => p.ownerEmail));
  console.log("Your email lowercase:", "testuser@testpumptgmail.com".toLowerCase());
  ```

### Symptom: "Passwords match: false"
- **Problem**: Password stored ≠ password entered
- **Causes**:
  - Password has trailing/leading spaces
  - Special characters not being saved correctly
  - Password entered with CAPS LOCK on
- **Debug**:
  ```javascript
  const pump = JSON.parse(localStorage.getItem("petromanage:pumps"))[0];
  console.log("Stored:", JSON.stringify(pump.password));
  console.log("Byte codes:", Array.from(pump.password).map(c => c.charCodeAt(0)));
  ```

### Symptom: Login redirects but dashboard shows "Pump information not found"
- **Problem**: Pump created but pump_owner_session or server cookie not set
- **Debug**:
  ```javascript
  console.log("User session:", localStorage.getItem("user-session"));
  console.log("Pump owner session:", localStorage.getItem("pump_owner_session"));
  ```

### Symptom: All debug messages show success but still get error
- **Problem**: Redirect didn't happen or error occurred after validation
- **Solution**:
  1. Check browser console for JavaScript errors
  2. Check Network tab for failed API calls
  3. Verify server-side cookie is being set (look in Application → Cookies)

## Complete Test Script

Run this entire script in browser console to test the complete flow:

```javascript
// TEST 1: Check if pumps exist
console.log("=== TEST 1: Check localStorage ===");
const pumpsJson = localStorage.getItem("petromanage:pumps");
if (!pumpsJson) {
  console.log("❌ No pumps found. Create one first from /dashboard/pumps");
} else {
  const pumps = JSON.parse(pumpsJson);
  console.log("✅ Found", pumps.length, "pump(s)");
  
  // TEST 2: Email validation
  console.log("\n=== TEST 2: Email Format ===");
  pumps.forEach((p, i) => {
    console.log(`Pump ${i}:`);
    console.log(`  Email: "${p.ownerEmail}"`);
    console.log(`  Has spaces?`, p.ownerEmail.includes(" "));
    console.log(`  All lowercase?`, p.ownerEmail === p.ownerEmail.toLowerCase());
  });
  
  // TEST 3: Password validation
  console.log("\n=== TEST 3: Password Format ===");
  pumps.forEach((p, i) => {
    console.log(`Pump ${i}:`);
    console.log(`  Password: "${p.password}"`);
    console.log(`  Length: ${p.password.length}`);
    console.log(`  Has leading space?`, p.password[0] === " ");
    console.log(`  Has trailing space?`, p.password[p.password.length - 1] === " ");
  });
  
  // TEST 4: Login simulation
  console.log("\n=== TEST 4: Login Simulation ===");
  const firstPump = pumps[0];
  console.log(`Testing login with email: "${firstPump.ownerEmail}"`);
  const found = pumps.find(p => p.ownerEmail?.toLowerCase() === firstPump.ownerEmail.toLowerCase());
  console.log(`Found pump?`, !!found);
  console.log(`Password stored:`, `"${found?.password}"`);
}
```

## Next Steps

1. **Before testing login**, create a pump and run the debug script above
2. **If debug shows issues**, fix the pump creation code
3. **If debug shows success**, manually test login with those exact credentials
4. **If login still fails**, check browser console for [LOGIN DEBUG] messages
5. **Report the exact debug output** to help identify the issue

---

## Email Generation Rules

The email is generated as: `{ownerNameLowercase}@{pumpNameLowercase}gmail.com`

Example:
- Owner: "Muhammad Khan"
- Pump: "Karachi Petrol Station"
- Email: "muhammadkhan@karachipertolstationgmail.com"

Process:
1. Take owner name: "Muhammad Khan"
2. Lowercase: "muhammad khan"
3. Remove spaces: "muhammadkhan"
4. Take pump name: "Karachi Petrol Station"
5. Lowercase: "karachi petrol station"
6. Remove spaces: "karachipetrolstation"
7. Combine: "muhammadkhan@karachipetrolstationgmail.com"

If your email doesn't match this format, check the generateEmail function in `/dashboard/pumps/page.tsx`.
