export default function NotFoundSessionPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="text-6xl font-bold text-zinc-700">404</div>
        <h1 className="text-xl font-semibold">Session Not Found</h1>
        <p className="text-zinc-400">
          We couldn't find a session at this URL. It may have been deleted or the ID is incorrect.
        </p>
        <a href="/" className="inline-block rounded-lg bg-white text-black px-6 py-2 text-sm font-semibold hover:bg-zinc-200 mt-4">
          Back to Home
        </a>
      </div>
    </div>
  );
}
