"use client";

import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEvents, useHealth, useStats } from "@/hooks/use-api";

export function Header() {
  const { data: stats, mutate: refreshStats, error: statsError } = useStats();
  const { data: health, mutate: refreshHealth, error: healthError } = useHealth();

  const {
    data: events,
    mutate: refreshEvents,
    error: eventsError,
  } = useEvents({
    limit: 50,
    // service: serviceFilter === "all" ? undefined : (serviceFilter as "ssh" | "http"),
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refreshHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
      refreshEvents();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshStats, refreshEvents]);

  const handleRefresh = () => {
    refreshStats();
    refreshEvents();
    refreshHealth();
  };

  return (
    <header className='bg-card border-b border-border px-6 py-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-card-foreground'>Security Overview</h1>
          <p className='text-muted-foreground'>Real-time honeypot monitoring and threat analysis</p>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <div
              className={cn("h-3 w-3 rounded-full transition-colors", health?.ok ? "bg-success" : "bg-destructive")}
            />
            <span className='text-sm text-muted-foreground'>{health?.ok ? "Service Online" : "Service Offline"}</span>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            // disabled={isLoading}
            className='hover:bg-accent/10 hover:text-accent hover:border-accent transition-smooth bg-transparent'
          >
            {/* <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} /> */}
            <RefreshCw className={cn("h-4 w-4 mr-2")} />
            Refresh
          </Button>
        </div>
      </div>
      <div className='mt-3'>
        {(statsError || eventsError || healthError) && (
          <div className='bg-destructive/10 border border-destructive/20 rounded-md p-4'>
            <div className='flex items-center space-x-2'>
              <div className='h-2 w-2 rounded-full bg-destructive' />
              <span className='text-sm text-destructive-foreground'>
                Unable to connect to honeypot API. Please check your environment variables (API_BASE_URL and API_TOKEN)
                in Project Settings.
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
