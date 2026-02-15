import { Suspense } from "react";
import { getRecurringExpenses } from "@/lib/data/recurringExpenses";
import RecurringExpensesClient from "./RecurringExpensesClient";
import RecurringExpensesLoading from "./loading";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function RecurringExpensesPage() {
    const session = await getCurrentSession();

    if (!session) {
        redirect("/login");
    }

    const recurring = await getRecurringExpenses();

    const serializedRecurring = recurring.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
    }));

    return (
        <Suspense fallback={<RecurringExpensesLoading />}>
            <RecurringExpensesClient initialRecurring={serializedRecurring} />
        </Suspense>
    );
}
