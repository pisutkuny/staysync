import { Suspense } from "react";
import { getExpensesData } from "@/lib/data/expenses";
import ExpensesClient from "./ExpensesClient";
import ExpensesLoading from "./loading";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    const { expenses, pagination } = await getExpensesData(1, 10);

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
            />
        </Suspense>
    );
}
