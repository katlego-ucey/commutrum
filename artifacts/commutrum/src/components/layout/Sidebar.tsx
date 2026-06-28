import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Search,
  Briefcase,
  Activity,
  Archive,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/research", label: "Research", icon: BarChart3 },
  { href: "/factors", label: "Factor Explorer", icon: Search },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/monitoring", label: "Monitoring", icon: Activity },
  { href: "/registry", label: "Hypothesis Registry", icon: Archive },
];

function NavItem({ href, label, icon: Icon, collapsed }: { href: string; label: string; icon: React.ElementType; collapsed: boolean }) {
  const [isActive] = useRoute(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen border-r bg-sidebar flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div className="p-4 border-b flex items-center gap-2">
        {!collapsed && (
          <span className="font-semibold text-sm truncate">Commutrum</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-muted ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
          />
        ))}
      </nav>
      <div className="p-3 border-t text-xs text-muted-foreground">
        {!collapsed && (
          <span>JSE Factor Research Engine v1</span>
        )}
      </div>
    </aside>
  );
}
