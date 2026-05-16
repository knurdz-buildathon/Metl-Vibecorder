"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  List,
  Settings,
  Plus,
  PanelsTopLeft,
  Sparkles,
} from "lucide-react";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

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
            <span>Metl-VibeCoder</span>
          </Link>
        )}
        {collapsed && <Sparkles size={18} className="text-white mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-500 hover:text-white"
        >
          <PanelsTopLeft size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <NavItem
          href="/sessions/new"
          icon={<Plus size={18} />}
          label="New Session"
          collapsed={collapsed}
        />
        <NavItem
          href="/"
          icon={<List size={18} />}
          label="Sessions"
          collapsed={collapsed}
        />
        <NavItem
          href="#"
          icon={<MessageSquare size={18} />}
          label="Chat"
          collapsed={collapsed}
        />
      </div>

      <div className="p-2 border-t border-zinc-800">
        <NavItem
          href="/settings"
          icon={<Settings size={18} />}
          label="Settings"
          collapsed={collapsed}
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
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md mx-2"
    >
      {icon}
      {!collapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
}
