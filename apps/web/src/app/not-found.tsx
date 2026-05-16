export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">This page could not be found.</p>
      <a href="/" className="text-foreground underline hover:text-muted-foreground">
        Return to home
      </a>
    </div>
  );
}
