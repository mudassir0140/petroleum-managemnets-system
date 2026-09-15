import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE_NAME = "admin_session";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  // If admin is logged in, redirect to dashboard
  if (adminCookie) {
    redirect("/admin/dashboard");
  }

  // Otherwise redirect to login
  redirect("/admin/login");
}
