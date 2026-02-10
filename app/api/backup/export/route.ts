// API endpoint to export database as JSON
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // Check admin auth
        const cookieStore = await import('next/headers').then(m => m.cookies());
        const session = (await cookieStore).get('admin_session');

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('🔄 Starting database backup...');

        // Export all tables
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
            lineStates
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
            prisma.lineState.findMany()
        ]);

        // Create backup object
        const backup = {
            metadata: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                totalRecords: users.length + rooms.length + residents.length +
                    billing.length + expenses.length + recurringExpenses.length +
                    issues.length + documents.length + centralMeters.length + lineStates.length
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
                lineStates
            }
        };

        console.log(`✅ Backup created: ${backup.metadata.totalRecords} records`);

        // Return JSON
        return new NextResponse(JSON.stringify(backup, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="staysync-backup-${new Date().toISOString().split('T')[0]}.json"`
            }
        });

    } catch (error) {
        console.error('❌ Backup failed:', error);
        return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
    }
}
