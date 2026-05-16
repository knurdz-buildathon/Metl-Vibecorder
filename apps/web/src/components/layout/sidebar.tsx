"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  List,
  Settings,
  Plus,
  GitBranch,
  GitPullRequest,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={`flex flex-col h-full bg-zinc-900 border-r border-zinc-800 transition-all ${
        collapsed ? "w-12" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        {!collapsed && (
          <Link href="/" className="text-white font-bold flex items-center gap-2">
            <Sparkles size={18} />
            <span className="truncate">Metl-VibeCoder</span>
          </Link>
        )}
        {collapsed && <Sparkles size={18} className="text-white mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-500 hover:text-white"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-1">
        <NavItem
          href="/sessions/new"
          icon={<Plus size={18} />}
          label="New Session"
          collapsed={collapsed}
          active={pathname === "/sessions/new"}
        />
        <NavItem
          href="/github/import"
          icon={<GitPullRequest size={18} />}
          label="Import Repo"
          collapsed={collapsed}
          active={pathname === "/github/import"}
        />
        <NavItem
          href="/"
          icon={<List size={18} />}
          label="Dashboard"
          collapsed={collapsed}
          active={pathname === "/"}
        />
        <NavItem
          href="/sessions"
          icon={<MessageSquare size={18} />}
          label="All Sessions"
          collapsed={collapsed}
          active={pathname === "/sessions"}
        />
      </div>

      <div className="p-2 border-t border-zinc-800">
        <NavItem
          href="/settings"
          icon={<Settings size={18} />}
          label="Settings"
          collapsed={collapsed}
          active={pathname === "/settings"}
        />
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  collapsed,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md mx-2 transition-colors ${
        active
          ? "bg-zinc-800 text-white font-medium"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
      }`}
    >
      {icon}
      {!collapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
}
