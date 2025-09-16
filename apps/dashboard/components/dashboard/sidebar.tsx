"use client";

import { Shield, Activity, BarChart3, Settings, Menu, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const navigation = [
  { name: "Overview", icon: Activity, current: true, href: "#overview" },
  { name: "Analytics", icon: BarChart3, current: false, href: "#analytics" },
  { name: "Settings", icon: Settings, current: false, href: "#settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTab, setCurrentTab] = useState("Overview");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-smooth",
        collapsed ? "w-16" : "w-44"
      )}
    >
      <div className='p-4'>
        <div className='flex items-center space-x-2'>
          <Shield className='h-8 w-8 text-accent flex-shrink-0' />
          {!collapsed && (
            <div>
              <h1 className='text-lg font-semibold text-sidebar-foreground'>Honeypot</h1>
              <p className='text-sm text-sidebar-foreground/60'>Dashboard</p>
            </div>
          )}
        </div>
      </div>

      <nav className='flex-1 px-4 space-y-1'>
        {navigation.map((item) => (
          <button
            key={item.name}
            onClick={() => setCurrentTab(item.name)}
            className={cn(
              "group flex items-center text-sm font-medium rounded-md transition-smooth relative w-full",
              collapsed ? "px-4 py-2 justify-center" : "px-3 py-2",
              currentTab === item.name
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-accent/10 hover:text-accent hover:shadow-sm"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0 transition-smooth",
                collapsed ? "" : "mr-3",
                currentTab === item.name
                  ? "text-accent-foreground"
                  : "text-sidebar-foreground/60 group-hover:text-accent"
              )}
            />
            {!collapsed && item.name}
          </button>
        ))}
      </nav>

      {/* Clock widget */}
      <div className={cn("px-4 py-3 transition-smooth", collapsed ? "flex justify-center" : "")}>
        <div
          className={cn(
            "flex items-center rounded-md border border-sidebar-border",
            "text-sm text-muted-foreground px-3 py-2 justify-center"
          )}
          title={collapsed ? currentTime.toLocaleTimeString() : undefined}
          aria-label='Current time'
        >
          <Clock className={cn("h-4 w-4 text-accent", collapsed ? "" : "mr-2")} />
          {!collapsed && (
            <span className='font-mono tracking-tight text-sidebar-foreground'>{currentTime.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      <div className='p-3 border-t border-sidebar-border'>
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-accent hover:bg-accent/10 transition-smooth",
            collapsed ? "w-8 h-8 mx-auto" : "w-full p-2"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <Menu className='h-4 w-4' />
          ) : (
            <>
              <X className='h-4 w-4 mr-2' />
              <span className='text-sm'>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
