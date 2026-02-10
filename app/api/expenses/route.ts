
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { note: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (category) {
            where.category = category;
        }

        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) where.date.lte = new Date(dateTo);
        }

        // Fetch expenses and total count
        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take: limit
            }),
            prisma.expense.count({ where })
        ]);

        return NextResponse.json({
            expenses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('GET Expenses Error:', error);
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, amount, category, date, note, receiptUrl, receiptFileId } = body;

        const session = await getCurrentSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const expense = await prisma.expense.create({
            data: {
                title,
                amount: parseFloat(amount),
                category,
                date: new Date(date),
                note,
                receiptUrl: receiptUrl || null,
                receiptFileId: receiptFileId || null,
                organizationId: session.organizationId
            }
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error('POST Expense Error:', error);
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}
