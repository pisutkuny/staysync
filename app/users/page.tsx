"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Shield, Mail, Phone, Calendar, Activity, X, Edit2, Trash2 } from "lucide-react";
import { useModal } from "@/app/context/ModalContext";

interface User {
    id: number;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    status: string;
    emailVerified: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export default function UsersPage() {
    const { showAlert, showConfirm } = useModal();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [inviteForm, setInviteForm] = useState({
        email: "",
        fullName: "",
        phone: "",
        role: "STAFF",
    });
    const [editForm, setEditForm] = useState({
        fullName: "",
        phone: "",
        role: "",
        status: "",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("/api/users/invite", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inviteForm),
            });

            const data = await res.json();

            if (res.ok) {
                showAlert("Success", `User invited! Temporary password: ${data.tempPassword}\n\nPlease save this password and send it to the user.`, "success");
                setShowInviteModal(false);
                setInviteForm({ email: "", fullName: "", phone: "", role: "STAFF" });
                fetchUsers();
            } else {
                showAlert("Error", data.error || "Failed to invite user", "error");
            }
        } catch (error) {
            console.error("Invite error:", error);
            showAlert("Error", "Failed to invite user", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setSubmitting(true);

        try {
            const res = await fetch(`/api/users/${selectedUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            const data = await res.json();

            if (res.ok) {
                showAlert("Success", "User updated successfully!", "success");
                setShowEditModal(false);
                setSelectedUser(null);
                fetchUsers();
            } else {
                showAlert("Error", data.error || "Failed to update user", "error");
            }
        } catch (error) {
            console.error("Update error:", error);
            showAlert("Error", "Failed to update user", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (user: User) => {
        const confirmed = await showConfirm(
            "Delete User",
            `Are you sure you want to delete ${user.fullName}?`,
            true
        );

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                showAlert("Success", "User deleted successfully!", "success");
                fetchUsers();
            } else {
                const data = await res.json();
                showAlert("Error", data.error || "Failed to delete user", "error");
            }
        } catch (error) {
            console.error("Delete error:", error);
            showAlert("Error", "Failed to delete user", "error");
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setEditForm({
            fullName: user.fullName,
            phone: user.phone || "",
            role: user.role,
            status: user.status,
        });
        setShowEditModal(true);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "OWNER":
                return "bg-purple-100 text-purple-700 border-purple-300";
            case "ADMIN":
                return "bg-blue-100 text-blue-700 border-blue-300";
            case "STAFF":
                return "bg-green-100 text-green-700 border-green-300";
            default:
                return "bg-gray-100 text-gray-700 border-gray-300";
        }
    };

    const getStatusBadgeColor = (status: string) => {
        return status === "Active"
            ? "bg-green-100 text-green-700 border-green-300"
            : "bg-red-100 text-red-700 border-red-300";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                                <Users className="text-white" size={32} />
                                User Management
                            </h1>
                            <p className="text-indigo-100 mt-2 text-sm md:text-base">
                                Manage organization users and permissions
                            </p>
                        </div>
                        <button
                            onClick={() => setShowInviteModal(true)}
                            className="bg-white text-indigo-700 px-4 py-2.5 rounded-lg font-bold hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg flex items-center gap-2 border border-white/30 hover:scale-105 text-sm"
                        >
                            <UserPlus size={20} />
                            Invite User
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            </div>
                            <Users className="text-indigo-600" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Users</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {users.filter((u) => u.status === "Active").length}
                                </p>
                            </div>
                            <Activity className="text-green-600" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Owners</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {users.filter((u) => u.role === "OWNER").length}
                                </p>
                            </div>
                            <Shield className="text-purple-600" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Staff</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {users.filter((u) => u.role === "STAFF" || u.role === "ADMIN").length}
                                </p>
                            </div>
                            <Users className="text-blue-600" size={32} />
                        </div>
                    </div>
                </div>

                {/* User List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        User
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Contact
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Role
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Last Login
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                                                    {user.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.fullName}</p>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Mail size={12} />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.phone ? (
                                                <p className="text-sm text-gray-700 flex items-center gap-1">
                                                    <Phone size={14} />
                                                    {user.phone}
                                                </p>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                                    user.role
                                                )}`}
                                            >
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                                                    user.status
                                                )}`}
                                            >
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.lastLoginAt ? (
                                                <p className="text-sm text-gray-700 flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {new Date(user.lastLoginAt).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <span className="text-gray-400 text-sm">Never</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <Edit2 size={14} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {users.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500">No users found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <UserPlus className="text-indigo-600" size={24} />
                                Invite New User
                            </h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={inviteForm.fullName}
                                    onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={inviteForm.phone}
                                    onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="081-234-5678"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role *
                                </label>
                                <select
                                    value={inviteForm.role}
                                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="STAFF">Staff</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="OWNER">Owner</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Inviting..." : "Invite User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Edit2 className="text-indigo-600" size={24} />
                                Edit User
                            </h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={selectedUser.email}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.fullName}
                                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="STAFF">Staff</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="OWNER">Owner</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status *
                                </label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Suspended">Suspended</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Updating..." : "Update User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
