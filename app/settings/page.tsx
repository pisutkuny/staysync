"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Building2, CreditCard, Zap, MessageSquare, Settings as SettingsIcon, Lock, Eye, EyeOff } from "lucide-react";
import PasswordChangeForm from "../components/PasswordChangeForm";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [config, setConfig] = useState({
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
        reminderTime: "09:00"
    });

    useEffect(() => {
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

            alert("Settings saved successfully!");
        } catch (error: any) {
            console.error(error);
            alert(`Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

    const tabs = [
        { id: "basic", label: "Basic Info", icon: Building2 },
        { id: "payment", label: "Payment", icon: CreditCard },
        { id: "rates", label: "Rates & Fees", icon: Zap },
        { id: "chatbot", label: "Chatbot", icon: MessageSquare },
        { id: "security", label: "Security", icon: Lock }
    ];

    return (
        <div className="space-y-6">
            {/* Gradient Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                            <SettingsIcon size={24} className="md:w-10 md:h-10" />
                            System Settings
                        </h2>
                        <p className="text-indigo-100 mt-2 text-lg">Configure your dormitory management system</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
                <div className="flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
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
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                                <Building2 size={24} /> Dormitory Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dormitory Name *</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone</label>
                                    <input
                                        name="adminPhone"
                                        value={config.adminPhone}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="081-234-5678"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
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
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                                <MessageSquare size={24} /> LINE Integration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin LINE User ID</label>
                                    <input
                                        name="adminLineUserId"
                                        value={config.adminLineUserId}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Uxxxxxxxxxxxxxxxxxxxx"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">🔍 หาได้จาก LINE Developer Console - สำหรับรับแจ้งเตือน</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin LINE ID Display</label>
                                    <input
                                        name="adminLineIdDisplay"
                                        value={config.adminLineIdDisplay}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="@admin_line_id"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">📱 LINE ID ที่ให้ผู้เช่าเพิ่มเพื่อติดต่อ (แสดงใน Chatbot)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Tab */}
                {activeTab === "payment" && (
                    <div className="space-y-6">
                        {/* Bank Account */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700">
                                <CreditCard size={24} /> Bank Account
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                    <input
                                        name="bankName"
                                        value={config.bankName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="e.g. Kasikorn Bank"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                    <input
                                        name="bankAccountName"
                                        value={config.bankAccountName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Account holder name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                    <input
                                        name="bankAccountNumber"
                                        value={config.bankAccountNumber}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="xxx-x-xxxxx-x"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">PromptPay ID</label>
                                    <input
                                        name="promptPayId"
                                        value={config.promptPayId}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Phone or Tax ID"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">💳 เบอร์โทร หรือ เลขประจำตัวผู้เสียภาษี สำหรับรับเงิน</p>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Settings */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-700">
                                📄 Invoice Settings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Note</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Logo</label>
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
                                                    <p className="text-sm text-gray-600">Current logo</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfig(prev => ({ ...prev, invoiceLogo: '' }))}
                                                        className="text-xs text-red-600 hover:text-red-700 mt-1"
                                                    >
                                                        Remove logo
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
                                                            alert('File size must be less than 2MB');
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
                                                    {config.invoiceLogo ? 'Change logo' : 'Upload logo'}
                                                </span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">Recommended: PNG or JPG, max 2MB</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Color (Hex)</label>
                                    <input
                                        name="invoiceColor"
                                        value={config.invoiceColor}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="#4f46e5"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">🎨 สีหลักของใบแจ้งหนี้ (Hex Code)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rates & Fees Tab */}
                {activeTab === "rates" && (
                    <div className="space-y-6">
                        {/* Utility Rates */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                                <Zap size={24} /> Utility Rates
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Water Rate (฿/unit)</label>
                                    <input
                                        name="waterRate"
                                        type="number"
                                        step="0.01"
                                        value={config.waterRate}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">💧 อัตราที่คิดผู้เช่า ต่อหน่วย</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Electric Rate (฿/unit)</label>
                                    <input
                                        name="electricRate"
                                        type="number"
                                        step="0.01"
                                        value={config.electricRate}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">⚡ อัตราที่คิดผู้เช่า ต่อหน่วย</p>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Fees */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-amber-700">
                                💰 Fixed Fees
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trash Fee (฿)</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Internet Fee (฿)</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Fees (฿)</label>
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
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
                                🏢 Common Area Billing
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
                                    <label className="text-sm font-medium text-gray-700">Enable Common Area Charges</label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">🏢 เปิดใช้งานค่าส่วนกลาง (น้ำ-ไฟส่วนกลาง) ให้ผู้เช่าแชร์ค่าใช้จ่าย</p>

                                {config.enableCommonAreaCharges && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Distribution Method</label>
                                            <select
                                                name="commonAreaDistribution"
                                                value={config.commonAreaDistribution}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="equal">Equal Split</option>
                                                <option value="proportional">Proportional to Room Price</option>
                                            </select>
                                            <p className="text-xs text-gray-500 mt-1">⚖️ วิธีแบ่งค่าส่วนกลาง: เท่าๆกัน หรือ ตามราคาห้อง</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Cap Type</label>
                                            <select
                                                name="commonAreaCapType"
                                                value={config.commonAreaCapType}
                                                onChange={handleChange}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            >
                                                <option value="none">No Cap</option>
                                                <option value="percentage">Percentage Cap</option>
                                                <option value="fixed">Fixed Amount</option>
                                            </select>
                                        </div>
                                        {config.commonAreaCapType === "percentage" && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Cap Percentage (%)</label>
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Cap Amount (฿)</label>
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
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-700">
                                📶 WiFi Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WiFi SSID</label>
                                    <input
                                        name="wifiSsid"
                                        value={config.wifiSsid}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Network name"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">📶 ชื่อ WiFi ที่ให้ผู้เช่าใช้</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Password</label>
                                    <input
                                        name="wifiPassword"
                                        value={config.wifiPassword}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Password"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">🔐 รหัสผ่าน WiFi</p>
                                </div>
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-700">
                                📜 Dormitory Rules
                            </h3>
                            <textarea
                                name="rulesText"
                                value={config.rulesText}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                rows={8}
                                placeholder="1. No pets allowed&#10;2. Quiet hours: 10 PM - 6 AM&#10;3. No smoking inside rooms..."
                            />
                            <p className="text-xs text-gray-500 mt-2">📜 กฎระเบียบหอพัก แสดงใน Chatbot เมื่อผู้เช่าถาม</p>
                        </div>

                        {/* Auto Reminders */}
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-700">
                                🔔 Automation
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
                                    <label className="text-sm font-medium text-gray-700">Enable Auto Payment Reminders</label>
                                </div>
                                <p className="text-sm text-gray-500">🔔 ส่งข้อความเตือนอัตโนมัติให้ผู้เช่าที่ยังไม่ชำระเงิน</p>

                                {/* Reminder Schedule - Show when enabled */}
                                {config.enableAutoReminders && (
                                    <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-4">
                                        <h4 className="font-semibold text-sm text-purple-900 flex items-center gap-2">
                                            ⏰ กำหนดเวลาส่งแจ้งเตือน
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    วันที่ส่ง (ของแต่ละเดือน)
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
                                                <p className="text-xs text-gray-500 mt-1">📅 เลือกวันที่ต้องการส่งเตือน (1-28)</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    เวลาที่ส่ง
                                                </label>
                                                <input
                                                    type="time"
                                                    name="reminderTime"
                                                    value={config.reminderTime || '09:00'}
                                                    onChange={handleChange}
                                                    className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                                />
                                                <p className="text-xs text-gray-500 mt-1">⏰ เวลาที่จะส่งข้อความเตือน</p>
                                            </div>
                                        </div>
                                        <div className="bg-purple-100 p-3 rounded-lg">
                                            <p className="text-sm text-purple-800">
                                                💡 <strong>ตัวอย่าง:</strong> ถ้าตั้งวันที่ 25 เวลา 09:00 น.
                                                ระบบจะส่งข้อความเตือนทุกวันที่ 25 เวลา 9 โมงเช้า
                                                ให้กับผู้เช่าที่ยังไม่ชำระค่าห้องของเดือนนั้น
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
                    <PasswordChangeForm />
                )}

                {/* Save Button - Fixed at Bottom (Only show for non-security tabs) */}
                {activeTab !== "security" && (
                    <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={24} />
                                    Save All Settings
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
