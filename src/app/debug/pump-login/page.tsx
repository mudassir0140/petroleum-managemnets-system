"use client";

import { useState, useEffect } from "react";
import type { Pump } from "@/lib/dashboard/data/pumps";

export default function DebugPumpLoginPage() {
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [testEmail, setTestEmail] = useState("");
  const [testPassword, setTestPassword] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const pumpsData = localStorage.getItem("petromanage:pumps");
        if (pumpsData) {
          const parsed = JSON.parse(pumpsData);
          setPumps(parsed);
        }
      } catch (err) {
        console.error("Error loading pumps:", err);
      }
      setLoading(false);
    }
  }, []);

  const testLogin = () => {
    if (!testEmail || !testPassword) {
      setResult({
        error: "Please enter email and password"
      });
      return;
    }

    setResult(null);
    console.log("\n=== LOGIN TEST ===");
    console.log("Email searching for:", testEmail.toLowerCase());

    const pumpAccount = pumps.find(
      (p) => p.ownerEmail?.toLowerCase() === testEmail.toLowerCase()
    );

    console.log("Pump found?", !!pumpAccount);

    if (!pumpAccount) {
      console.log("Available emails:", pumps.map(p => p.ownerEmail));
      setResult({
        error: "No pump account found with this email",
        availableEmails: pumps.map(p => p.ownerEmail)
      });
      return;
    }

    console.log("Stored password:", pumpAccount.password);
    console.log("Entered password:", testPassword);
    console.log("Passwords match?", pumpAccount.password === testPassword);

    if (pumpAccount.password !== testPassword) {
      setResult({
        error: "Password does not match",
        details: {
          storedPassword: pumpAccount.password,
          enteredPassword: testPassword,
          storedLength: pumpAccount.password.length,
          enteredLength: testPassword.length
        }
      });
      return;
    }

    if (pumpAccount.accountStatus !== "Active") {
      setResult({
        error: `Account status is ${pumpAccount.accountStatus}`,
        accountStatus: pumpAccount.accountStatus
      });
      return;
    }

    console.log("✓ All checks passed!");
    setResult({
      success: true,
      message: "Login validation successful!",
      pumpId: pumpAccount.id,
      pumpName: pumpAccount.name,
      email: pumpAccount.ownerEmail,
      role: pumpAccount.role,
      accountStatus: pumpAccount.accountStatus
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
          Pump Owner Login Debug
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Test pump owner login flow and verify credentials
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Pumps List */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-900">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Saved Pumps
            </h2>

            {loading ? (
              <p className="text-slate-500">Loading pumps...</p>
            ) : pumps.length === 0 ? (
              <div className="text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                <p>No pumps found in localStorage.</p>
                <p className="text-sm mt-2">
                  Create a pump from <code className="bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded">/dashboard/pumps</code> first.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pumps.map((pump) => (
                  <div
                    key={pump.id}
                    className="border border-slate-200 dark:border-slate-700 rounded p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition"
                    onClick={() => {
                      setTestEmail(pump.ownerEmail);
                      setTestPassword(pump.password);
                    }}
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {pump.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Owner: {pump.owner}
                    </p>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Email:</span>
                        <div className="flex gap-2 items-center">
                          <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {pump.ownerEmail}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(pump.ownerEmail);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Password:</span>
                        <div className="flex gap-2 items-center">
                          <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                            {pump.password}
                          </code>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(pump.password);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Status:</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            pump.accountStatus === "Active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {pump.accountStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Test Form */}
          <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-900">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Test Login
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter pump owner email"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Click a pump above to auto-fill email and password
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={testLogin}
                className="w-full px-4 py-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 rounded-lg font-semibold hover:bg-slate-700 dark:hover:bg-amber-400 transition"
              >
                Test Login
              </button>
            </div>

            {result && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  result.success
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                {result.error ? (
                  <div>
                    <p className={`font-semibold ${result.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"}`}>
                      ❌ {result.error}
                    </p>
                    {result.details && (
                      <div className="mt-3 text-sm text-red-700 dark:text-red-300 space-y-1">
                        <p>Stored password: <code className="bg-red-100 dark:bg-red-800 px-1">{result.details.storedPassword}</code></p>
                        <p>Entered password: <code className="bg-red-100 dark:bg-red-800 px-1">{result.details.enteredPassword}</code></p>
                        <p>Stored length: {result.details.storedLength}, Entered length: {result.details.enteredLength}</p>
                      </div>
                    )}
                    {result.availableEmails && (
                      <div className="mt-3 text-sm text-red-700 dark:text-red-300">
                        <p className="font-semibold mb-2">Available emails:</p>
                        <ul className="space-y-1">
                          {result.availableEmails.map((email: string) => (
                            <li key={email} className="bg-red-100 dark:bg-red-800 px-2 py-1 rounded">
                              {email}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-green-800 dark:text-green-200 mb-3">
                      ✅ {result.message}
                    </p>
                    <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                      <p><span className="font-semibold">Pump ID:</span> {result.pumpId}</p>
                      <p><span className="font-semibold">Pump:</span> {result.pumpName}</p>
                      <p><span className="font-semibold">Email:</span> {result.email}</p>
                      <p><span className="font-semibold">Role:</span> {result.role}</p>
                      <p><span className="font-semibold">Status:</span> {result.accountStatus}</p>
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-3">
                      This login should work at <code className="bg-green-100 dark:bg-green-800 px-1">/auth/login</code>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2">How to Use</h3>
          <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-2 list-decimal list-inside">
            <li>Create a pump from <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/dashboard/pumps</code></li>
            <li>Refresh this page - the pump should appear in the list</li>
            <li>Click on any pump to auto-fill the email and password fields</li>
            <li>Click "Test Login" to verify the credentials work</li>
            <li>If successful, you can use these same credentials at <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/auth/login</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
