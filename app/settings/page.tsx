"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Building2, CreditCard, Zap } from "lucide-react";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        // Chatbot Config
        wifiSsid: "",
        wifiPassword: "",
        rulesText: "",
        emergencyPhone: "",
        adminPhone: "",
        adminLineIdDisplay: ""
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === "number" ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Sanitize numbers to avoid sending null/NaN
            const safeConfig = {
                ...config,
                waterRate: Number(config.waterRate) || 0,
                electricRate: Number(config.electricRate) || 0,
                trashFee: Number(config.trashFee) || 0,
                internetFee: Number(config.internetFee) || 0,
                otherFees: Number(config.otherFees) || 0,
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

    if (loading) return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin text-indigo-500" /></div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-8 text-gray-900 flex items-center gap-2">
                ⚙️ System Settings
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Dormitory Details */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-700">
                        <Building2 size={20} /> Dormitory Details
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dormitory Name</label>
                            <input
                                name="dormName"
                                value={config.dormName}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input
                                name="dormAddress"
                                value={config.dormAddress}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                    </div>
                </section>

                {/* Bank Account */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-700">
                        <CreditCard size={20} /> Bank Account (Receive Payments)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                            <input
                                name="bankName"
                                value={config.bankName}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                placeholder="e.g. Kasikorn Bank"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                            <input
                                name="bankAccountNumber"
                                value={config.bankAccountNumber}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg font-mono"
                                placeholder="000-0-00000-0"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                            <input
                                name="bankAccountName"
                                value={config.bankAccountName}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">PromptPay ID / เบอร์พร้อมเพย์ (Optional)</label>
                            <input
                                name="promptPayId"
                                value={config?.promptPayId || ""}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg font-mono bg-gray-50"
                                placeholder="e.g. 081-234-5678 or 1234567890123"
                            />
                        </div>
                    </div>
                </section>

                {/* Invoice Customization */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                        Invoice Customization
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dorm Logo</label>

                            <div className="flex items-start gap-4">
                                {/* Preview */}
                                {config.invoiceLogo ? (
                                    <div className="relative group">
                                        <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                                            <img
                                                src={config.invoiceLogo}
                                                alt="Logo Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setConfig(prev => ({ ...prev, invoiceLogo: "" }))}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                        <div className="text-xs text-center p-2">No Logo</div>
                                    </div>
                                )}

                                {/* File Input */}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/png, image/jpeg, image/jpg"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            // Limit file size to 800KB to ensure smooth DB storage/transmission
                                            if (file.size > 800 * 1024) {
                                                alert("File is too large. Please choose an image under 800KB.");
                                                return;
                                            }

                                            // Convert to Base64
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                const base64String = reader.result as string;
                                                setConfig(prev => ({ ...prev, invoiceLogo: base64String }));
                                            };
                                            reader.onerror = () => {
                                                alert("Failed to read file.");
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-indigo-50 file:text-indigo-700
                                            hover:file:bg-indigo-100
                                        "
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Upload a PNG or JPG file (Max 800KB). It will be saved directly to the database.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    name="invoiceColor"
                                    value={config.invoiceColor || "#4f46e5"}
                                    onChange={handleChange}
                                    className="h-10 w-20 p-1 border rounded-lg cursor-pointer"
                                />
                                <input
                                    name="invoiceColor"
                                    value={config.invoiceColor || ""}
                                    onChange={handleChange}
                                    className="flex-1 p-2 border rounded-lg font-mono text-sm bg-gray-50"
                                    placeholder="#4f46e5"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Footer / Note</label>
                            <input
                                name="invoiceNote"
                                value={config.invoiceNote || ""}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                placeholder="e.g. Please pay within 5 days"
                            />
                        </div>
                    </div>
                </section>

                {/* Line Chatbot Configuration */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        Line Chatbot Auto-Reply
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 bg-indigo-50 p-4 rounded-lg mb-2">
                            <p className="text-sm text-indigo-700">
                                💡 ข้อมูลเหล่านี้จะถูกบอทตอบกลับอัตโนมัติเมื่อลูกบ้านกด Rich Menu หรือพิมพ์ถาม
                            </p>
                        </div>

                        {/* Wi-Fi */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wi-Fi Name (SSID)</label>
                            <input
                                name="wifiSsid"
                                value={config.wifiSsid || ""}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                placeholder="StaySync_WiFi"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Wi-Fi Password</label>
                            <input
                                name="wifiPassword"
                                value={config.wifiPassword || ""}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg font-mono"
                                placeholder="password1234"
                            />
                        </div>

                        {/* Rules */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dorm Rules (ข้อความกฎระเบียบ)</label>
                            <textarea
                                name="rulesText"
                                value={config.rulesText || ""}
                                onChange={(e) => setConfig(prev => ({ ...prev, rulesText: e.target.value }))}
                                className="w-full p-2 border rounded-lg h-32"
                                placeholder="1. ห้ามเสียงดัง..."
                            />
                        </div>

                        {/* Contacts */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone (เบอร์ฉุกเฉิน)</label>
                            <input
                                name="emergencyPhone"
                                value={config.emergencyPhone || ""}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                placeholder="191"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone (เบอร์ติดต่อเจ้าหน้าที่)</label>
                            <input
                                name="adminPhone"
                                value={config.adminPhone || ""}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                placeholder="081-xxxxxxx"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Line ID (Official Account)</label>
                            <input
                                name="adminLineIdDisplay"
                                value={config.adminLineIdDisplay || ""}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                placeholder="@staysync_admin"
                            />
                        </div>
                    </div>
                </section>

                {/* Automation & Alerts */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                        Admin Alerts (Line Messaging API)
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Line User ID</label>
                            <input
                                name="adminLineUserId"
                                value={config.adminLineUserId || ""}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg font-mono text-sm bg-gray-50"
                                placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                To get your User ID: Add the Line Bot as a friend and type <b>"myid"</b> or <b>"admin"</b>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Default Rates */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-orange-700">
                        <Zap size={20} /> Default Utility Rates
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Water (฿/Unit)</label>
                            <input
                                type="number"
                                name="waterRate"
                                value={config.waterRate}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Electric (฿/Unit)</label>
                            <input
                                type="number"
                                name="electricRate"
                                value={config.electricRate}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trash (฿)</label>
                            <input
                                type="number"
                                name="trashFee"
                                value={config.trashFee}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Internet (฿)</label>
                            <input
                                type="number"
                                name="internetFee"
                                value={config.internetFee}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Other (฿)</label>
                            <input
                                type="number"
                                name="otherFees"
                                value={config.otherFees}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">These rates will be pre-filled when you create new bulk bills.</p>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
