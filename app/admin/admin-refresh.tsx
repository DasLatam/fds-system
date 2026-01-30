"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRefresh({ stamp }: { stamp: string }) {
  const router = useRouter();

  useEffect(() => {
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp]);

  return null;
}
