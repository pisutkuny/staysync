"use client";

import { useState, useEffect } from "react";
import { Users, Search, Edit2, Shield, UserX, CheckCircle, AlertTriangle, X, Plus, Trash2, Save } from "lucide-react";

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

    // Edit State
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Create State
    const [isCreating, setIsCreating] = useState(false);

    const [saving, setSaving] = useState(false);

    // Shared Form Data
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        fullName: "",
        phone: "",
        role: "TENANT",
        status: "Active"
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
            email: user.email,
            password: "", // Password not needed for edit unless changing
            fullName: user.fullName,
            phone: user.phone || "",
            role: user.role,
            status: user.status
        });
        setIsCreating(false);
    }

    function handleCreate() {
        setEditingUser(null);
        setFormData({
            email: "",
            password: "",
            fullName: "",
            phone: "",
            role: "TENANT",
            status: "Active"
        });
        setIsCreating(true);
    }

    async function handleDelete(user: User) {
        if (!confirm(`คุณต้องการลบผู้ใช้ "${user.fullName}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้ (Soft Delete)`)) {
            return;
        }

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Delete failed");
            }

            // Update local state (mark as deleted or remove)
            // Option 1: Mark as Deleted
            setUsers(users.map(u => u.id === user.id ? { ...u, status: 'Deleted' } : u));
            alert("ลบผู้ใช้งานสำเร็จ");
        } catch (error: any) {
            console.error(error);
            alert(`เกิดข้อผิดพลาด: ${error.message}`);
        }
    }

    async function handleSave() {
        try {
            setSaving(true);

            const url = isCreating ? "/api/users" : `/api/users/${editingUser?.id}`;
            const method = isCreating ? "POST" : "PATCH";

            // Filter out empty password if editing
            const bodyData = { ...formData };
            if (!isCreating && !bodyData.password) {
                delete (bodyData as any).password;
            }

            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Operation failed");
            }

            if (isCreating) {
                setUsers([result.user, ...users]);
                alert("สร้างผู้ใช้งานสำเร็จ");
            } else {
                setUsers(users.map(u => u.id === editingUser!.id ? { ...u, ...formData } : u));
                alert("บันทึกข้อมูลสำเร็จ");
            }

            setEditingUser(null);
            setIsCreating(false);
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
            {/* Enhanced Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                            <Users className="text-white" size={32} />
                            จัดการผู้ใช้งาน
                        </h1>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">
                            จัดการสิทธิ์การใช้งานและสถานะของผู้ใช้ในระบบ
                        </p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อ, อีเมล..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-white/90 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white border-0 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur-sm transition-colors border border-white/30"
                            title="สร้างผู้ใช้งานใหม่"
                        >
                            <Plus size={24} />
                        </button>
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
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="แก้ไข"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {user.status !== 'Deleted' && (
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบผู้ใช้งาน"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
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

            {/* Edit/Create Modal */}
            {(editingUser || isCreating) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {isCreating ? <Plus className="text-indigo-600" /> : <Shield className="text-indigo-600" />}
                                {isCreating ? "สร้างผู้ใช้งานใหม่" : "แก้ไขข้อมูลผู้ใช้งาน"}
                            </h2>
                            <button
                                onClick={() => { setEditingUser(null); setIsCreating(false); }}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ชื่อ-นามสกุล
                                </label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="เช่น สมชาย ใจดี"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    อีเมล
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="email@example.com"
                                    disabled={!isCreating} // Email should generally be immutable or handled carefully
                                />
                            </div>

                            {isCreating && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        รหัสผ่าน
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="กำหนดรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    เบอร์โทรศัพท์
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="08X-XXX-XXXX"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        บทบาท (Role)
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="STAFF">STAFF</option>
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="OWNER">OWNER</option>
                                        <option value="TENANT">TENANT</option>
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
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspended</option>
                                        <option value="Deleted">Deleted</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => { setEditingUser(null); setIsCreating(false); }}
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
