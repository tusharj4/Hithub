import React from "react";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = React.useState<any>(null);

  // Note: In a real Next.js app with NextAuth, you would use `useSession()`
  // and `<SessionProvider>`. Here we use a mock for the live preview.
  const handleLogin = async () => {
    // In preview: prompt for github handle to simulate login
    const handle = prompt("Enter your GitHub handle to Login (e.g. torvalds):");
    if (!handle) return;
    
    try {
      const res = await fetch("/api/mock-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle })
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        // Persist globally for the page
        (window as any).__MOCK_USER__ = data.user;
        window.dispatchEvent(new CustomEvent("userUpdate", { detail: data.user }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    (window as any).__MOCK_USER__ = null;
    window.dispatchEvent(new CustomEvent("userUpdate", { detail: null }));
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-slate-100 font-sans p-4 md:p-8 flex flex-col gap-6 selection:bg-orange-500/30">
      <nav className="flex justify-between items-center bg-[#18181B] border border-white/10 rounded-2xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white tracking-tighter">
            H
          </div>
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">
              HitHub <span className="text-orange-500 text-xs font-mono uppercase ml-1 opacity-80 underline decoration-2 hidden sm:inline-block">v1.0</span>
            </span>
          </a>
        </div>
        <div className="flex items-center justify-end space-x-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={user.image} alt="Avatar" className="h-8 w-8 rounded-full border border-white/10" />
                <span className="text-sm font-medium hidden sm:inline-block text-slate-200">{user.githubHandle}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-white/5">
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogin} size="sm" className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-200">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span>Login</span>
            </Button>
          )}
        </div>
      </nav>
      <main className="flex-1 w-full max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
