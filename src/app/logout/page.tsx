"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    api
      .logout()
      .catch(() => undefined)
      .finally(() => {
        router.replace("/");
        router.refresh();
      });
  }, [router]);
  return <p style={{ textAlign: "center", marginTop: 60 }}>Signing out…</p>;
}
