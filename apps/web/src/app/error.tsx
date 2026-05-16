"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-zinc-400 mb-6">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-white text-black px-6 py-2 font-semibold hover:bg-zinc-200 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
