"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  FolderOpen,
  MessageSquare,
  LayoutTemplate,
  Settings,
  User,
  Sparkles,
  GitBranch,
  TestTube2,
  RotateCcw,
  FileText,
  Files,
} from "lucide-react";

interface SidebarProps {
  recentSessions?: { id: string; userPrompt: string }[];
}

export default function Sidebar({ recentSessions }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-14 md:w-60 flex-shrink-0 flex flex-col h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-border">
        <Link href="/" className="hidden md:flex items-center gap-2 text-sm font-bold">
          <Sparkles size={16} className="text-primary" />
          <span>MetlCode</span>
        </Link>
        <Sparkles size={16} className="md:hidden text-primary mx-auto" />
      </div>

      {/* Primary nav */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5">
        <NavItem href="/sessions/new" icon={<Plus size={16} />} label="New Project" active={pathname === "/sessions/new"} />
        <NavItem href="/sessions" icon={<FolderOpen size={16} />} label="Projects" active={pathname === "/sessions"} />
        <NavItem href="/sessions" icon={<MessageSquare size={16} />} label="Chats" active={pathname === "/sessions"} />
        <NavItem href="/sessions/new" icon={<LayoutTemplate size={16} />} label="Templates" active={pathname === "/sessions/new"} />

        {recentSessions && recentSessions.length > 0 && (
          <>
            <div className="pt-3 px-3 pb-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold hidden md:block">
                Recent
              </p>
            </div>
            {recentSessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center gap-2 px-3 py-1.5 mx-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded transition-colors truncate"
                title={s.userPrompt}
              >
                <Files size={12} />
                <span className="hidden md:inline truncate">{s.userPrompt}</span>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-border py-2 space-y-0.5">
        <NavItem href="/settings" icon={<Settings size={16} />} label="Settings" active={pathname === "/settings"} />
        <NavItem href="/settings" icon={<User size={16} />} label="Profile" active={pathname === "/settings"} />
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-1.5 mx-1 text-xs rounded transition-colors ${
        active
          ? "text-foreground bg-secondary font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
