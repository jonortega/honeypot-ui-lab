"use client";

import { Shield, Activity, Globe, Settings, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealth } from "@/hooks/use-api";

const navigation = [
  { name: "Overview", icon: Activity, current: true },
  { name: "SSH Attacks", icon: Shield, current: false },
  { name: "HTTP Attacks", icon: Globe, current: false },
  { name: "Alerts", icon: AlertTriangle, current: false },
  { name: "Settings", icon: Settings, current: false },
];

export function Sidebar() {
  const { data: health } = useHealth();

  return (
    <div className='w-64 bg-sidebar border-r border-sidebar-border flex flex-col'>
      <div className='p-6'>
        <div className='flex items-center space-x-2'>
          <Shield className='h-8 w-8 text-sidebar-accent' />
          <div>
            <h1 className='text-lg font-semibold text-sidebar-foreground'>Honeypot</h1>
            <p className='text-sm text-sidebar-foreground/60'>Dashboard</p>
          </div>
        </div>
      </div>

      <nav className='flex-1 px-4 space-y-1'>
        {navigation.map((item) => (
          <a
            key={item.name}
            href='#'
            className={cn(
              "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              item.current
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon
              className={cn(
                "mr-3 h-5 w-5 flex-shrink-0",
                item.current
                  ? "text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
              )}
            />
            {item.name}
          </a>
        ))}
      </nav>

      <div className='p-4 border-t border-sidebar-border'>
        <div className='flex items-center space-x-2'>
          <div className={cn("h-2 w-2 rounded-full", health?.ok ? "bg-accent" : "bg-destructive")} />
          <span className='text-sm text-sidebar-foreground/60'>{health?.ok ? "System Online" : "System Offline"}</span>
        </div>
      </div>
    </div>
  );
}
