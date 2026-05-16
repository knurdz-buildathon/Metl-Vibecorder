"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="text-6xl font-bold text-muted-foreground/20">500</div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">
          {error?.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => reset()}
          className="inline-block rounded-lg bg-primary text-primary-foreground px-6 py-2 text-sm font-semibold hover:opacity-90 mt-4 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
