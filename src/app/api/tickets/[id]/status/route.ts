import { NextResponse } from 'next/server';
import { UpdateStatusSchema } from '@/lib/validations';
import { validateStateTransition } from '@/lib/state-machine';
import { prisma } from '@/lib/db';
import { getTicketByIdStore, getUsersStore } from '@/lib/store';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = UpdateStatusSchema.parse({ ...body, ticketId: params.id });

    const currentTicket = await getTicketByIdStore(params.id);
    if (!currentTicket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const users = await getUsersStore();
    const performer = users.find((u) => u.id === validated.performedById) || users[1];
    const userRole = performer.role;

    // FSM validation check
    const transitionCheck = validateStateTransition({
      currentStatus: currentTicket.status,
      targetStatus: validated.newStatus,
      userRole,
      assignedToId: currentTicket.assignedToId,
      resolutionProofUrl: validated.resolutionProofUrl,
      note: validated.note,
    });

    if (!transitionCheck.allowed) {
      return NextResponse.json({ success: false, error: transitionCheck.reason }, { status: 400 });
    }

    const now = new Date();
    const isResolving = validated.newStatus === 'RESOLVED';

    try {
      const updated = await prisma.ticket.update({
        where: { id: params.id },
        data: {
          status: validated.newStatus,
          ...(isResolving ? {
            resolvedAt: now,
            resolutionProofUrl: validated.resolutionProofUrl || currentTicket.resolutionProofUrl,
          } : {}),
          history: {
            create: {
              action: 'STATUS_CHANGE',
              fromStatus: currentTicket.status,
              toStatus: validated.newStatus,
              changedById: validated.performedById,
              note: validated.note || `Status updated to ${validated.newStatus} by ${performer.name}`,
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
      console.warn('DB updateStatus fallback executed:', dbErr);
      const updatedInMemory = {
        ...currentTicket,
        status: validated.newStatus,
        resolvedAt: isResolving ? now.toISOString() : currentTicket.resolvedAt,
        resolutionProofUrl: isResolving ? (validated.resolutionProofUrl || currentTicket.resolutionProofUrl) : currentTicket.resolutionProofUrl,
        updatedAt: now.toISOString(),
      };
      return NextResponse.json({ success: true, data: updatedInMemory });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
