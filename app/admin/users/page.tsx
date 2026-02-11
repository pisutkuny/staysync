"use client";

import { useState, useEffect } from "react";
import { Users, Search, Edit2, Shield, UserX, CheckCircle, AlertTriangle, X } from "lucide-react";

interface User {
    id: number;
    email: string;
    fullName: string;
    phone: string | null;
    role: string;
    status: string;
    lastLoginAt: string | null;
    createdAt: string;
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        role: "",
        status: ""
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const res = await fetch("/api/users");
            if (!res.ok) {
                if (res.status === 403) {
                    alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (สำหรับ Owner เท่านั้น)");
                    window.location.href = "/admin";
                    return;
                }
                throw new Error("Failed to fetch users");
            }
            const data = await res.json();
            setUsers(data.users);
        } catch (error) {
            console.error(error);
            alert("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้งาน");
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = users.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm))
    );

    function handleEdit(user: User) {
        setEditingUser(user);
        setFormData({
            role: user.role,
            status: user.status
        });
    }

    async function handleSave() {
        if (!editingUser) return;

        try {
            setSaving(true);
            const res = await fetch(`/api/users/${editingUser.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Update failed");
            }

            // Update local state
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
            setEditingUser(null);
            alert("บันทึกข้อมูลสำเร็จ");
        } catch (error: any) {
            console.error(error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        } finally {
            setSaving(false);
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case "OWNER": return "bg-purple-100 text-purple-800 border-purple-200";
            case "ADMIN": return "bg-indigo-100 text-indigo-800 border-indigo-200";
            case "STAFF": return "bg-blue-100 text-blue-800 border-blue-200";
            case "TENANT": return "bg-gray-100 text-gray-800 border-gray-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active": return "bg-green-100 text-green-800";
            case "Suspended": return "bg-red-100 text-red-800";
            case "Deleted": return "bg-gray-100 text-gray-800 line-through";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
    }

    return (
        <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 border border-gray-100 dark:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Users className="text-indigo-600 dark:text-indigo-400" size={32} />
                            จัดการผู้ใช้งาน
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            จัดการสิทธิ์การใช้งานและสถานะของผู้ใช้ในระบบ
                        </p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, อีเมล..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900 border-b dark:border-slate-700">
                            <tr>
                                <th className="p-3 md:p-4 font-semibold text-gray-700 dark:text-gray-300">ผู้ใช้งาน</th>
                                <th className="p-3 md:p-4 font-semibold text-gray-700 dark:text-gray-300">บทบาท</th>
                                <th className="p-3 md:p-4 font-semibold text-gray-700 dark:text-gray-300">สถานะ</th>
                                <th className="p-3 md:p-4 font-semibold text-gray-700 dark:text-gray-300">ใช้งานล่าสุด</th>
                                <th className="p-3 md:p-4 font-semibold text-gray-700 dark:text-gray-300 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                                        <div className="text-gray-500 dark:text-gray-400 text-xs">{user.email}</div>
                                        {user.phone && <div className="text-gray-500 dark:text-gray-400 text-xs">{user.phone}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('th-TH') : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        ไม่พบข้อมูลผู้ใช้งาน
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield className="text-indigo-600" />
                                แก้ไขสิทธิ์ผู้ใช้งาน
                            </h2>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="font-semibold text-gray-900 dark:text-white text-lg">{editingUser.fullName}</div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">{editingUser.email}</div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    บทบาท (Role)
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="STAFF">STAFF (พนักงาน - ดูข้อมูลได้ แก้ไขได้บางส่วน)</option>
                                    <option value="ADMIN">ADMIN (ผู้ดูแล - จัดการได้เกือบทุกอย่าง)</option>
                                    <option value="OWNER">OWNER (เจ้าของ - จัดการได้ทุกอย่าง + ผู้ใช้)</option>
                                    <option value="TENANT">TENANT (ผู้เช่า - ดูได้เฉพาะข้อมูลตัวเอง)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    สถานะ (Status)
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="Active">Active (ใช้งานปกติ)</option>
                                    <option value="Suspended">Suspended (ระงับการใช้งาน)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? "กำลังบันทึก..." : (
                                    <>
                                        <CheckCircle size={18} />
                                        บันทึก
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
