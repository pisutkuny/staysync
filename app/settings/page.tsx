"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Building2, CreditCard, Zap, MessageSquare, Settings as SettingsIcon, Lock, Eye, EyeOff, ClipboardList, Plus, Trash2 } from "lucide-react";
import PasswordChangeForm from "../components/PasswordChangeForm";
import Setup2FA from "../components/Setup2FA";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useModal } from "@/app/context/ModalContext";

interface SystemConfig {
    dormName: string;
    dormAddress: string;
    bankName: string;
    bankAccountName: string;
    bankAccountNumber: string;
    promptPayId: string;
    waterRate: number;
    electricRate: number;
    trashFee: number;
    internetFee: number;
    otherFees: number;
    adminLineUserId: string;
    invoiceLogo: string;
    invoiceNote: string;
    invoiceColor: string;
    wifiSsid: string;
    wifiPassword: string;
    rulesText: string;
    emergencyPhone: string;
    adminPhone: string;
    adminLineIdDisplay: string;
    enableCommonAreaCharges: boolean;
    commonAreaDistribution: string;
    commonAreaCapType: string;
    commonAreaCapPercentage: number;
    commonAreaCapFixed: number;
    enableAutoReminders: boolean;
    reminderDay: number;
    reminderTime: string;
    emailVerificationRequired?: boolean;
}

export default function SettingsPage() {
    const { t } = useLanguage();
    const { showAlert } = useModal();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");

    // Checklist state
    const [checklist, setChecklist] = useState<any[]>([]);
    const [checklistLoading, setChecklistLoading] = useState(false);
    const [newItem, setNewItem] = useState({ category: "", label: "", suggestedRepairCost: 0 });
    const [addingItem, setAddingItem] = useState(false);
    const [config, setConfig] = useState<SystemConfig>({
        dormName: "",
        dormAddress: "",
        bankName: "",
        bankAccountName: "",
        bankAccountNumber: "",
        promptPayId: "",
        waterRate: 0,
        electricRate: 0,
        trashFee: 0,
        internetFee: 0,
        otherFees: 0,
        adminLineUserId: "",
        invoiceLogo: "",
        invoiceNote: "",
        invoiceColor: "",
        wifiSsid: "",
        wifiPassword: "",
        rulesText: "",
        emergencyPhone: "",
        adminPhone: "",
        adminLineIdDisplay: "",
        enableCommonAreaCharges: false,
        commonAreaDistribution: "equal",
        commonAreaCapType: "none",
        commonAreaCapPercentage: 100,
        commonAreaCapFixed: 0,
        enableAutoReminders: false,
        reminderDay: 25,
        reminderTime: "09:00",
        emailVerificationRequired: false
    });

    const [userRole, setUserRole] = useState<string>("");

    useEffect(() => {
        // Fetch user profile to get role
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUserRole(data.user.role);
                    // If regular user, force security tab
                    if (data.user.role !== "OWNER" && data.user.role !== "ADMIN") {
                        setActiveTab("security");
                    }
                }
            })
            .catch(err => console.error("Failed to fetch user:", err));

        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setConfig(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const safeConfig = {
                ...config,
                waterRate: Number(config.waterRate) || 0,
                electricRate: Number(config.electricRate) || 0,
                trashFee: Number(config.trashFee) || 0,
                internetFee: Number(config.internetFee) || 0,
                otherFees: Number(config.otherFees) || 0,
                reminderDay: Number(config.reminderDay) || 25, // Convert to number
            };

            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(safeConfig)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to save settings");
            }

            showAlert(t.common.success, t.settings.success, "success");
        } catch (error: any) {
            console.error(error);
            showAlert(t.common.error, `Error: ${error.message}`, "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

    // Load checklist when tab is active
    const loadChecklist = async () => {
        setChecklistLoading(true);
        try {
            const res = await fetch("/api/checkout/checklist");
            const data = await res.json();
            setChecklist(Array.isArray(data) ? data : []);
        } catch { /* ignore */ }
        setChecklistLoading(false);
    };

    const handleAddChecklistItem = async () => {
        if (!newItem.category.trim() || !newItem.label.trim()) return;
        setAddingItem(true);
        try {
            const res = await fetch("/api/checkout/checklist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newItem),
            });
            if (res.ok) {
                setNewItem({ category: "", label: "", suggestedRepairCost: 0 });
                await loadChecklist();
            }
        } catch { /* ignore */ }
        setAddingItem(false);
    };

    const handleDeleteChecklistItem = async (id: number) => {
        try {
            await fetch(`/api/checkout/checklist?id=${id}`, { method: "DELETE" });
            setChecklist(prev => prev.filter(i => i.id !== id));
        } catch { /* ignore */ }
    };

    const handleSeedDefaultChecklist = async () => {
        setAddingItem(true);
        try {
            const res = await fetch("/api/checkout/checklist", {
                method: "PUT",
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setChecklist(data);
            } else {
                showAlert("ข้อผิดพลาด", data.error || "ไม่สามารถเพิ่มรายการได้", "error");
            }
        } catch (err: any) {
            showAlert("ข้อผิดพลาด", err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
        }
        setAddingItem(false);
    };


    const allTabs = [
        { id: "basic", label: t.settings.tabs.basic, icon: Building2, roles: ["OWNER", "ADMIN"] },
        { id: "payment", label: t.settings.tabs.payment, icon: CreditCard, roles: ["OWNER", "ADMIN"] },
        { id: "rates", label: t.settings.tabs.rates, icon: Zap, roles: ["OWNER", "ADMIN"] },
        { id: "chatbot", label: t.settings.tabs.chatbot, icon: MessageSquare, roles: ["OWNER", "ADMIN"] },
        { id: "checklist", label: "Checklist ย้ายออก", icon: ClipboardList, roles: ["OWNER", "ADMIN"] },
        { id: "security", label: t.settings.tabs.security, icon: Lock, roles: ["OWNER", "ADMIN", "STAFF", "TENANT", "USER"] }
    ];

    const tabs = allTabs.filter(tab => tab.roles.includes(userRole));

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                            <SettingsIcon size={24} className="md:w-10 md:h-10" />
                            {t.settings.title}
                        </h2>
                        <p className="text-indigo-100 mt-2 text-sm md:text-base">{t.settings.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-300 p-2">
                <div className="flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    if (tab.id === "checklist") loadChecklist();
                                }}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                <Icon size={20} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Tab */}
                {activeTab === "basic" && (
                    <div className="space-y-6">
                        {/* Dormitory Details */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                                <Building2 size={24} /> {t.settings.basic.dormInfo}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.basic.name}</label>
                                    <input
                                        name="dormName"
                                        value={config.dormName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                        placeholder="e.g. Happy Dorm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.basic.address}</label>
                                    <input
                                        name="dormAddress"
                                        value={config.dormAddress}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                        placeholder="123/45 Street, District, City"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.basic.phone}</label>
                                    <input
                                        name="adminPhone"
                                        value={config.adminPhone}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="081-234-5678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.basic.emergency}</label>
                                    <input
                                        name="emergencyPhone"
                                        value={config.emergencyPhone}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="081-234-5678"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LINE Integration */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                                <MessageSquare size={24} /> {t.settings.basic.lineIntegration}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.basic.lineUserId}</label>
                                    <input
                                        name="adminLineUserId"
                                        value={config.adminLineUserId}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Uxxxxxxxxxxxxxxxxxxxx"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">🔍 {t.settings.basic.lineUserIdTip} (Can add multiple IDs separated by comma ,)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.basic.lineDisplay}</label>
                                    <input
                                        name="adminLineIdDisplay"
                                        value={config.adminLineIdDisplay}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="@admin_line_id"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">📱 {t.settings.basic.lineDisplayTip}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Tab */}
                {activeTab === "payment" && (
                    <div className="space-y-6">
                        {/* Bank Account */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                                <CreditCard size={24} /> {t.settings.payment.bankAccount}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.payment.bankName}</label>
                                    <input
                                        name="bankName"
                                        value={config.bankName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="e.g. Kasikorn Bank"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.payment.accountName}</label>
                                    <input
                                        name="bankAccountName"
                                        value={config.bankAccountName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Account holder name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.payment.accountNumber}</label>
                                    <input
                                        name="bankAccountNumber"
                                        value={config.bankAccountNumber}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="xxx-x-xxxxx-x"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.payment.promptPay}</label>
                                    <input
                                        name="promptPayId"
                                        value={config.promptPayId}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Phone or Tax ID"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">💳 {t.settings.payment.promptPayTip}</p>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Settings */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-700">
                                📄 {t.settings.payment.invoiceSettings}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.payment.invoiceNote}</label>
                                    <textarea
                                        name="invoiceNote"
                                        value={config.invoiceNote}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Thank you for your payment..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t.settings.payment.invoiceLogo}</label>
                                    <div className="space-y-3">
                                        {/* Current Logo Preview */}
                                        {config.invoiceLogo && (
                                            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <img
                                                    src={config.invoiceLogo}
                                                    alt="Invoice Logo"
                                                    className="h-16 w-auto object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNCRiIgZm9udC1zaXplPSIxNiI+TG9nbzwvdGV4dD48L3N2Zz4=';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-600">{t.settings.payment.currentLogo}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfig(prev => ({ ...prev, invoiceLogo: '' }))}
                                                        className="text-xs text-red-600 hover:text-red-700 mt-1"
                                                    >
                                                        {t.settings.payment.removeLogo}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload Button */}
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        // Check file size (max 2MB)
                                                        if (file.size > 2 * 1024 * 1024) {
                                                            showAlert(t.common.error, 'File size must be less than 2MB', 'error');
                                                            return;
                                                        }

                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setConfig(prev => ({
                                                                ...prev,
                                                                invoiceLogo: reader.result as string
                                                            }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="hidden"
                                                id="invoice-logo-upload"
                                            />
                                            <label
                                                htmlFor="invoice-logo-upload"
                                                className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer"
                                            >
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-sm text-gray-600">
                                                    {config.invoiceLogo ? t.settings.payment.changeLogo : t.settings.payment.uploadLogo}
                                                </span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">{t.settings.payment.logoTip}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.payment.invoiceColor}</label>
                                    <input
                                        name="invoiceColor"
                                        value={config.invoiceColor}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="#4f46e5"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">🎨 {t.settings.payment.colorTip}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rates & Fees Tab */}
                {activeTab === "rates" && (
                    <div className="space-y-6">
                        {/* Utility Rates */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                                <Zap size={24} /> {t.settings.rates.utilityRates}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.waterRate}</label>
                                    <input
                                        name="waterRate"
                                        type="number"
                                        step="0.01"
                                        value={config.waterRate}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">💧 {t.settings.rates.waterTip}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.electricRate}</label>
                                    <input
                                        name="electricRate"
                                        type="number"
                                        step="0.01"
                                        value={config.electricRate}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">⚡ {t.settings.rates.electricTip}</p>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Fees */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-700">
                                💰 {t.settings.rates.fixedFees}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.trashFee}</label>
                                    <input
                                        name="trashFee"
                                        type="number"
                                        step="0.01"
                                        value={config.trashFee}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.internetFee}</label>
                                    <input
                                        name="internetFee"
                                        type="number"
                                        step="0.01"
                                        value={config.internetFee}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.otherFees}</label>
                                    <input
                                        name="otherFees"
                                        type="number"
                                        step="0.01"
                                        value={config.otherFees}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Common Area Billing */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                                🏢 {t.settings.rates.commonArea}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="enableCommonAreaCharges"
                                        checked={config.enableCommonAreaCharges}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label className="text-sm font-medium text-gray-700">{t.settings.rates.enableCommon}</label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">🏢 {t.settings.rates.enableCommonTip}</p>

                                {config.enableCommonAreaCharges && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.distribution}</label>
                                            <select
                                                name="commonAreaDistribution"
                                                value={config.commonAreaDistribution}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="equal">{t.settings.rates.distEqual}</option>
                                                <option value="proportional">{t.settings.rates.distProp}</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">⚖️ {t.settings.rates.distTip}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.capType}</label>
                                            <select
                                                name="commonAreaCapType"
                                                value={config.commonAreaCapType}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="none">{t.settings.rates.capNone}</option>
                                                <option value="percentage">{t.settings.rates.capPercent}</option>
                                                <option value="fixed">{t.settings.rates.capFixed}</option>
                                            </select>
                                        </div>
                                        {config.commonAreaCapType === "percentage" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.capPercentVal}</label>
                                                <input
                                                    name="commonAreaCapPercentage"
                                                    type="number"
                                                    value={config.commonAreaCapPercentage}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    min="0"
                                                    max="100"
                                                />
                                            </div>
                                        )}
                                        {config.commonAreaCapType === "fixed" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.rates.capFixedVal}</label>
                                                <input
                                                    name="commonAreaCapFixed"
                                                    type="number"
                                                    value={config.commonAreaCapFixed}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                    min="0"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Chatbot Tab */}
                {activeTab === "chatbot" && (
                    <div className="space-y-6">
                        {/* WiFi Info */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                                📶 {t.settings.chatbot.wifiInfo}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.chatbot.ssid}</label>
                                    <input
                                        name="wifiSsid"
                                        value={config.wifiSsid}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Network name"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">📶 {t.settings.chatbot.ssidTip}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.settings.chatbot.password}</label>
                                    <input
                                        name="wifiPassword"
                                        value={config.wifiPassword}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Password"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">🔐 {t.settings.chatbot.passwordTip}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-700">
                                📜 {t.settings.chatbot.rules}
                            </h3>
                            <textarea
                                name="rulesText"
                                value={config.rulesText}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows={8}
                                placeholder="1. No pets allowed&#10;2. Quiet hours: 10 PM - 6 AM&#10;3. No smoking inside rooms..."
                            />
                            <p className="text-xs text-gray-500 mt-2">📜 {t.settings.chatbot.rulesTip}</p>
                        </div>

                        {/* Auto Reminders */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-700">
                                🔔 {t.settings.chatbot.automation}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        name="enableAutoReminders"
                                        checked={config.enableAutoReminders}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <label className="text-sm font-medium text-gray-700">{t.settings.chatbot.enableReminders}</label>
                                </div>
                                <p className="text-sm text-gray-500">🔔 {t.settings.chatbot.remindersTip}</p>

                                {/* Reminder Schedule - Show when enabled */}
                                {config.enableAutoReminders && (
                                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
                                        <h4 className="font-semibold text-sm text-purple-900 flex items-center gap-2">
                                            ⏰ {t.settings.chatbot.schedule}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t.settings.chatbot.day}
                                                </label>
                                                <select
                                                    name="reminderDay"
                                                    value={config.reminderDay || 25}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                                >
                                                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                                                        <option key={day} value={day}>
                                                            วันที่ {day}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">📅 {t.settings.chatbot.dayTip}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t.settings.chatbot.time}
                                                </label>
                                                <input
                                                    type="time"
                                                    name="reminderTime"
                                                    value={config.reminderTime || '09:00'}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">⏰ {t.settings.chatbot.timeTip}</p>
                                            </div>
                                        </div>
                                        <div className="bg-purple-100 p-3 rounded-lg">
                                            <p className="text-sm text-purple-800">
                                                💡 <strong>{t.settings.chatbot.example.split(":")[0]}:</strong> {t.settings.chatbot.example.split(":")[1]}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                    <div className="space-y-6">
                        {userRole === "OWNER" && (
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-300">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                                    <Lock size={24} /> {t.settings.security.title}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900">{t.settings.security.emailVerify}</p>
                                        <p className="text-sm text-gray-500">{t.settings.security.emailVerifyDesc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="emailVerificationRequired"
                                            checked={!!config.emailVerificationRequired}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        )}
                        <PasswordChangeForm />
                        <Setup2FA />
                    </div>
                )}

                {/* Checklist Tab */}
                {activeTab === "checklist" && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-rose-50 to-pink-50 px-6 py-4 border-b border-slate-200">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><ClipboardList size={18} className="text-rose-600" /> รายการตรวจสภาพห้อง (Check-out Checklist)</h3>
                                <p className="text-sm text-gray-500 mt-1">รายการเหล่านี้จะปรากฏใน Wizard ย้ายออกทุกครั้ง สามารถเพิ่มหรือลบได้ตามต้องการ</p>
                            </div>

                            {/* Add new item form */}
                            <div className="p-6 border-b border-slate-100">
                                <p className="text-sm font-semibold text-gray-700 mb-3">➕ เพิ่มรายการใหม่</p>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <input
                                        type="text"
                                        placeholder="หมวด เช่น 🔑 กุญแจ"
                                        value={newItem.category}
                                        onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}
                                        className="sm:col-span-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="รายการ เช่น กุญแจห้อง"
                                        value={newItem.label}
                                        onChange={e => setNewItem(p => ({ ...p, label: e.target.value }))}
                                        onKeyDown={e => e.key === "Enter" && handleAddChecklistItem()}
                                        className="sm:col-span-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="ราคาแนะนำ (฿)"
                                        value={newItem.suggestedRepairCost || ""}
                                        onChange={e => setNewItem(p => ({ ...p, suggestedRepairCost: parseFloat(e.target.value) || 0 }))}
                                        className="sm:col-span-1 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm focus:border-indigo-400 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddChecklistItem}
                                        disabled={addingItem || !newItem.category || !newItem.label}
                                        className="sm:col-span-1 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                    >
                                        {addingItem ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                        เพิ่ม
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            {checklistLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>
                            ) : checklist.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500">
                                        <ClipboardList size={32} />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800 mb-1">ยังไม่มีรายการตรวจสภาพห้อง</h4>
                                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                                        คุณสามารถสร้างรายการตรวจมาตรฐาน 22 รายการ (แบ่งตาม 4 หมวดหมู่: ไฟฟ้า, เฟอร์นิเจอร์, ห้องน้ำ, ระเบียง) เข้าสู่ระบบทันที หรือพิมพ์เพิ่มรายการเองทีละข้อด้านบน
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleSeedDefaultChecklist}
                                        disabled={addingItem}
                                        className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl shadow-md hover:from-rose-600 hover:to-pink-700 transition flex items-center gap-2 mx-auto disabled:opacity-50 text-sm"
                                    >
                                        {addingItem ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                        ✨ โหลดรายการมาตรฐานเริ่มต้น (22 รายการ)
                                    </button>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {Object.entries(
                                        checklist.reduce((acc: any, item: any) => {
                                            if (!acc[item.category]) acc[item.category] = [];
                                            acc[item.category].push(item);
                                            return acc;
                                        }, {})
                                    ).map(([category, items]: [string, any]) => (
                                        <div key={category}>
                                            <div className="px-6 py-2 bg-gray-50">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{category}</p>
                                            </div>
                                            {items.map((item: any) => (
                                                <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {item.isDefault && (
                                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full shrink-0">DEFAULT</span>
                                                        )}
                                                        <span className="text-sm text-gray-800 truncate">{item.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {item.suggestedRepairCost > 0 && (
                                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                                                ฿{item.suggestedRepairCost.toLocaleString()}
                                                            </span>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteChecklistItem(item.id)}
                                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            title="ลบรายการ"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Save Button - Fixed at Bottom (Only show for non-security, non-checklist tabs) */}
                {activeTab !== "security" && activeTab !== "checklist" && (
                    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-300">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    {t.settings.saving}
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    {t.settings.save}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
