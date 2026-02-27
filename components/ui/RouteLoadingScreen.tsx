export default function RouteLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <span role="status" aria-live="polite" aria-label="Loading" className="loader" />
    </div>
  );
}
