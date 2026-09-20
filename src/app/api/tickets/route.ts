import { NextResponse } from 'next/server';
import { getTicketsStore, generateTicketCode, getUsersStore } from '@/lib/store';
import { prisma } from '@/lib/db';
import { CreateTicketSchema } from '@/lib/validations';
import { calculateSlaDeadline } from '@/lib/sla';
import { TicketDTO } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tickets = await getTicketsStore();
    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CreateTicketSchema.parse(body);

    const ticketCode = await generateTicketCode();
    const slaDeadline = calculateSlaDeadline(validated.priority);

    let newTicket: TicketDTO;

    try {
      const created = await prisma.ticket.create({
        data: {
          ticketCode,
          title: validated.title,
          description: validated.description,
          category: validated.category,
          priority: validated.priority,
          status: 'REPORTED',
          building: validated.building,
          floor: validated.floor,
          room: validated.room,
          photoUrl: validated.photoUrl || null,
          reportedById: validated.reportedById,
          slaDeadline,
          history: {
            create: {
              action: 'STATUS_CHANGE',
              fromStatus: null,
              toStatus: 'REPORTED',
              changedById: validated.reportedById,
              note: `Ticket ${ticketCode} logged by user. Priority: ${validated.priority} (SLA: ${slaDeadline.toISOString()})`,
            },
          },
        },
        include: {
          reportedBy: true,
          assignedTo: true,
          history: { include: { changedBy: true } },
          comments: { include: { author: true } },
        },
      });

      newTicket = {
        ...created,
        slaDeadline: created.slaDeadline.toISOString(),
        resolvedAt: created.resolvedAt ? created.resolvedAt.toISOString() : null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        history: created.history.map((h) => ({ ...h, timestamp: h.timestamp.toISOString() })),
        comments: created.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
      } as TicketDTO;
    } catch (dbErr) {
      console.warn('Prisma create fallback executed:', dbErr);
      const users = await getUsersStore();
      const reporter = users.find((u) => u.id === validated.reportedById) || users[0];
      const now = new Date();
      newTicket = {
        id: `tkt-${Date.now()}`,
        ticketCode,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        priority: validated.priority,
        status: 'REPORTED',
        building: validated.building,
        floor: validated.floor,
        room: validated.room,
        photoUrl: validated.photoUrl || null,
        reportedById: validated.reportedById,
        reportedBy: reporter,
        assignedToId: null,
        assignedTo: null,
        slaDeadline: slaDeadline.toISOString(),
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
            changedById: validated.reportedById,
            changedBy: reporter,
            note: `Ticket ${ticketCode} logged by ${reporter.name}`,
            timestamp: now.toISOString(),
          },
        ],
        comments: [],
      };
    }

    return NextResponse.json({ success: true, data: newTicket }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
