
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const expenses = await prisma.expense.findMany({
            orderBy: { date: 'desc' },
            take: 100
        });
        return NextResponse.json(expenses);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, amount, category, date, note } = body;

        const expense = await prisma.expense.create({
            data: {
                title,
                amount: parseFloat(amount),
                category,
                date: new Date(date),
                note
            }
        });

        return NextResponse.json(expense);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}
