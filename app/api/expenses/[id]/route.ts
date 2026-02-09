import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/expenses/[id] - Fetch single expense
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const expense = await prisma.expense.findUnique({
            where: { id }
        });

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error('GET Expense Error:', error);
        return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
    }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        const body = await req.json();
        const { title, amount, category, date, note, receiptUrl, receiptFileId } = body;

        // Check if expense exists
        const existing = await prisma.expense.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // If updating receipt, might need to delete old one
        // (This will be handled by the client before calling this API)

        const updated = await prisma.expense.update({
            where: { id },
            data: {
                title,
                amount: parseFloat(amount),
                category,
                date: new Date(date),
                note,
                receiptUrl: receiptUrl || null,
                receiptFileId: receiptFileId || null
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('UPDATE Expense Error:', error);
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        // Fetch expense to get receiptFileId (for Drive deletion)
        const expense = await prisma.expense.findUnique({ where: { id } });
        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }

        // Delete from database
        await prisma.expense.delete({ where: { id } });

        // Return the fileId so client can delete from Drive
        return NextResponse.json({
            success: true,
            receiptFileId: expense.receiptFileId
        });
    } catch (error) {
        console.error('DELETE Expense Error:', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}
