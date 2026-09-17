/**
 * Manual test for pump owner login flow
 * Run this in browser console on http://localhost:3000/dashboard/pumps
 */

console.log("=== PUMP OWNER LOGIN TEST ===\n");

// Step 1: Create a test pump
console.log("STEP 1: Creating test pump...");
const testPump = {
  id: "PUMP-TEST-001",
  number: 999,
  name: "TestPump",
  owner: "TestOwner",
  ownerEmail: "testowner@testpumptgmail.com",
  password: "TestPass123!",
  role: "pump-owner",
  accountStatus: "Active",
  city: "Karachi",
  address: "Test Street",
  lat: 24.8607,
  lng: 67.0011,
  phone: "03001234567",
  status: "Online",
  since: new Date().toISOString().slice(0, 10),
  lastInspection: new Date().toISOString().slice(0, 10),
  todaySales: [
    { fuelType: "petrol", liters: 0, revenue: 0 },
    { fuelType: "diesel", liters: 0, revenue: 0 }
  ],
  weeklyRevenue: [0, 0, 0, 0, 0, 0, 0],
  monthlySales: 0,
  lastMonthSales: 0,
  petrolStock: 5000,
  petrolCapacity: 10000,
  dieselStock: 4000,
  dieselCapacity: 10000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Save pump to localStorage
const existingPumps = JSON.parse(localStorage.getItem("petromanage:pumps") || "[]");
existingPumps.push(testPump);
localStorage.setItem("petromanage:pumps", JSON.stringify(existingPumps));

console.log("✓ Test pump created and saved to localStorage");
console.log("  Pump ID:", testPump.id);
console.log("  Email:", testPump.ownerEmail);
console.log("  Password:", testPump.password);

// Step 2: Verify pump is saved
console.log("\nSTEP 2: Verifying pump is saved...");
const savedPumps = JSON.parse(localStorage.getItem("petromanage:pumps"));
const savedPump = savedPumps.find(p => p.id === "PUMP-TEST-001");
if (savedPump) {
  console.log("✓ Pump found in localStorage");
  console.log("  Email matches:", savedPump.ownerEmail === testPump.ownerEmail);
  console.log("  Password matches:", savedPump.password === testPump.password);
} else {
  console.log("✗ Pump NOT found in localStorage!");
}

// Step 3: Test email matching (case-insensitive)
console.log("\nSTEP 3: Testing email matching...");
const testEmail = "TESTOWNER@TESTPUMPTGMAIL.COM"; // Different case
const matchingPump = savedPumps.find(p =>
  p.ownerEmail?.toLowerCase() === testEmail.toLowerCase()
);
if (matchingPump) {
  console.log("✓ Email matching works (case-insensitive)");
  console.log("  Found pump:", matchingPump.id);
} else {
  console.log("✗ Email matching FAILED!");
  console.log("  Searched for (lowercase):", testEmail.toLowerCase());
  console.log("  Available emails:", savedPumps.map(p => p.ownerEmail?.toLowerCase()));
}

// Step 4: Test password matching
console.log("\nSTEP 4: Testing password matching...");
if (matchingPump) {
  const passwordMatches = matchingPump.password === testPump.password;
  console.log("  Stored password:", matchingPump.password);
  console.log("  Test password:", testPump.password);
  console.log("  Passwords match:", passwordMatches);
  if (passwordMatches) {
    console.log("✓ Password matching works");
  } else {
    console.log("✗ Password matching FAILED!");
  }
}

// Step 5: Test login simulation
console.log("\nSTEP 5: Simulating login...");
const loginEmail = "testowner@testpumptgmail.com";
const loginPassword = "TestPass123!";

const pumpsData = localStorage.getItem("petromanage:pumps");
const pumps = JSON.parse(pumpsData);
const pumpAccount = pumps.find(p =>
  p.ownerEmail?.toLowerCase() === loginEmail.toLowerCase()
);

if (pumpAccount) {
  console.log("✓ Pump account found");
  if (pumpAccount.password === loginPassword) {
    console.log("✓ Password validated");
    if (pumpAccount.accountStatus === "Active") {
      console.log("✓ Account status is Active");
      console.log("\n✓✓✓ LOGIN SIMULATION SUCCESSFUL ✓✓✓");

      // Create session like login does
      const sessionData = {
        pumpId: pumpAccount.id,
        email: pumpAccount.ownerEmail,
        role: pumpAccount.role,
        status: "active"
      };
      console.log("\nSession that would be created:");
      console.log(JSON.stringify(sessionData, null, 2));
    } else {
      console.log("✗ Account status is not Active:", pumpAccount.accountStatus);
    }
  } else {
    console.log("✗ Password mismatch!");
    console.log("  Stored:", pumpAccount.password);
    console.log("  Entered:", loginPassword);
  }
} else {
  console.log("✗ Pump account NOT found!");
  console.log("  Searching for email (lowercase):", loginEmail.toLowerCase());
  console.log("  Available emails in storage:", pumps.map(p => p.ownerEmail?.toLowerCase()));
}

console.log("\n=== TEST COMPLETE ===");
console.log("\nNow navigate to http://localhost:3000/auth/login and try logging in with:");
console.log("  Email:", loginEmail);
console.log("  Password:", loginPassword);
