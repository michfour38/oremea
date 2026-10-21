"use client";

import { clearRecognitionDrafts } from "@/src/lib/recognition/composer-storage";
import { useEffect } from "react";
import { useClerk } from "@clerk/nextjs";

export default function Page() {
  const { signOut } = useClerk();

  useEffect(() => {
    clearRecognitionDrafts();
    signOut(() => {
      window.location.replace("/sign-in");
    });
  }, []);

  return null;
}