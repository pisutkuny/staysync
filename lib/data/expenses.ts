import prisma from "@/lib/prisma";

export async function getExpensesData(page = 1, limit = 10) {
    try {
        const skip = (page - 1) * limit;

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                orderBy: { date: 'desc' },
                skip,
                take: limit
            }),
            prisma.expense.count()
        ]);

        return {
            expenses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to fetch expenses:", error);
        return {
            expenses: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0
            }
        };
    }
}
