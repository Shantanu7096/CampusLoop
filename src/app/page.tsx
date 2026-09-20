'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { CitizenPortal } from '@/components/CitizenPortal';
import { StaffDashboard } from '@/components/StaffDashboard';
import { AdminCommandCenter } from '@/components/AdminCommandCenter';
import { Role, TicketDTO, UserDTO, AdminAnalyticsDTO, TicketStatus } from '@/lib/types';
import { INITIAL_USERS, INITIAL_TICKETS } from '@/lib/mock-store';
import { calculateAdminAnalytics } from '@/lib/store';

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<Role>('CITIZEN');
  const [tickets, setTickets] = useState<TicketDTO[]>(INITIAL_TICKETS);
  const [users, setUsers] = useState<UserDTO[]>(INITIAL_USERS);
  const [analytics, setAnalytics] = useState<AdminAnalyticsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active Users for each role demo perspective
  const citizenUser = users.find((u) => u.role === 'CITIZEN') || users[0];
  const staffUser = users.find((u) => u.role === 'STAFF') || users[1];
  const staffUsersList = users.filter((u) => u.role === 'STAFF');

  const fetchLatestData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTickets(json.data);
        }
      }

      const analyticsRes = await fetch('/api/analytics');
      if (analyticsRes.ok) {
        const aJson = await analyticsRes.json();
        if (aJson.success && aJson.data) {
          setAnalytics(aJson.data);
        }
      }
    } catch (e) {
      console.warn('API fetch fallback to client computation:', e);
      const computed = await calculateAdminAnalytics(tickets);
      setAnalytics(computed);
    } finally {
      setIsRefreshing(false);
    }
  }, [tickets]);

  useEffect(() => {
    fetchLatestData();
  }, []);

  // Sync analytics whenever tickets change
  useEffect(() => {
    calculateAdminAnalytics(tickets).then((an) => setAnalytics(an));
  }, [tickets]);

  // Action 1: Create Ticket (Citizen)
  const handleCreateTicket = async (data: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTickets((prev) => [json.data, ...prev]);
          return true;
        }
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    }

    // Client fallback
    const mockCode = `FF-${1001 + tickets.length}`;
    const now = new Date();
    const deadlineHours = data.priority === 'CRITICAL' ? 4 : data.priority === 'HIGH' ? 12 : data.priority === 'MEDIUM' ? 24 : 48;
    const slaDeadline = new Date(now.getTime() + deadlineHours * 3600 * 1000).toISOString();

    const newTicket: TicketDTO = {
      id: `tkt-${Date.now()}`,
      ticketCode: mockCode,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'REPORTED',
      building: data.building,
      floor: data.floor,
      room: data.room,
      photoUrl: data.photoUrl || null,
      reportedById: data.reportedById,
      reportedBy: citizenUser,
      assignedToId: null,
      assignedTo: null,
      slaDeadline,
      resolvedAt: null,
      rating: null,
      feedback: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      history: [
        {
          id: `hst-${Date.now()}`,
          ticketId: `tkt-${Date.now()}`,
          action: 'STATUS_CHANGE',
          fromStatus: null,
          toStatus: 'REPORTED',
          changedById: citizenUser.id,
          changedBy: citizenUser,
          note: `Ticket ${mockCode} logged by ${citizenUser.name}`,
          timestamp: now.toISOString(),
        },
      ],
      comments: [],
    };

    setTickets((prev) => [newTicket, ...prev]);
    return true;
  };

  // Action 2: Assign Ticket (Admin)
  const handleAssignTicket = async (ticketId: string, staffId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: staffId,
          assignedById: 'usr-admin-1',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? json.data : t)));
          return true;
        }
      }
    } catch (err) {
      console.error('Error assigning ticket:', err);
    }

    const targetStaff = users.find((u) => u.id === staffId);
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'ASSIGNED' as const,
            assignedToId: staffId,
            assignedTo: targetStaff || null,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    return true;
  };

  // Action 3: Update Ticket Status (Staff)
  const handleUpdateStatus = async (
    ticketId: string,
    newStatus: TicketStatus,
    resolutionProofUrl?: string,
    note?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newStatus,
          performedById: staffUser.id,
          resolutionProofUrl,
          note,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? json.data : t)));
          return true;
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }

    const now = new Date();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: newStatus,
            resolvedAt: newStatus === 'RESOLVED' ? now.toISOString() : t.resolvedAt,
            resolutionProofUrl: newStatus === 'RESOLVED' ? (resolutionProofUrl || t.resolutionProofUrl) : t.resolutionProofUrl,
            updatedAt: now.toISOString(),
          };
        }
        return t;
      })
    );
    return true;
  };

  // Action 4: Close & Rate Ticket (Citizen)
  const handleCloseTicket = async (ticketId: string, rating: number, feedback: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closedById: citizenUser.id,
          rating,
          feedback,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTickets((prev) => prev.map((t) => (t.id === ticketId ? json.data : t)));
          return true;
        }
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
    }

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'CLOSED' as const,
            rating,
            feedback,
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    return true;
  };

  const slaBreachCount = analytics?.slaBreachCount || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        slaBreachCount={slaBreachCount}
        onRefresh={fetchLatestData}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'CITIZEN' && (
          <CitizenPortal
            currentUser={citizenUser}
            tickets={tickets}
            onCreateTicket={handleCreateTicket}
            onCloseTicket={handleCloseTicket}
            onRefresh={fetchLatestData}
          />
        )}

        {currentRole === 'STAFF' && (
          <StaffDashboard
            currentStaff={staffUser}
            tickets={tickets}
            onUpdateStatus={handleUpdateStatus}
            onRefresh={fetchLatestData}
          />
        )}

        {currentRole === 'ADMIN' && analytics && (
          <AdminCommandCenter
            analytics={analytics}
            tickets={tickets}
            staffUsers={staffUsersList}
            onAssignTicket={handleAssignTicket}
            onRefresh={fetchLatestData}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <p>FixFlow Campus Operations Platform — Enterprise Hackathon Edition</p>
      </footer>
    </div>
  );
}
