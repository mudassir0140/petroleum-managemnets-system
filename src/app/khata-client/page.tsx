"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function KhataClientRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push("/khata-client/dashboard");
  }, [router]);

  return null;
}
