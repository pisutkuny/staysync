import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentSession } from '@/lib/auth/session';

// GET /api/recurring-expenses - Fetch all recurring expenses
export async function GET() {
    try {
        const recurring = await prisma.recurringExpense.findMany({
            orderBy: [
                { isActive: 'desc' },
                { dayOfMonth: 'asc' }
            ]
        });
        return NextResponse.json(recurring);
    } catch (error) {
        console.error('GET Recurring Expenses Error:', error);
        return NextResponse.json({ error: 'Failed to fetch recurring expenses' }, { status: 500 });
    }
}

// POST /api/recurring-expenses - Create new recurring expense
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, amount, category, note, dayOfMonth } = body;

        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const recurring = await prisma.recurringExpense.create({
            data: {
                title,
                amount: parseFloat(amount),
                category,
                note,
                dayOfMonth: parseInt(dayOfMonth) || 1,
                isActive: true,
                organizationId: session.organizationId
            }
        });

        return NextResponse.json(recurring);
    } catch (error) {
        console.error('POST Recurring Expense Error:', error);
        return NextResponse.json({ error: 'Failed to create recurring expense' }, { status: 500 });
    }
}
