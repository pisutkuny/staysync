"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#e5e7eb', '#ef4444']; // Occupied, Available, Maintenance

export default function OccupancyChart({ data }: { data: any[] }) {
    const PATTERNS = ["url(#pattern-lines)", "url(#pattern-dots)", "url(#pattern-cross)", "url(#pattern-diag)"];

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <defs>
                        <pattern id="pattern-lines" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#fff" strokeWidth="2" opacity="0.5" />
                        </pattern>
                        <pattern id="pattern-dots" patternUnits="userSpaceOnUse" width="10" height="10">
                            <circle cx="5" cy="5" r="2" fill="#fff" opacity="0.5" />
                        </pattern>
                        <pattern id="pattern-cross" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#fff" strokeWidth="2" opacity="0.5" />
                            <line x1="0" y1="0" x2="10" y2="0" stroke="#fff" strokeWidth="2" opacity="0.5" />
                        </pattern>
                        <pattern id="pattern-diag" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(-45)">
                            <line x1="0" y1="0" x2="0" y2="10" stroke="#fff" strokeWidth="2" opacity="0.5" />
                        </pattern>
                    </defs>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                                stroke="rgba(255,255,255,0.2)"
                            />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
