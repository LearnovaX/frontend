// src/pages/users/components/GeneralUsersChart.tsx
import React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, AreaChart, Area, PieChart, Pie } from 'recharts';
import PeriodPicker from "./PeriodPicker";
import CustomTooltip from "./CustomTooltip";

interface GeneralUsersChartProps {
    historicalData: any;
    periodDays: number;
    setPeriodDays: (d: number) => void;
    refetchHistorical: (d: number) => void;
    formatChartData: (data: any, fields: string[]) => any[];
    isDark: boolean;
    t: any;
    activeModal: string | null;
}

export default function GeneralUsersChart({
                                              historicalData,
                                              periodDays,
                                              setPeriodDays,
                                              refetchHistorical,
                                              formatChartData,
                                              isDark,
                                              t,
                                              activeModal,
                                          }: GeneralUsersChartProps) {

    const hasData = (d: any) => Array.isArray(d?.dates) && d.dates.length > 0;


    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className={`text-lg font-semibold ${isDark ? "text-slate-200" : "text-gray-900"} mb-2`}>{t('users.generalStats')}</h3>
                <p className={`text-gray-600 ${isDark ? "text-slate-400" : "text-gray-600"}`}>{t('users.growthDynamics30d')}</p>
            </div>
            <div className="mb-4 flex items-center justify-center px-2">
                <PeriodPicker value={periodDays} onChange={refetchHistorical}/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                    className={`rounded-xl p-6 ${isDark ? "bg-slate-700" : "bg-gradient-to-br from-blue-50 to-indigo-50"}`}>
                    <h4 className={`text-lg font-semibold mb-4 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.userGrowth')}</h4>
                    <div style={{width: '100%', height: 300}}>
                        {hasData(historicalData) ? (
                            <ResponsiveContainer width="100%" height="100%"
                                                 key={`total-${activeModal}-${periodDays}`}>
                                <LineChart
                                    data={formatChartData(historicalData, ['total_users', 'active_users'])}>
                                    <CartesianGrid strokeDasharray="3 3"
                                                   stroke={isDark ? "#475569" : "#e5e7eb"}/>
                                    <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <YAxis allowDecimals={false}
                                           stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <Tooltip content={<CustomTooltip/>}/>
                                    <Legend/>
                                    <Line type="monotone" dataKey="total_users" name={t('users.total')}
                                          stroke={isDark ? "#60a5fa" : "#2563eb"} dot={false}/>
                                    <Line type="monotone" dataKey="active_users" name={t('users.active')}
                                          stroke={isDark ? "#34d399" : "#059669"} dot={false}/>
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className={`${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.noData')}</div>}
                    </div>
                </div>

                <div
                    className={`rounded-xl p-6 ${isDark ? "bg-slate-700" : "bg-gradient-to-br from-emerald-50 to-teal-50"}`}>
                    <h4 className={`text-lg font-semibold mb-4 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.dailyActivity')}</h4>
                    <div style={{width: '100%', height: 300}}>
                        {hasData(historicalData) ? (
                            <ResponsiveContainer width="100%" height="100%"
                                                 key={`total-${activeModal}-${periodDays}`}>
                                <BarChart
                                    data={formatChartData(historicalData, ['new_users_daily', 'deactivated_users_daily'])}>
                                    <CartesianGrid strokeDasharray="3 3"
                                                   stroke={isDark ? "#475569" : "#e5e7eb"}/>
                                    <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <YAxis allowDecimals={false}
                                           stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <Tooltip content={<CustomTooltip/>}/>
                                    <Legend/>
                                    <Bar dataKey="new_users_daily" name={t('users.new')}
                                         fill={isDark ? "#a78bfa" : "#7c3aed"}/>
                                    <Bar dataKey="deactivated_users_daily" name={t('users.deactivated')}
                                         fill={isDark ? "#f87171" : "#ef4444"}/>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className={`${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.noData')}</div>}
                    </div>
                </div>

            </div>
        </div>
    );
}