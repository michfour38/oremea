"use client";

import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function Page() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut(() => {
      window.location.replace("/sign-in");
    });
  }, []);

  return null;
}