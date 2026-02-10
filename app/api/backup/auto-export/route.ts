// Auto-export API for GitHub Actions (API key protected)
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // Check API key
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (token !== process.env.BACKUP_API_KEY) {
            console.error('❌ Unauthorized backup attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🤖 Auto backup started (GitHub Actions)');

        // Export all tables (same as manual export)
        const [
            users,
            rooms,
            residents,
            billing,
            expenses,
            recurringExpenses,
            issues,
            documents,
            centralMeters,
            lineBotStates
        ] = await Promise.all([
            prisma.user.findMany(),
            prisma.room.findMany(),
            prisma.resident.findMany(),
            prisma.billing.findMany(),
            prisma.expense.findMany(),
            prisma.recurringExpense.findMany(),
            prisma.issue.findMany(),
            prisma.document.findMany(),
            prisma.centralMeter.findMany(),
            prisma.lineBotState.findMany()
        ]);

        const backup = {
            metadata: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                source: 'auto-github-actions',
                totalRecords: users.length + rooms.length + residents.length +
                    billing.length + expenses.length + recurringExpenses.length +
                    issues.length + documents.length + centralMeters.length + lineBotStates.length
            },
            data: {
                users,
                rooms,
                residents,
                billing,
                expenses,
                recurringExpenses,
                issues,
                documents,
                centralMeters,
                lineBotStates
            }
        };

        console.log(`✅ Auto backup created: ${backup.metadata.totalRecords} records`);

        // Return JSON directly (for GitHub Actions to save)
        return new NextResponse(JSON.stringify(backup, null, 2), {
            headers: {
                'Content-Type': 'application/json'
            }
        });

    } catch (error) {
        console.error('❌ Auto backup failed:', error);
        return NextResponse.json({ error: 'Auto backup failed' }, { status: 500 });
    }
}
