"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockIcon, UserIcon } from "@/components/icons";
import { LoginLayout, LoginCard } from "@/components/brand/LoginLayout";
import { LoginField, LoginError, LoginSubmitButton } from "@/components/brand/LoginFormParts";

// Reads a JSON body without throwing. A crashed or timed-out function returns
// HTML or plain text, which would otherwise land in the generic catch below.
async function readBody(response: Response): Promise<any> {
  return response.json().catch(() => null);
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!username || !password) {
        setError("Please fill in all fields");
        setIsLoading(false);
        return;
      }

      // Check if input is email or username
      const isEmail = username.includes("@");

      // Error from the pump-owner or khata attempt, kept so a more specific
      // message can win over the employee check's generic "Account not found"
      let earlierError = "";

      // Try pump owner login if email
      if (isEmail) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: username, password }),
        });

        const data = await readBody(response);

        if (response.ok && data?.role === "pump-owner") {
          router.push(data.redirectUrl || "/pumpadmin");
          return;
        }

        if (response.status === 403) {
          setError(data?.error || "Login blocked. Contact your administrator.");
          setIsLoading(false);
          return;
        }

        earlierError = data?.error || (response.status >= 500 ? "Server/database error. Please try again." : "");
      }

      // Try khata client login (username without @)
      if (!isEmail) {
        const khataResponse = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const khataData = await readBody(khataResponse);

        if (khataResponse.ok && khataData?.role === "khata-client") {
          router.push(khataData.redirectUrl || "/khata-client/dashboard");
          return;
        }

        earlierError = khataData?.error || (khataResponse.status >= 500 ? "Server/database error. Please try again." : "");
      }

      // Try employee login (username or email)
      const employeeResponse = await fetch("/api/auth/employee-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: isEmail ? username : undefined,
          username: !isEmail ? username : undefined,
          password
        }),
      });

      if (employeeResponse.ok) {
        const employeeData = await readBody(employeeResponse);
        router.push(employeeData?.redirectUrl || "/dashboard");
        return;
      }

      const employeeData = await readBody(employeeResponse);
      const employeeMessage =
        employeeData?.error ||
        (employeeResponse.status >= 500 ? "Server/database error. Please try again." : "Invalid credentials");

      // The employee check only knows its own table, so for a pump-owner or khata
      // login it says "Account not found" even when the account exists with a wrong password.
      const useEarlier = employeeMessage === "Account not found" && earlierError && earlierError !== "Account not found";
      setError(useEarlier ? earlierError : employeeMessage);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LoginLayout>
      <LoginCard
        title="Welcome back"
        titleUr="خوش آمدید"
        subtitle="Sign in to access your dashboard."
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <LoginField
            id="username"
            label="Email or Username"
            icon={UserIcon}
            value={username}
            onChange={(value) => {
              setUsername(value);
              setError("");
            }}
            placeholder="you@company.com or employee.pumpname"
            disabled={isLoading}
          />
          <LoginField
            id="password"
            label="Password"
            icon={LockIcon}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setError("");
            }}
            placeholder="••••••••"
            disabled={isLoading}
          />

          <LoginError message={error} />
          <LoginSubmitButton loading={isLoading} />
        </form>
      </LoginCard>

      <Link
        href="/"
        className="text-center text-sm text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        Back to home
      </Link>
    </LoginLayout>
  );
}
