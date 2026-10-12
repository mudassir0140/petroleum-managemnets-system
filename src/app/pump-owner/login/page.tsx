"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginLayout, LoginCard } from "@/components/brand/LoginLayout";
import { LoginField, LoginError, LoginSubmitButton } from "@/components/brand/LoginFormParts";
import { MailIcon, LockIcon } from "@/components/icons";

export default function PumpOwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/pump-owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password.");
        return;
      }

      router.push("/pumpadmin");
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
        subtitle="Pump Owner Portal. Access your pump dashboard with the login credentials provided by the administrator."
        footer={
          <p>
            Not a pump owner?{" "}
            <Link
              href="/"
              className="font-semibold text-amber-700 transition hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Go back
            </Link>
          </p>
        }
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <LoginField
            id="email"
            label="Email"
            icon={MailIcon}
            type="email"
            autoComplete="email"
            placeholder="owner@example.com"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setError("");
            }}
          />
          <LoginField
            id="password"
            label="Password"
            icon={LockIcon}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setError("");
            }}
          />

          <LoginError message={error} />
          <LoginSubmitButton loading={isLoading} />
        </form>
      </LoginCard>
    </LoginLayout>
  );
}
