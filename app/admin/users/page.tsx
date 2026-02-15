import { Suspense } from "react";
import { getUsers } from "@/lib/data/users";
import UserManagementClient from "./UserManagementClient";
import UsersLoading from "./loading";
import { redirect } from "next/navigation";

export default async function UserManagementPage() {
    const { users, error, status } = await getUsers();

    if (status === 401) {
        redirect("/login");
    }

    if (status === 403) {
        redirect("/admin");
    }

    if (error) {
        // In a real app, you might want to render a specific error component
        // For now, we'll pass an empty list or throw, but let's just log and pass empty
        console.error("UserManagementPage Error:", error);
    }

    const serializedUsers = users?.map(user => ({
        ...user,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString()
    })) || [];

    return (
        <Suspense fallback={<UsersLoading />}>
            <UserManagementClient initialUsers={serializedUsers} />
        </Suspense>
    );
}
