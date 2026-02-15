import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getRecurringExpenses() {
    noStore(); // Disable caching for real-time data
    try {
        const recurring = await prisma.recurringExpense.findMany({
            orderBy: [
                { isActive: 'desc' },
                { dayOfMonth: 'asc' }
            ]
        });
        return recurring;
    } catch (error) {
        console.error('getRecurringExpenses Error:', error);
        throw new Error('Failed to fetch recurring expenses');
    }
}
