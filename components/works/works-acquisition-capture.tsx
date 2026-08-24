"use client";

import { useEffect } from "react";

import { captureWorksFirstTouchAttribution } from "@/lib/works/marketing/acquisition";

export function WorksAcquisitionCapture() {
  useEffect(() => {
    captureWorksFirstTouchAttribution();
  }, []);

  return null;
}
