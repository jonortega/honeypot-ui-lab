"use client";

import { Shield, Activity, BarChart3, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

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
  const [currentTab, setCurrentTab] = useState("Overview");

  return (
    <div
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col transition-smooth",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className='p-6'>
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
              collapsed ? "px-2 py-3 justify-center" : "px-3 py-2",
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

      <div className='p-4 border-t border-sidebar-border'>
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
