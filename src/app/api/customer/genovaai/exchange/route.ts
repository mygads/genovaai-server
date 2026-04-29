import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Balance exchange is disabled. Paid AI usage uses account balance directly.' },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Balance exchange is disabled. Paid AI usage uses account balance directly.' },
    { status: 410 }
  );
}
