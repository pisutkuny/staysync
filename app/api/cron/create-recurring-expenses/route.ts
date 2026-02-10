import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Cron job endpoint to create expenses from recurring templates
export async function GET(req: Request) {
    try {
        // Verify cron secret (Vercel Cron will send this as Authorization header)
        const authHeader = req.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (authHeader !== expectedAuth) {
            console.error('Unauthorized cron attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const today = new Date();
        const dayOfMonth = today.getDate();

        console.log(`Running recurring expense cron for day ${dayOfMonth}`);

        // Get all active recurring expenses for today
        const recurringTemplates = await prisma.recurringExpense.findMany({
            where: {
                isActive: true,
                dayOfMonth: dayOfMonth
            }
        });

        console.log(`Found ${recurringTemplates.length} recurring templates to process`);

        // Create expenses from templates
        const created = [];
        for (const template of recurringTemplates) {
            const expense = await prisma.expense.create({
                data: {
                    title: template.title,
                    amount: template.amount,
                    category: template.category,
                    date: today,
                    note: template.note ? `${template.note} (Auto-created from recurring template)` : 'Auto-created from recurring template',
                    organizationId: template.organizationId
                }
            });
            created.push(expense);
        }

        console.log(`Successfully created ${created.length} expenses`);

        return NextResponse.json({
            success: true,
            created: created.length,
            expenses: created
        });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({
            error: 'Failed to process recurring expenses',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
