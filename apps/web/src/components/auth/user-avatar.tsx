"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut, User } from "lucide-react";
import { useState } from "react";

export default function UserAvatar() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <button
        onClick={() => signIn("github", { callbackUrl: "/" })}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white rounded-md px-2 py-1 border border-zinc-700 hover:bg-zinc-800 transition-colors"
      >
        <LogIn size={14} />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-2 py-1 hover:bg-zinc-700 transition-colors"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt="Avatar"
            className="w-5 h-5 rounded-full"
          />
        ) : (
          <User size={14} className="text-zinc-400" />
        )}
        <span className="text-xs text-zinc-300 max-w-[80px] truncate">
          {session.user.name || "User"}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-48 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl z-50">
            <div className="px-3 py-2 border-b border-zinc-800">
              <p className="text-xs font-medium text-white truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => {
                signOut({ callbackUrl: "/" });
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-zinc-800 transition-colors"
            >
              <LogOut size={12} />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
