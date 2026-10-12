import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin Login | PetroManage",
  description: "Administrator login page.",
};

export default function DeveloperLayout({ children }: { children: ReactNode }) {
  return children;
}
