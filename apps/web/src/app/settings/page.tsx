import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href="/" className="text-zinc-500 hover:text-white">
            &larr; Back to home
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Model Provider</h2>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Provider</span>
            <span className="font-medium">Gemini</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Mode</span>
            <span className="font-medium">{process.env.GEMINI_PROVIDER || "developer"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Configured</span>
            <span className="font-medium">{process.env.GEMINI_API_KEY ? "Yes" : "No"}</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Workspace</h2>
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Provider</span>
            <span className="font-medium">Local Docker</span>
          </div>
        </div>
      </div>
    </main>
  );
}
