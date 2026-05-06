"use client";

import { useEffect } from "react";
import { basePath } from "@/lib/site";

export function PwaRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {
      // Best-effort registration; app still works without offline support.
    });
  }, []);

  return null;
}
