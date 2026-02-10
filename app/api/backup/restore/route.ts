// API endpoint to restore database from JSON backup
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

        const body = await request.json();
        const { backup } = body;

        if (!backup || !backup.metadata || !backup.data) {
            return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
        }

        console.log('🔄 Starting database restore...');
        console.log(`📦 Backup from: ${backup.metadata.exportDate}`);
        console.log(`📊 Total records: ${backup.metadata.totalRecords}`);

        // Delete all existing data (in reverse order of dependencies)
        console.log('🗑️  Deleting existing data...');
        await prisma.lineBotState.deleteMany();
        await prisma.centralMeter.deleteMany();
        await prisma.document.deleteMany();
        await prisma.issue.deleteMany();
        await prisma.recurringExpense.deleteMany();
        await prisma.expense.deleteMany();
        await prisma.billing.deleteMany();
        await prisma.resident.deleteMany();
        await prisma.room.deleteMany();
        await prisma.user.deleteMany();
        console.log('✅ Existing data deleted');

        // Restore data (in order of dependencies)
        console.log('📥 Importing backup data...');

        const results = {
            users: 0,
            rooms: 0,
            residents: 0,
            billing: 0,
            expenses: 0,
            recurringExpenses: 0,
            issues: 0,
            documents: 0,
            centralMeters: 0,
            lineBotStates: 0
        };

        // Users
        if (backup.data.users?.length > 0) {
            await prisma.user.createMany({ data: backup.data.users });
            results.users = backup.data.users.length;
        }

        // Rooms
        if (backup.data.rooms?.length > 0) {
            await prisma.room.createMany({ data: backup.data.rooms });
            results.rooms = backup.data.rooms.length;
        }

        // Residents
        if (backup.data.residents?.length > 0) {
            await prisma.resident.createMany({ data: backup.data.residents });
            results.residents = backup.data.residents.length;
        }

        // Billing
        if (backup.data.billing?.length > 0) {
            await prisma.billing.createMany({ data: backup.data.billing });
            results.billing = backup.data.billing.length;
        }

        // Expenses
        if (backup.data.expenses?.length > 0) {
            await prisma.expense.createMany({ data: backup.data.expenses });
            results.expenses = backup.data.expenses.length;
        }

        // Recurring Expenses
        if (backup.data.recurringExpenses?.length > 0) {
            await prisma.recurringExpense.createMany({ data: backup.data.recurringExpenses });
            results.recurringExpenses = backup.data.recurringExpenses.length;
        }

        // Issues
        if (backup.data.issues?.length > 0) {
            await prisma.issue.createMany({ data: backup.data.issues });
            results.issues = backup.data.issues.length;
        }

        // Documents
        if (backup.data.documents?.length > 0) {
            await prisma.document.createMany({ data: backup.data.documents });
            results.documents = backup.data.documents.length;
        }

        // Central Meters
        if (backup.data.centralMeters?.length > 0) {
            await prisma.centralMeter.createMany({ data: backup.data.centralMeters });
            results.centralMeters = backup.data.centralMeters.length;
        }

        // Line Bot States
        if (backup.data.lineBotStates?.length > 0) {
            await prisma.lineBotState.createMany({ data: backup.data.lineBotStates });
            results.lineBotStates = backup.data.lineBotStates.length;
        }

        console.log('✅ Restore completed successfully!');
        console.log('📊 Imported:', results);

        return NextResponse.json({
            success: true,
            message: 'Restore completed successfully',
            results
        });

    } catch (error) {
        console.error('❌ Restore failed:', error);
        return NextResponse.json({
            error: 'Restore failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
