'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Play,
  CheckCircle,
  Clock,
  Building,
  Camera,
  MessageSquare,
  Lock,
  UserCheck,
  AlertOctagon,
  Sparkles,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { TicketDTO, UserDTO, TicketStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getSlaInfo } from '@/lib/sla';

interface StaffDashboardProps {
  currentStaff: UserDTO;
  tickets: TicketDTO[];
  onUpdateStatus: (
    ticketId: string,
    newStatus: TicketStatus,
    resolutionProofUrl?: string,
    note?: string
  ) => Promise<boolean>;
  onRefresh: () => void;
}

export function StaffDashboard({
  currentStaff,
  tickets,
  onUpdateStatus,
  onRefresh,
}: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState<'assigned' | 'in_progress' | 'resolved'>('assigned');
  const [selectedTicket, setSelectedTicket] = useState<TicketDTO | null>(null);

  // Resolve Modal State
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionProofUrl, setResolutionProofUrl] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [isSubmittingResolve, setIsSubmittingResolve] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Internal Comment state
  const [internalNote, setInternalNote] = useState('');

  // Sample proof photos for simulated technician upload
  const SAMPLE_PROOF_PHOTOS = [
    { label: 'Repaired Substation Breaker', url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=60' },
    { label: 'Chiller Sensor Replacement', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=60' },
    { label: 'Replaced Copper Pipe', url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600&auto=format&fit=crop&q=60' },
    { label: 'Lab Lock Solenoid Replacement', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=60' },
  ];

  const handleStartWork = async (ticket: TicketDTO) => {
    await onUpdateStatus(ticket.id, 'IN_PROGRESS', undefined, `Work started by technician ${currentStaff.name}`);
  };

  const handleOpenResolveModal = (ticket: TicketDTO) => {
    setSelectedTicket(ticket);
    setResolutionProofUrl(SAMPLE_PROOF_PHOTOS[0].url);
    setResolutionNote('');
    setResolveError(null);
    setIsResolveModalOpen(true);
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setResolveError(null);

    if (!resolutionProofUrl) {
      setResolveError('Photo proof of resolution is MANDATORY by business logic rules.');
      return;
    }

    if (!resolutionNote || resolutionNote.trim().length < 5) {
      setResolveError('Please provide a resolution note of at least 5 characters.');
      return;
    }

    setIsSubmittingResolve(true);
    try {
      const ok = await onUpdateStatus(
        selectedTicket.id,
        'RESOLVED',
        resolutionProofUrl,
        resolutionNote
      );

      if (ok) {
        setIsResolveModalOpen(false);
        setSelectedTicket(null);
      } else {
        setResolveError('State machine rejected transition. Verify inputs.');
      }
    } finally {
      setIsSubmittingResolve(false);
    }
  };

  // Filtered ticket views
  const myAssigned = tickets.filter(
    (t) => (t.assignedToId === currentStaff.id || true) && t.status === 'ASSIGNED'
  );
  const myInProgress = tickets.filter(
    (t) => (t.assignedToId === currentStaff.id || true) && t.status === 'IN_PROGRESS'
  );
  const myResolved = tickets.filter(
    (t) => (t.assignedToId === currentStaff.id || true) && (t.status === 'RESOLVED' || t.status === 'CLOSED')
  );

  const displayedTickets =
    activeTab === 'assigned'
      ? myAssigned
      : activeTab === 'in_progress'
      ? myInProgress
      : myResolved;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-emerald-700/50">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200 border border-emerald-400/30 mb-2">
              <Wrench className="h-3.5 w-3.5 text-emerald-300" />
              <span>Maintenance Field Technician Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Work Dispatch Queue & Field Execution
            </h1>
            <p className="mt-1 text-sm text-emerald-200">
              Technician: <strong className="text-white font-semibold">{currentStaff.name}</strong> • Department: <strong className="text-white">{currentStaff.department}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-emerald-950/70 border border-emerald-700/60 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-300">Active Work</p>
              <p className="text-xl font-black text-white">{myInProgress.length}</p>
            </div>
            <div className="bg-emerald-950/70 border border-emerald-700/60 rounded-xl p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-300">New Assigned</p>
              <p className="text-xl font-black text-amber-300">{myAssigned.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <TabsList className="bg-slate-200 dark:bg-slate-800 p-1">
            <TabsTrigger value="assigned">
              Assigned Queue ({myAssigned.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              In Progress ({myInProgress.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Completed ({myResolved.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Field Ticket Cards */}
      <div className="space-y-4">
        {displayedTickets.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <CheckCircle className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">No Tickets in this Stage</h3>
            <p className="text-xs text-slate-500">All tasks in this status queue are up to date.</p>
          </Card>
        ) : (
          displayedTickets.map((t) => {
            const sla = getSlaInfo(t.priority, t.slaDeadline, t.status, t.resolvedAt);

            return (
              <Card key={t.id} className="border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                        {t.ticketCode}
                      </span>
                      <Badge variant={t.priority === 'CRITICAL' ? 'destructive' : t.priority === 'HIGH' ? 'warning' : 'default'}>
                        {t.priority}
                      </Badge>
                      <Badge variant="outline" className="uppercase text-[10px]">
                        {t.category}
                      </Badge>
                      <Badge
                        variant={sla.isBreached ? 'destructive' : sla.status === 'NEARING_BREACH' ? 'warning' : 'success'}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        <span>{sla.formattedRemaining}</span>
                      </Badge>
                    </div>

                    {/* Quick Action Toggle Buttons */}
                    <div className="flex items-center gap-2">
                      {t.status === 'ASSIGNED' && (
                        <Button
                          onClick={() => handleStartWork(t)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                          size="sm"
                        >
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Start Work
                        </Button>
                      )}

                      {t.status === 'IN_PROGRESS' && (
                        <Button
                          onClick={() => handleOpenResolveModal(t)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          size="sm"
                        >
                          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                          Mark Resolved
                        </Button>
                      )}

                      <Button
                        onClick={() => setSelectedTicket(selectedTicket?.id === t.id ? null : t)}
                        variant="outline"
                        size="sm"
                      >
                        <FileText className="mr-1 h-3.5 w-3.5" />
                        {selectedTicket?.id === t.id ? 'Hide Logs' : 'View Logs & Notes'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Building className="h-4 w-4 text-emerald-600" />
                      Location: {t.building} • {t.floor} • {t.room}
                    </span>
                    <span>•</span>
                    <span>Reporter: {t.reportedBy?.name || 'Citizen'}</span>
                  </div>

                  {/* Attached Media Photos */}
                  {(t.photoUrl || t.resolutionProofUrl) && (
                    <div className="flex flex-wrap gap-4 pt-1">
                      {t.photoUrl && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Citizen Problem Image</p>
                          <img src={t.photoUrl} alt="Problem" className="h-20 w-32 object-cover rounded-lg border" />
                        </div>
                      )}
                      {t.resolutionProofUrl && (
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Uploaded Resolution Proof</p>
                          <img src={t.resolutionProofUrl} alt="Proof" className="h-20 w-32 object-cover rounded-lg border-2 border-emerald-500" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded Audit Log & Internal Notes Drawer */}
                  {selectedTicket?.id === t.id && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                        Audit History & Internal Work Logs
                      </h4>

                      {/* History Log List */}
                      <div className="space-y-2">
                        {t.history?.map((h) => (
                          <div key={h.id} className="text-xs border-l-2 border-emerald-500 pl-3 py-1">
                            <div className="flex items-center justify-between text-slate-500">
                              <span className="font-bold text-slate-700 dark:text-slate-300">{h.action} ({h.toStatus || 'LOGGED'})</span>
                              <span>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 mt-0.5">{h.note}</p>
                          </div>
                        ))}
                      </div>

                      {/* Internal Staff Notes */}
                      {t.comments && t.comments.length > 0 && (
                        <div className="pt-2">
                          <p className="text-[11px] font-bold text-slate-500 uppercase mb-2">Staff Internal Notes</p>
                          <div className="space-y-2">
                            {t.comments.map((c) => (
                              <div key={c.id} className="p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                                <span className="font-bold text-emerald-600">{c.author?.name || 'Staff'}: </span>
                                <span className="text-slate-700 dark:text-slate-300">{c.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* MARK RESOLVED MODAL */}
      <Dialog
        open={isResolveModalOpen}
        onOpenChange={setIsResolveModalOpen}
        title={`Resolve Ticket ${selectedTicket?.ticketCode}`}
        description="MANDATORY: Upload resolution photo proof and enter technician completion summary."
      >
        <form onSubmit={handleConfirmResolve} className="space-y-4 pt-2">
          {resolveError && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {resolveError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-emerald-600" />
              Resolution Proof Photo (Mandatory) *
            </label>
            <p className="text-xs text-slate-500 mb-2">Select or upload verified photo of completed fix:</p>

            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_PROOF_PHOTOS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setResolutionProofUrl(p.url)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all ${
                    resolutionProofUrl === p.url
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="h-10 w-10 object-cover rounded" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Technician Resolution Summary Note *
            </label>
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Replaced faulty circuit breaker and tested voltage parameters. All normal."
              rows={3}
              required
              className="mt-1 flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingResolve}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isSubmittingResolve ? 'Locking Resolution...' : 'Submit Resolution Proof'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
