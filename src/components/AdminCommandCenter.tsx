'use client';

import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Search,
  Download,
  UserPlus,
  BarChart3,
  Building,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { TicketDTO, UserDTO, AdminAnalyticsDTO, Category, Priority, TicketStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { getSlaInfo } from '@/lib/sla';

interface AdminCommandCenterProps {
  analytics: AdminAnalyticsDTO;
  tickets: TicketDTO[];
  staffUsers: UserDTO[];
  onAssignTicket: (ticketId: string, staffId: string) => Promise<boolean>;
  onRefresh: () => void;
}

export function AdminCommandCenter({
  analytics,
  tickets,
  staffUsers,
  onAssignTicket,
  onRefresh,
}: AdminCommandCenterProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Reassignment drawer state
  const [assignModalTicket, setAssignModalTicket] = useState<TicketDTO | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.building.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    const matchesPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const handleConfirmAssign = async () => {
    if (!assignModalTicket || !selectedStaffId) return;
    setIsAssigning(true);
    try {
      const ok = await onAssignTicket(assignModalTicket.id, selectedStaffId);
      if (ok) {
        setAssignModalTicket(null);
        setSelectedStaffId('');
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['TicketCode', 'Title', 'Category', 'Priority', 'Status', 'Building', 'SLA_Deadline', 'ResolvedAt'];
    const rows = filteredTickets.map((t) => [
      t.ticketCode,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.status,
      `"${t.building}"`,
      t.slaDeadline,
      t.resolvedAt || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FixFlow_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-indigo-900/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200 border border-indigo-500/30 mb-2">
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>Facility Operations Executive Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Real-Time SLA & Campus Dispatch Operations
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Live monitoring across all campus buildings. Automated SLA breach calculations and technician dispatching.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 font-bold"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Audit CSV
            </Button>
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Active */}
        <Card className="border-l-4 border-l-indigo-600 border-slate-200 dark:border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Total Tickets</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{analytics.totalTickets}</p>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-bold text-indigo-600">{analytics.openTickets + analytics.inProgressTickets}</span> active in pipe
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
              <BarChart3 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* SLA Breach Health */}
        <Card className={`border-l-4 border-slate-200 dark:border-slate-800 ${analytics.slaBreachCount > 0 ? 'border-l-red-600 bg-red-50/20' : 'border-l-emerald-600'}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">SLA Breach Rate</p>
              <p className="text-3xl font-black text-red-600 dark:text-red-400 mt-1">{analytics.slaBreachRate}%</p>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-bold text-red-600">{analytics.slaBreachCount} Breached</span> • {analytics.nearingBreachCount} Nearing limit
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Average Resolution Time (ART) */}
        <Card className="border-l-4 border-l-emerald-600 border-slate-200 dark:border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Avg Resolution Time (ART)</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {analytics.averageResolutionTimeHours}h
              </p>
              <p className="text-xs text-slate-500 mt-1">Target benchmark: &lt; 12.0h</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Critical Unresolved */}
        <Card className="border-l-4 border-l-amber-500 border-slate-200 dark:border-slate-800">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Critical Active</p>
              <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {analytics.criticalTickets}
              </p>
              <p className="text-xs text-slate-500 mt-1">High priority response required</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ANALYTICS VISUALIZATION GAUGES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">
              Issues by Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.categoryDistribution).map(([cat, count]) => {
              const maxCount = Math.max(...Object.values(analytics.categoryDistribution), 1);
              const percentage = Math.round((count / maxCount) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{cat}</span>
                    <span className="text-slate-500">{count} tickets</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Building Distribution */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">
              Issues by Building / Locus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.buildingDistribution).map(([bld, count]) => {
              const maxCount = Math.max(...Object.values(analytics.buildingDistribution), 1);
              const percentage = Math.round((count / maxCount) * 100);

              return (
                <div key={bld} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{bld}</span>
                    <span className="text-slate-500">{count} tickets</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* CENTRAL DISPATCH BOARD TABLE */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold">Central Dispatch & State Machine Audit Board</CardTitle>
            <CardDescription>Filter, search, re-assign technicians, and enforce SLA status guards.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Ticket ID, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="REPORTED">REPORTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </Select>

            <Select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </Select>

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="ELECTRICAL">ELECTRICAL</option>
              <option value="HVAC">HVAC</option>
              <option value="PLUMBING">PLUMBING</option>
              <option value="NETWORK">NETWORK</option>
              <option value="CARPENTRY">CARPENTRY</option>
              <option value="JANITORIAL">JANITORIAL</option>
              <option value="OTHER">OTHER</option>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Issue & Location</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA Health</TableHead>
                <TableHead>Assigned Technician</TableHead>
                <TableHead className="text-right">Dispatch Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No tickets match the selected filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((t) => {
                  const sla = getSlaInfo(t.priority, t.slaDeadline, t.status, t.resolvedAt);

                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {t.ticketCode}
                      </TableCell>

                      <TableCell>
                        <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{t.title}</p>
                        <p className="text-xs text-slate-500">{t.building} • {t.room}</p>
                      </TableCell>

                      <TableCell>
                        <Badge variant={t.priority === 'CRITICAL' ? 'destructive' : t.priority === 'HIGH' ? 'warning' : 'default'}>
                          {t.priority}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="font-semibold uppercase text-[10px]">
                          {t.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={sla.isBreached ? 'destructive' : sla.status === 'NEARING_BREACH' ? 'warning' : 'success'}
                        >
                          {sla.formattedRemaining}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        {t.assignedTo ? (
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">{t.assignedTo.name} ({t.assignedTo.department})</span>
                        ) : (
                          <span className="text-amber-600 font-bold">Unassigned</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          onClick={() => {
                            setAssignModalTicket(t);
                            setSelectedStaffId(t.assignedToId || staffUsers[0]?.id || '');
                          }}
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold"
                        >
                          <UserPlus className="mr-1 h-3.5 w-3.5" />
                          {t.assignedToId ? 'Reassign' : 'Dispatch'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* REASSIGNMENT DRAWER MODAL */}
      <Dialog
        open={!!assignModalTicket}
        onOpenChange={(op) => !op && setAssignModalTicket(null)}
        title={`Dispatch Technician for ${assignModalTicket?.ticketCode}`}
        description={`Assign matching maintenance staff to "${assignModalTicket?.title}".`}
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Select Maintenance Staff *
            </label>
            <Select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="mt-1"
            >
              {staffUsers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — Dept: {s.department}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-bold flex items-center gap-1">
              <Shield className="h-4 w-4 text-amber-600" /> State Machine Guard Notice:
            </p>
            <p className="mt-1">
              Assigning staff will transition ticket status to <strong>ASSIGNED</strong> and log a timestamped entry in the audit activity log.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAssignModalTicket(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAssign}
              disabled={isAssigning}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isAssigning ? 'Dispatching...' : 'Confirm Dispatch'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
