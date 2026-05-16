import Link from "next/link";

export default function NewWorkspacePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <div className="max-w-xl w-full space-y-6">
        <h1 className="text-3xl font-bold">New Workspace</h1>
        <p className="text-zinc-400">Describe what you want to build or attach a GitHub repo.</p>

        <textarea
          className="w-full h-32 rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white"
          placeholder="Build a task management app with teams and deadlines..."
        />

        <div className="flex gap-3">
          <select className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2">
            <option value="agent">Agent Mode</option>
            <option value="plan">Plan Mode</option>
            <option value="ask">Ask Mode</option>
          </select>
          <button className="rounded-lg bg-white text-black px-6 py-2 font-semibold hover:bg-zinc-200 transition-colors">
            Start
          </button>
        </div>

        <Link href="/" className="text-zinc-500 hover:text-white text-sm">
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}
