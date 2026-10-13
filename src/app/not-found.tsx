import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center dark:bg-slate-950">
      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">404</p>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Page not found</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">
        Back to home
      </Link>
    </div>
  );
}
