"use client";

import Link from "next/link";
import { DoorOpen, BadgeAlert } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface TenantDashboardProps {
    dormName: string;
}

export default function TenantDashboard({ dormName }: TenantDashboardProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-8 pb-10">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-xl text-white">
                <h2 className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-lg mb-2">👋 {t.dashboard.welcomeTo} {dormName}</h2>
                <p className="text-indigo-100 text-sm md:text-base">{t.dashboard.tenantSystem}</p>
            </div>

            <div className="bg-white rounded-xl shadow p-8 text-center border border-gray-100">
                <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                    <DoorOpen size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t.dashboard.pendingRoom}</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    {t.dashboard.contactAdmin} <br />
                    {t.dashboard.afterLink}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/report" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 group">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                            <BadgeAlert size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t.dashboard.generalIssue}</h3>
                            <p className="text-sm text-gray-500">{t.dashboard.generalIssueDesc}</p>
                        </div>
                    </div>
                </Link>

                <Link href="/settings" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow border border-gray-100 group">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-3 rounded-lg text-gray-600 group-hover:bg-gray-200 transition-colors">
                            <div className="w-6 h-6 flex items-center justify-center">⚙️</div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t.dashboard.accountSettings}</h3>
                            <p className="text-sm text-gray-500">{t.dashboard.manageProfile}</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
