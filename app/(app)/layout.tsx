// (app) route group layout — AppShell (Sidebar + Topbar) added in Step 3.
// For now, just renders children with minimal chrome.

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bark-900">
      {children}
    </div>
  );
}
