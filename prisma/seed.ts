import { PrismaClient } from '@prisma/client';
import { INITIAL_USERS, INITIAL_TICKETS } from '../src/lib/mock-store';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FixFlow Database Seeding...');

  // Clear existing records cleanly
  await prisma.ticketComment.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log('👤 Seeding Users...');
  for (const u of INITIAL_USERS) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        phone: u.phone,
      },
    });
  }

  // Create Tickets and related entities
  console.log('🎫 Seeding Tickets...');
  for (const t of INITIAL_TICKETS) {
    await prisma.ticket.create({
      data: {
        id: t.id,
        ticketCode: t.ticketCode,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status,
        building: t.building,
        floor: t.floor,
        room: t.room,
        photoUrl: t.photoUrl,
        resolutionProofUrl: t.resolutionProofUrl,
        reportedById: t.reportedById,
        assignedToId: t.assignedToId,
        slaDeadline: new Date(t.slaDeadline),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
        rating: t.rating,
        feedback: t.feedback,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        history: {
          create: (t.history || []).map((h) => ({
            id: h.id,
            action: h.action,
            fromStatus: h.fromStatus,
            toStatus: h.toStatus,
            changedById: h.changedById,
            note: h.note,
            timestamp: new Date(h.timestamp),
          })),
        },
        comments: {
          create: (t.comments || []).map((c) => ({
            id: c.id,
            authorId: c.authorId,
            message: c.message,
            isInternal: c.isInternal,
            createdAt: new Date(c.createdAt),
          })),
        },
      },
    });
  }

  console.log('✅ FixFlow Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error Seeding Database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
