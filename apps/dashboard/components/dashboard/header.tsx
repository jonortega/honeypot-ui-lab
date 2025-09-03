"use client";

import { cn } from "@/lib/utils";

import { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSummaryStats } from "@/hooks/use-api";

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { mutate: refreshStats, isLoading } = useSummaryStats();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    refreshStats();
  };

  return (
    <header className='bg-card border-b border-border px-6 py-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-card-foreground'>Security Overview</h1>
          <p className='text-sm text-muted-foreground'>Real-time honeypot monitoring and threat analysis</p>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2 text-sm text-muted-foreground'>
            <Clock className='h-4 w-4' />
            <span className='font-mono'>{currentTime.toLocaleTimeString()}</span>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={handleRefresh}
            disabled={isLoading}
            className='hover:bg-accent/10 hover:text-accent hover:border-accent transition-smooth bg-transparent'
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>
    </header>
  );
}
