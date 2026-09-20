import { NextResponse } from 'next/server';
import { getTicketsStore, calculateAdminAnalytics } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tickets = await getTicketsStore();
    const analytics = await calculateAdminAnalytics(tickets);
    return NextResponse.json({ success: true, data: analytics });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
