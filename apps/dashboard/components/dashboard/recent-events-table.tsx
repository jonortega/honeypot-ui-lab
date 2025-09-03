"use client";

import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import type { EventFilters } from "@/lib/types";

export function RecentEventsTable() {
  const [filters, setFilters] = useState<EventFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: eventsData, isLoading, error } = useEvents(filters);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters((prev) => ({
      ...prev,
      ip: term || undefined,
      offset: 0,
    }));
  };

  const handlePageChange = (newOffset: number) => {
    setFilters((prev) => ({
      ...prev,
      offset: newOffset,
    }));
  };

  const handleServiceFilter = (service: "ssh" | "http" | undefined) => {
    setFilters((prev) => ({
      ...prev,
      service,
      offset: 0,
    }));
  };

  if (isLoading) {
    return (
      <Card className='animate-pulse'>
        <CardHeader>
          <div className='h-6 bg-muted rounded w-1/4' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='h-12 bg-muted rounded' />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='border-destructive'>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-destructive'>Failed to load events</p>
        </CardContent>
      </Card>
    );
  }

  const events = eventsData?.items || [];
  const total = eventsData?.total || 0;
  const limit = eventsData?.limit || 50;
  const offset = eventsData?.offset || 0;

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Recent Events</CardTitle>
          <div className='flex items-center space-x-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by IP...'
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className='pl-10 w-64'
              />
            </div>
            <div className='flex space-x-1'>
              <Button
                variant={filters.service === undefined ? "default" : "outline"}
                size='sm'
                onClick={() => handleServiceFilter(undefined)}
              >
                All
              </Button>
              <Button
                variant={filters.service === "ssh" ? "default" : "outline"}
                size='sm'
                onClick={() => handleServiceFilter("ssh")}
              >
                SSH
              </Button>
              <Button
                variant={filters.service === "http" ? "default" : "outline"}
                size='sm'
                onClick={() => handleServiceFilter("http")}
              >
                HTTP
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-border'>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Timestamp</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Service</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Source IP</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Username</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Path/Method</th>
                <th className='text-left py-3 px-4 font-medium text-muted-foreground'>Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className='border-b border-border hover:bg-muted/50'>
                  <td className='py-3 px-4 text-sm font-mono'>{formatDate(event.timestamp)}</td>
                  <td className='py-3 px-4'>
                    <Badge variant={event.service === "ssh" ? "default" : "secondary"}>
                      {event.service.toUpperCase()}
                    </Badge>
                  </td>
                  <td className='py-3 px-4 font-mono text-sm'>{event.ip}</td>
                  <td className='py-3 px-4 text-sm'>{event.username || "-"}</td>
                  <td className='py-3 px-4 text-sm'>{event.path || event.method || "-"}</td>
                  <td className='py-3 px-4'>
                    <Badge variant={event.success ? "destructive" : "outline"}>
                      {event.success ? "Success" : "Failed"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className='flex items-center justify-between mt-6'>
            <p className='text-sm text-muted-foreground'>
              Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} events
            </p>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                <ChevronLeft className='h-4 w-4 mr-1' />
                Previous
              </Button>
              <span className='text-sm text-muted-foreground'>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(offset + limit)}
                disabled={offset + limit >= total}
              >
                Next
                <ChevronRight className='h-4 w-4 ml-1' />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
