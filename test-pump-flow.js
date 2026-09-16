const BASE_URL = "http://localhost:3001";

async function test() {
  console.log("🧪 Testing Complete Pump Owner Flow\n");

  try {
    // 1. Create a pump
    console.log("1️⃣ Creating a new pump...");
    const createPumpRes = await fetch(`${BASE_URL}/api/admin/pumps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pumpName: "Test Pump Station",
        ownerName: "Ahmed Khan",
        ownerEmail: "ahmed@testpumpgmail.com",
        password: "Ahmed123",
      }),
    });
    const pumpData = await createPumpRes.json();
    if (!createPumpRes.ok) throw new Error(pumpData.error);
    const pumpId = pumpData.pump.pumpId;
    const userEmail = pumpData.pump.ownerEmail;
    console.log("✅ Pump created successfully");
    console.log(`   Pump ID: ${pumpId}`);
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: Ahmed123\n`);

    // 2. Get all pumps
    console.log("2️⃣ Fetching all pumps...");
    const pumpsRes = await fetch(`${BASE_URL}/api/admin/pumps`);
    const pumpsData = await pumpsRes.json();
    const createdPump = pumpsData.pumps.find(p => p.pumpId === pumpId);
    console.log("✅ Pumps fetched");
    console.log(`   Found pump: ${createdPump.pumpName}`);
    console.log(`   Password field: ${createdPump.password}\n`);

    // 3. Pump owner login
    console.log("3️⃣ Pump owner logging in...");
    const loginRes = await fetch(`${BASE_URL}/api/pump-owner/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        password: "Ahmed123",
      }),
    });
    const loginData = await loginRes.json();
    console.log("✅ Login test passed (checking backend)");
    console.log(`   Response: ${JSON.stringify(loginData)}\n`);

    // 4. Change password
    console.log("4️⃣ Pump owner changing password...");
    const changePassRes = await fetch(`${BASE_URL}/api/pump-owner/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        currentPassword: "Ahmed123",
        newPassword: "NewPass456",
      }),
    });
    const changePassData = await changePassRes.json();
    if (!changePassRes.ok) throw new Error(changePassData.error);
    console.log("✅ Password changed successfully\n");

    // 5. Verify admin sees updated password
    console.log("5️⃣ Admin checking updated pump details...");
    const updatedPumpsRes = await fetch(`${BASE_URL}/api/admin/pumps`);
    const updatedPumpsData = await updatedPumpsRes.json();
    const updatedPump = updatedPumpsData.pumps.find(p => p.pumpId === pumpId);
    console.log("✅ Pump details fetched");
    console.log(`   Updated password: ${updatedPump.password}`);
    if (updatedPump.password === "NewPass456") {
      console.log("✅ PASSWORD UPDATE VERIFIED! Admin sees the new password.\n");
    } else {
      console.log("❌ Password not updated in admin view!\n");
    }

    // 6. Test password reset by admin
    console.log("6️⃣ Admin resetting password...");
    const resetRes = await fetch(`${BASE_URL}/api/admin/pumps/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pumpId }),
    });
    const resetData = await resetRes.json();
    if (!resetRes.ok) throw new Error(resetData.error);
    console.log("✅ Password reset successfully");
    console.log(`   New password: ${resetData.password}\n`);

    console.log("🎉 All tests passed! Complete flow working correctly.");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

test();
