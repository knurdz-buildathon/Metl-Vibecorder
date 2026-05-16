import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Metl-VibeCoder
        </h1>
        <p className="text-xl text-zinc-400">
          AI coding workspace powered by Gemini.
        </p>
        <p className="text-zinc-500">
          Understand, generate, verify, repair, and explain code — all in one browser IDE.
        </p>

        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/sessions/new"
            className="rounded-lg bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition-colors"
          >
            New Workspace
          </Link>
          <Link
            href="/settings"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold hover:bg-zinc-800 transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {[
          { title: "Ask", desc: "Understand the repo without editing." },
          { title: "Plan", desc: "Get an implementation plan before building." },
          { title: "Agent", desc: "Build automatically with checks and repair." },
        ].map((mode) => (
          <div
            key={mode.title}
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <h3 className="text-lg font-semibold mb-2">{mode.title}</h3>
            <p className="text-sm text-zinc-400">{mode.desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
