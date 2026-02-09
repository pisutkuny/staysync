import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/recurring-expenses/[id]
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const recurring = await prisma.recurringExpense.findUnique({
            where: { id }
        });

        if (!recurring) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        return NextResponse.json(recurring);
    } catch (error) {
        console.error('GET Single Recurring Expense Error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

// PUT /api/recurring-expenses/[id]
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await req.json();
        const { title, amount, category, note, dayOfMonth, isActive } = body;

        const updated = await prisma.recurringExpense.update({
            where: { id },
            data: {
                title,
                amount: parseFloat(amount),
                category,
                note,
                dayOfMonth: parseInt(dayOfMonth),
                isActive
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('PUT Recurring Expense Error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

// DELETE /api/recurring-expenses/[id]
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        await prisma.recurringExpense.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DELETE Recurring Expense Error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
