'use client';

import React, { useState } from 'react';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  MapPin,
  Camera,
  Star,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { TicketDTO, UserDTO, Category, Priority, TicketStatus } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { SLA_HOURS, getSlaInfo } from '@/lib/sla';

interface CitizenPortalProps {
  currentUser: UserDTO;
  tickets: TicketDTO[];
  onCreateTicket: (data: any) => Promise<boolean>;
  onCloseTicket: (ticketId: string, rating: number, feedback: string) => Promise<boolean>;
  onRefresh: () => void;
}

const STEPPER_STAGES: { status: TicketStatus; label: string }[] = [
  { status: 'REPORTED', label: 'Reported' },
  { status: 'ASSIGNED', label: 'Assigned' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'RESOLVED', label: 'Resolved' },
  { status: 'CLOSED', label: 'Closed' },
];

export function CitizenPortal({
  currentUser,
  tickets,
  onCreateTicket,
  onCloseTicket,
  onRefresh,
}: CitizenPortalProps) {
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicketForRating, setSelectedTicketForRating] = useState<TicketDTO | null>(null);

  // Form states for new ticket
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('ELECTRICAL');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [building, setBuilding] = useState('Science Block B');
  const [floor, setFloor] = useState('Floor 2');
  const [room, setRoom] = useState('Room 204');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Rating modal states
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Sample photo choices for simulated upload
  const SAMPLE_PHOTOS = [
    { label: 'HVAC Unit Fault', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=60' },
    { label: 'Electrical Switch Panel', url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=600&auto=format&fit=crop&q=60' },
    { label: 'Plumbing Sink Pipe', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=60' },
    { label: 'Door Lock Repair', url: 'https://images.unsplash.com/photo-1517999186661-ac0f0aef3699?w=600&auto=format&fit=crop&q=60' },
  ];

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const ok = await onCreateTicket({
        title,
        description,
        category,
        priority,
        building,
        floor,
        room,
        photoUrl: photoUrl || null,
        reportedById: currentUser.id,
      });

      if (ok) {
        setIsCreateOpen(false);
        setTitle('');
        setDescription('');
        setPhotoUrl('');
      } else {
        setFormError('Failed to create ticket. Please check input parameters.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingSubmit = async () => {
    if (!selectedTicketForRating) return;
    setIsClosing(true);
    try {
      const ok = await onCloseTicket(selectedTicketForRating.id, rating, feedback);
      if (ok) {
        setSelectedTicketForRating(null);
        setFeedback('');
      }
    } finally {
      setIsClosing(false);
    }
  };

  const citizenTickets = tickets.filter(
    (t) => t.reportedById === currentUser.id || true // Show all tickets in citizen portal for instant full demo exploration
  );

  return (
    <div className="space-y-6">
      {/* Banner / Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-indigo-700/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200 border border-indigo-400/30 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>Campus Citizen Self-Service Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Report & Track Campus Facilities Issues
            </h1>
            <p className="mt-1 text-sm text-indigo-200 max-w-2xl">
              Logged in as <strong className="text-white font-semibold">{currentUser.name}</strong> ({currentUser.department}). Guaranteed SLA resolution tracking with automated priority response timers.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            size="lg"
            className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-lg shadow-black/20"
          >
            <PlusCircle className="mr-2 h-5 w-5 text-indigo-600" />
            Report New Issue
          </Button>
        </div>
      </div>

      {/* SLA Speed Card Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { priority: 'CRITICAL', time: '4 Hours SLA', color: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-300' },
          { priority: 'HIGH', time: '12 Hours SLA', color: 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300' },
          { priority: 'MEDIUM', time: '24 Hours SLA', color: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300' },
          { priority: 'LOW', time: '48 Hours SLA', color: 'border-l-slate-400 bg-slate-50/50 dark:bg-slate-800/20 text-slate-700 dark:text-slate-300' },
        ].map((item) => (
          <div key={item.priority} className={`rounded-xl border border-slate-200 p-3.5 border-l-4 ${item.color} shadow-sm`}>
            <p className="text-xs font-bold tracking-wider uppercase opacity-80">{item.priority} Priority</p>
            <p className="text-base font-extrabold mt-0.5">{item.time}</p>
          </div>
        ))}
      </div>

      {/* Ticket List Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          Active Campus Tickets ({citizenTickets.length})
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Click any ticket for state audit & status timeline
        </span>
      </div>

      {/* Ticket Cards Grid */}
      <div className="space-y-4">
        {citizenTickets.map((t) => {
          const sla = getSlaInfo(t.priority, t.slaDeadline, t.status, t.resolvedAt);
          const currentStageIndex = STEPPER_STAGES.findIndex((s) => s.status === t.status);

          return (
            <Card key={t.id} className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  {/* Left Metadata */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {t.ticketCode}
                      </span>

                      <Badge variant={t.priority === 'CRITICAL' ? 'destructive' : t.priority === 'HIGH' ? 'warning' : 'default'}>
                        {t.priority}
                      </Badge>

                      <Badge variant="outline" className="font-medium uppercase text-[10px]">
                        {t.category}
                      </Badge>

                      {/* SLA Countdown Badge */}
                      <Badge
                        variant={sla.isBreached ? 'destructive' : sla.status === 'NEARING_BREACH' ? 'warning' : 'success'}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        <span>{sla.formattedRemaining}</span>
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white pt-1">
                      {t.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        {t.building}, {t.floor}, {t.room}
                      </span>
                      <span>•</span>
                      <span>Reported by {t.reportedBy?.name || 'Citizen'}</span>
                      <span>•</span>
                      <span>Assigned to: <strong className="text-slate-700 dark:text-slate-300 font-medium">{t.assignedTo?.name || 'Pending Dispatch'}</strong></span>
                    </div>
                  </div>

                  {/* Right Action Button for Citizen */}
                  {t.status === 'RESOLVED' && (
                    <Button
                      onClick={() => setSelectedTicketForRating(t)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md animate-bounce"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Verify Fix & Rate
                    </Button>
                  )}
                  {t.status === 'CLOSED' && (
                    <div className="flex flex-col items-end text-right">
                      <Badge variant="success" className="mb-1">
                        Resolved & Closed
                      </Badge>
                      {t.rating && (
                        <div className="flex items-center text-amber-500 text-xs font-bold">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                          ))}
                          <span className="ml-1 text-slate-600 dark:text-slate-400">({t.rating}/5)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Description & Photo Attachments */}
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {t.description}
                </p>

                {/* Media Proof Photos Comparison */}
                {(t.photoUrl || t.resolutionProofUrl) && (
                  <div className="mt-4 flex flex-wrap gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {t.photoUrl && (
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Issue Photo Attachment</p>
                        <img
                          src={t.photoUrl}
                          alt="Issue photo"
                          className="h-24 w-36 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                        />
                      </div>
                    )}
                    {t.resolutionProofUrl && (
                      <div>
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Staff Resolution Proof</p>
                        <img
                          src={t.resolutionProofUrl}
                          alt="Resolution proof"
                          className="h-24 w-36 object-cover rounded-lg border-2 border-emerald-500 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 5-Step Visual Stepper Tracker */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Audit Lifecycle Stepper Pipeline
                  </p>

                  <div className="relative flex items-center justify-between">
                    {/* Connecting line */}
                    <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-slate-200 dark:bg-slate-800 z-0" />
                    <div
                      className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-indigo-600 transition-all duration-500 z-0"
                      style={{
                        width: `${(currentStageIndex / (STEPPER_STAGES.length - 1)) * 100}%`,
                      }}
                    />

                    {/* Nodes */}
                    {STEPPER_STAGES.map((stage, idx) => {
                      const isPassed = idx <= currentStageIndex;
                      const isCurrent = idx === currentStageIndex;

                      return (
                        <div key={stage.status} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shadow-md ${
                              isCurrent
                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/50 scale-110'
                                : isPassed
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isPassed ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                          </div>
                          <span
                            className={`mt-1.5 text-[11px] font-semibold tracking-tight ${
                              isCurrent
                                ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                                : isPassed
                                ? 'text-slate-700 dark:text-slate-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CREATE NEW ISSUE MODAL */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Report Campus Facility Issue"
        description="Submit a verified facility report. Priority determines dynamic SLA resolution deadline."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 text-xs bg-red-50 text-red-700 rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Issue Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Main Distribution Substation Breaker Tripped"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Category *</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-1"
              >
                <option value="ELECTRICAL">Electrical</option>
                <option value="HVAC">HVAC</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="NETWORK">Network</option>
                <option value="CARPENTRY">Carpentry</option>
                <option value="JANITORIAL">Janitorial</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Priority *</label>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="mt-1"
              >
                <option value="CRITICAL">CRITICAL (4 Hours SLA)</option>
                <option value="HIGH">HIGH (12 Hours SLA)</option>
                <option value="MEDIUM">MEDIUM (24 Hours SLA)</option>
                <option value="LOW">LOW (48 Hours SLA)</option>
              </Select>
            </div>
          </div>

          {/* Dynamic SLA Preview Callout */}
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 p-3 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Calculated Target SLA Resolution:</span>
            </div>
            <strong className="font-extrabold text-indigo-700 dark:text-indigo-300 uppercase">
              {SLA_HOURS[priority]} Hours
            </strong>
          </div>

          {/* Location details */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Building *</label>
              <Input
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="Building"
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Floor *</label>
              <Input
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="Floor"
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Room *</label>
              <Input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Room"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about the issue..."
              rows={3}
              required
              className="mt-1 flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Photo attachment simulation */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-indigo-600" />
              Simulated Photo Attachment
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {SAMPLE_PHOTOS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPhotoUrl(p.url)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs text-left transition-all ${
                    photoUrl === p.url
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 font-bold text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="h-8 w-8 object-cover rounded" />
                  <span className="truncate">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 font-bold text-white">
              {isSubmitting ? 'Logging Ticket...' : 'Submit & Start SLA Clock'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* RATING & CLOSING DIALOG */}
      <Dialog
        open={!!selectedTicketForRating}
        onOpenChange={(op) => !op && setSelectedTicketForRating(null)}
        title="Confirm Resolution & Submit Feedback"
        description={`Validate the work done for ticket ${selectedTicketForRating?.ticketCode}.`}
      >
        <div className="space-y-4 pt-2">
          {selectedTicketForRating?.resolutionProofUrl && (
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Technician's Proof of Fix Photo:
              </p>
              <img
                src={selectedTicketForRating.resolutionProofUrl}
                alt="Proof"
                className="h-40 w-full object-cover rounded-xl border-2 border-emerald-500 shadow-md"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Service Rating (1 to 5 Stars) *
            </label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Feedback / Comments
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Excellent service, fixed quickly!"
              rows={3}
              className="mt-1 flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSelectedTicketForRating(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRatingSubmit}
              disabled={isClosing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {isClosing ? 'Closing Ticket...' : 'Confirm Fix & Close Ticket'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
