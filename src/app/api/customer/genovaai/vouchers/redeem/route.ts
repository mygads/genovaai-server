import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Direct balance voucher redemption is disabled. Vouchers are only applied as top-up discounts.' },
    { status: 410 }
  );
}
