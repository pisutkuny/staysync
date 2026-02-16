import { Suspense } from "react";
import { getExpensesData } from "@/lib/data/expenses";
import ExpensesClient from "./ExpensesClient";
import ExpensesLoading from "./loading";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default async function ExpensesPage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    const today = new Date();
    const startDate = format(startOfMonth(today), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(today), 'yyyy-MM-dd');
    const currentMonth = format(today, 'yyyy-MM');

    // Default to 100 items per page for monthly view to show most items
    const { expenses, pagination } = await getExpensesData(1, 100, startDate, endDate);

    const serializedExpenses = expenses.map(expense => ({
        ...expense,
        date: expense.date.toISOString(),
        createdAt: expense.createdAt.toISOString(),
        updatedAt: expense.updatedAt.toISOString(),
    }));

    return (
        <Suspense fallback={<ExpensesLoading />}>
            <ExpensesClient
                initialExpenses={serializedExpenses}
                initialPagination={pagination}
                initialDateFrom={startDate}
                initialDateTo={endDate}
                initialMonth={currentMonth}
            />
        </Suspense>
    );
}
