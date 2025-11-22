import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const transaction = await prisma.balanceTransaction.findFirst({
      where: {
        id: params.id,
        userId,
      },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
