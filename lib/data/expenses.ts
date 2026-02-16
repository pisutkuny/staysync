import prisma from "@/lib/prisma";

export async function getExpensesData(page = 1, limit = 10, dateFrom?: string, dateTo?: string) {
    try {
        const skip = (page - 1) * limit;

        const where: any = {};
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) where.date.gte = new Date(dateFrom);
            if (dateTo) where.date.lte = new Date(dateTo);
        }

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take: limit
            }),
            prisma.expense.count({ where })
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
