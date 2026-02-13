'use client';

import React from 'react';

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ExportButton() {
    const { t } = useLanguage();
    const handleExport = () => {
        const date = new Date();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        window.open(`/api/reports/export?month=${month}&year=${year}`, '_blank');
    };

    return (
        <button
            onClick={handleExport}
            className="w-full h-full justify-center bg-green-600 text-white px-2 py-2.5 rounded-lg font-bold hover:bg-green-700 shadow-sm transition-all flex items-center gap-2 text-xs sm:text-sm"
        >
            <span>📊</span>
            <span className="truncate">{t.print.exportExcel}</span>
        </button>
    );
}
