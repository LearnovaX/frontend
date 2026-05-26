// src/pages/users/components/DailyGrowthChart.tsx
import React from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import PeriodPicker from "./PeriodPicker";
import CustomTooltip from "./CustomTooltip";

interface DailyGrowthChartProps {
    historicalData: any;
    periodDays: number;
    setPeriodDays: (d: number) => void;
    refetchHistorical: (d: number) => void;
    formatChartData: (data: any, fields: string[]) => any[];
    isDark: boolean;
    t: any;
    activeModal: string | null;
}

export default function DailyGrowthChart({
                                             historicalData,
                                             periodDays,
                                             setPeriodDays,
                                             refetchHistorical,
                                             formatChartData,
                                             isDark,
                                             t,
                                             activeModal,
                                         }: DailyGrowthChartProps) {
    const hasData = (d: any) => Array.isArray(d?.dates) && d.dates.length > 0;

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.dailyGrowth')}</h3>
                <p className={`${isDark ? "text-slate-400" : "text-gray-600"}`}>{t('users.newRegistrations30d')}</p>
            </div>
            <div className="mb-4 flex items-center justify-center px-2">
                <PeriodPicker value={periodDays} onChange={refetchHistorical}/>
            </div>

            <div
                className={`rounded-xl p-6 ${isDark ? "bg-slate-700" : "bg-gradient-to-br from-indigo-50 to-purple-50"}`}>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.newUsersDaily')}</h4>
                <div style={{width: '100%', height: 400}}>
                    {hasData(historicalData) ? (
                        <ResponsiveContainer width="100%" height="100%"
                                             key={`total-${activeModal}-${periodDays}`}>
                            <BarChart data={formatChartData(historicalData, ['new_users_daily'])}>
                                <CartesianGrid strokeDasharray="3 3"
                                               stroke={isDark ? "#475569" : "#e5e7eb"}/>
                                <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                <YAxis allowDecimals={false}
                                       stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                <Tooltip content={<CustomTooltip/>}/>
                                <Legend/>
                                <Bar dataKey="new_users_daily" name={t('users.new')}
                                     fill={isDark ? "#818cf8" : "#6366f1"}/>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className={`${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.noData')}</div>}
                </div>
            </div>

        </div>
    );
}