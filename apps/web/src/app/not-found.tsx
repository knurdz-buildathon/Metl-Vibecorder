export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-zinc-400 mb-6">This page could not be found.</p>
      <a href="/" className="text-white underline hover:text-zinc-300">
        Return to home
      </a>
    </div>
  );
}
