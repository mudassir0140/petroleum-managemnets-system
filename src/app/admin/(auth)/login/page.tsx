"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginLayout, LoginCard } from "@/components/brand/LoginLayout";
import { LoginField, LoginError, LoginSubmitButton } from "@/components/brand/LoginFormParts";
import { MailIcon, LockIcon } from "@/components/icons";
import { adminLogin } from "@/lib/admin/actions";

export default function AdminLoginPage() {
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
      const result = await adminLogin(email, password);
      if (result.success) {
        router.push("/admin");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LoginLayout>
      <LoginCard
        title="Welcome back"
        titleUr="خوش آمدید"
        subtitle="Administrator access. Sign in to access the admin dashboard with full system control."
        footer={
          <p>
            Don&apos;t have an admin account?{" "}
            <Link
              href="/admin/signup"
              className="font-semibold text-amber-700 transition hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
            >
              Create one
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
            placeholder="admin@petromanage.demo"
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

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Demo Credentials: admin@petromanage.demo / admin123
      </p>
      <Link
        href="/"
        className="text-center text-sm text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        Back to home
      </Link>
    </LoginLayout>
  );
}
