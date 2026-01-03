"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/",
      label: "Ana Sayfa",
      icon: Home
    },
    {
      href: "/yeni-grup",
      label: "Yeni Grup",
      icon: Plus
    },
    {
      href: "/kurallar",
      label: "Vizyon & Kurallar",
      icon: FileText
    }
  ];

  return (
    <nav className="flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-gold/10 text-gold"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

