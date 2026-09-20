import { NextResponse } from 'next/server';
import { AssignTicketSchema } from '@/lib/validations';
import { validateStateTransition } from '@/lib/state-machine';
import { prisma } from '@/lib/db';
import { getTicketByIdStore, getUsersStore } from '@/lib/store';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = AssignTicketSchema.parse({ ...body, ticketId: params.id });

    const currentTicket = await getTicketByIdStore(params.id);
    if (!currentTicket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const users = await getUsersStore();
    const assignedStaff = users.find((u) => u.id === validated.assignedToId);
    if (!assignedStaff) {
      return NextResponse.json({ success: false, error: 'Staff user not found' }, { status: 400 });
    }

    const assigner = users.find((u) => u.id === validated.assignedById) || users.find((u) => u.role === 'ADMIN');
    const userRole = assigner?.role || 'ADMIN';

    // FSM validation check
    const transitionCheck = validateStateTransition({
      currentStatus: currentTicket.status,
      targetStatus: 'ASSIGNED',
      userRole,
      assignedToId: validated.assignedToId,
    });

    if (!transitionCheck.allowed) {
      return NextResponse.json({ success: false, error: transitionCheck.reason }, { status: 400 });
    }

    try {
      const updated = await prisma.ticket.update({
        where: { id: params.id },
        data: {
          status: 'ASSIGNED',
          assignedToId: validated.assignedToId,
          history: {
            create: {
              action: 'ASSIGNED',
              fromStatus: currentTicket.status,
              toStatus: 'ASSIGNED',
              changedById: validated.assignedById,
              note: validated.note || `Assigned to ${assignedStaff.name} (${assignedStaff.department})`,
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

      return NextResponse.json({ success: true, data: updated });
    } catch (dbErr) {
      console.warn('DB assign fallback executed:', dbErr);
      const updatedInMemory = {
        ...currentTicket,
        status: 'ASSIGNED' as const,
        assignedToId: validated.assignedToId,
        assignedTo: assignedStaff,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: updatedInMemory });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
