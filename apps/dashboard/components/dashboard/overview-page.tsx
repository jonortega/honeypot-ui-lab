"use client";

import { useState, useEffect } from "react";
import { useStats, useEvents, useHealth } from "@/hooks/use-api";
import { cn } from "@/lib/utils";
import type { EventItem } from "@/lib/types";
import { RecentEventsTable } from "./recent-events-table";
import { StatsOverview } from "./stats-overview";

interface OverviewPageProps {
  className?: string;
}

export function OverviewPage({ className }: OverviewPageProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const filteredEvents =
    event?.items?.filter((event: EventItem) => {
      const matchesSearch =
        searchTerm === "" ||
        event.src_ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.http_path?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || event.http_status === statusFilter;

      return matchesSearch && matchesStatus;
    }) || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Overview */}
      <StatsOverview />
      {/* <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='hover:shadow-lg transition-shadow'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>{stats?.totalEvents?.toLocaleString() || "0"}</div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-lg transition-shadow'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Events Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>
              {stats?.byDay?.[stats.byDay.length - 1]?.count?.toLocaleString() || "0"}
            </div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-lg transition-shadow'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Top Source IP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground font-mono'>{stats?.topIPs?.[0]?.ip || "N/A"}</div>
            <div className='text-sm text-muted-foreground'>{stats?.topIPs?.[0]?.count} attacks</div>
          </CardContent>
        </Card>

        <Card className='hover:shadow-lg transition-shadow'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Top Username</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground font-mono'>
              {stats?.topUsernames?.[0]?.username || "N/A"}
            </div>
            <div className='text-sm text-muted-foreground'>{stats?.topUsernames?.[0]?.count} attempts</div>
          </CardContent>
        </Card>
      </div> */}
      {/* Recent Events Table */}
      <RecentEventsTable />
      {/* <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Recent Events</CardTitle>
            <div className='flex items-center space-x-2'>
              <Input
                placeholder='Search events...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-64'
              />
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Service' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Services</SelectItem>
                  <SelectItem value='ssh'>SSH</SelectItem>
                  <SelectItem value='http'>HTTP</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                  <SelectItem value='success'>Success</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className='w-32'>
                  <SelectValue placeholder='Time Range' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='24h'>Last 24h</SelectItem>
                  <SelectItem value='7d'>Last 7 days</SelectItem>
                  <SelectItem value='custom'>Custom</SelectItem>
                </SelectContent>
              </Select>
              <Button variant='outline' size='sm'>
                <Download className='h-4 w-4 mr-2' />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Source IP</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event: EventItem, index: number) => (
                <TableRow key={event.id || index} className='hover:bg-muted/50'>
                  <TableCell className='font-mono text-sm'>{new Date(event.ts_utc).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={cn(
                        "font-mono",
                        event.service === "ssh" ? "border-chart-2 text-chart-2" : "border-chart-3 text-chart-3"
                      )}
                    >
                      {event.service?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className='font-mono'>{event.src_ip}</TableCell>
                  <TableCell className='font-mono text-sm'>{event.http_path || "-"}</TableCell>
                  <TableCell className='font-mono'>{event.username || "-"}</TableCell>
                  <TableCell className='font-mono'>{event.password || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={event.http_status === "failed" ? "destructive" : "default"} className='capitalize'>
                      {event.http_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredEvents.length === 0 && (
            <div className='text-center py-8 text-muted-foreground'>No events found matching your filters.</div>
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}
