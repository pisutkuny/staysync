"use client";

import { Activity, Wallet, BadgeAlert } from "lucide-react";
import { ActivityItem } from "@/lib/data/dashboard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RecentActivityList({ activity }: { activity: ActivityItem[] }) {
    const { t } = useLanguage();

    return (
        <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-slate-300 shadow-xl overflow-hidden">
            <div className="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="text-indigo-600" size={22} />
                    {t.dashboard.recentActivity}
                </h3>
            </div>
            <div className="divide-y divide-gray-100">
                {activity.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">{t.dashboard.noActivity}</div>
                ) : (
                    activity.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all flex items-center gap-4">
                            <div className={`p-3 rounded-xl shadow-md ${item.type === 'bill_created' ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' : 'bg-gradient-to-br from-orange-400 to-red-500 text-white'}`}>
                                {item.type === 'bill_created' ? <Wallet size={18} /> : <BadgeAlert size={18} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">
                                    {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                </p>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${item.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                    item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                    {item.status}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
