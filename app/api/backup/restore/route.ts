// API endpoint to restore database from JSON backup
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { getCurrentSession } from '@/lib/auth/session';

export async function POST(request: Request) {
    try {
        // Check admin auth
        const session = await getCurrentSession();

        if (!session || (session.role !== 'ADMIN' && session.role !== 'OWNER')) {
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
        // Level 4
        await prisma.lineBotState.deleteMany();
        await prisma.centralMeter.deleteMany();
        await prisma.document.deleteMany();
        await prisma.issue.deleteMany();
        await prisma.recurringExpense.deleteMany();
        await prisma.expense.deleteMany();
        await prisma.billing.deleteMany();
        await prisma.auditLog.deleteMany();

        // Level 3
        await prisma.resident.deleteMany();
        await prisma.systemConfig.deleteMany();

        // Level 2
        await prisma.room.deleteMany();
        await prisma.user.deleteMany();

        // Level 1
        await prisma.organization.deleteMany();

        console.log('✅ Existing data deleted');

        // Restore data (in order of dependencies)
        console.log('📥 Importing backup data...');

        const results = {
            organizations: 0,
            users: 0,
            rooms: 0,
            systemConfigs: 0,
            residents: 0,
            billing: 0,
            expenses: 0,
            recurringExpenses: 0,
            issues: 0,
            documents: 0,
            centralMeters: 0,
            lineBotStates: 0,
            auditLogs: 0
        };

        // Organizations (Level 1)
        if (backup.data.organizations?.length > 0) {
            await prisma.organization.createMany({ data: backup.data.organizations });
            results.organizations = backup.data.organizations.length;
        }

        // Users & Rooms (Level 2)
        if (backup.data.users?.length > 0) {
            await prisma.user.createMany({ data: backup.data.users });
            results.users = backup.data.users.length;
        }
        if (backup.data.rooms?.length > 0) {
            await prisma.room.createMany({ data: backup.data.rooms });
            results.rooms = backup.data.rooms.length;
        }

        // System Config & Residents (Level 3)
        if (backup.data.systemConfigs?.length > 0) {
            await prisma.systemConfig.createMany({ data: backup.data.systemConfigs });
            results.systemConfigs = backup.data.systemConfigs.length;
        }
        if (backup.data.residents?.length > 0) {
            await prisma.resident.createMany({ data: backup.data.residents });
            results.residents = backup.data.residents.length;
        }

        // Others (Level 4)
        if (backup.data.billing?.length > 0) {
            await prisma.billing.createMany({ data: backup.data.billing });
            results.billing = backup.data.billing.length;
        }
        if (backup.data.expenses?.length > 0) {
            await prisma.expense.createMany({ data: backup.data.expenses });
            results.expenses = backup.data.expenses.length;
        }
        if (backup.data.recurringExpenses?.length > 0) {
            await prisma.recurringExpense.createMany({ data: backup.data.recurringExpenses });
            results.recurringExpenses = backup.data.recurringExpenses.length;
        }
        if (backup.data.issues?.length > 0) {
            await prisma.issue.createMany({ data: backup.data.issues });
            results.issues = backup.data.issues.length;
        }
        if (backup.data.documents?.length > 0) {
            await prisma.document.createMany({ data: backup.data.documents });
            results.documents = backup.data.documents.length;
        }
        if (backup.data.centralMeters?.length > 0) {
            await prisma.centralMeter.createMany({ data: backup.data.centralMeters });
            results.centralMeters = backup.data.centralMeters.length;
        }
        if (backup.data.lineBotStates?.length > 0) {
            await prisma.lineBotState.createMany({ data: backup.data.lineBotStates });
            results.lineBotStates = backup.data.lineBotStates.length;
        }
        if (backup.data.auditLogs?.length > 0) {
            await prisma.auditLog.createMany({ data: backup.data.auditLogs });
            results.auditLogs = backup.data.auditLogs.length;
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
