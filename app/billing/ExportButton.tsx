'use client';

import React from 'react';

export default function ExportButton() {
    const handleExport = () => {
        const date = new Date();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        // In a real app we might want a date picker, but for MVP User wants "Monthly Report", implies current or latest.
        // Let's defaults to current month for simplicity, or we could prompt. 
        // For now, simpler is better: Open new window with default current month.

        window.open(`/api/reports/export?month=${month}&year=${year}`, '_blank');
    };

    return (
        <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-green-700 shadow-sm transition-all flex items-center gap-2 text-sm"
        >
            <span>📊</span> Export Excel
        </button>
    );
}
