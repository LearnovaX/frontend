// src/pages/users/components/AuthorizedUsersChart.tsx
import React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, AreaChart, Area } from 'recharts';
import PeriodPicker from "./PeriodPicker";
import CustomTooltip from "./CustomTooltip";

interface AuthorizedUsersChartProps {
    historicalData: any;
    periodDays: number;
    setPeriodDays: (d: number) => void;
    refetchHistorical: (d: number) => void;
    formatChartData: (data: any, fields: string[]) => any[];
    isDark: boolean;
    t: any;
    activeModal: string | null;
}

export default function AuthorizedUsersChart({
                                                 historicalData,
                                                 periodDays,
                                                 setPeriodDays,
                                                 refetchHistorical,
                                                 formatChartData,
                                                 isDark,
                                                 t,
                                                 activeModal,
                                             }: AuthorizedUsersChartProps) {
    const hasData = (d: any) => Array.isArray(d?.dates) && d.dates.length > 0;

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.authorizationStats')}</h3>
                <p className={`${isDark ? "text-slate-400" : "text-gray-600"}`}>{t('users.authorizedDynamics')}</p>
            </div>
            <div className="mb-4 flex items-center justify-center px-2">
                <PeriodPicker value={periodDays} onChange={refetchHistorical}/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                    className={`rounded-xl p-6 ${isDark ? "bg-slate-700" : "bg-gradient-to-br from-sky-50 to-blue-50"}`}>
                    <h4 className={`text-lg font-semibold mb-4 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.authorizedUsers')}</h4>
                    <div style={{width: '100%', height: 300}}>
                        {hasData(historicalData) ? (
                            <ResponsiveContainer width="100%" height="100%"
                                                 key={`total-${activeModal}-${periodDays}`}>
                                <LineChart
                                    data={formatChartData(historicalData, ['authorized_users'])}>
                                    <CartesianGrid strokeDasharray="3 3"
                                                   stroke={isDark ? "#475569" : "#e5e7eb"}/>
                                    <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <YAxis allowDecimals={false}
                                           stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <Tooltip content={<CustomTooltip/>}/>
                                    <Legend/>
                                    <Line type="monotone" dataKey="authorized_users"
                                          name={t('users.authorized')}
                                          stroke={isDark ? "#38bdf8" : "#0ea5e9"} dot={false}/>
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <div className={`${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.noData')}</div>}
                    </div>
                </div>

                <div
                    className={`rounded-xl p-6 ${isDark ? "bg-slate-700" : "bg-gradient-to-br from-amber-50 to-orange-50"}`}>
                    <h4 className={`text-lg font-semibold mb-4 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.profileCompletion')} (%)</h4>
                    <div style={{width: '100%', height: 300}}>
                        {hasData(historicalData) ? (
                            <ResponsiveContainer width="100%" height="100%"
                                                 key={`total-${activeModal}-${periodDays}`}>
                                <AreaChart
                                    data={formatChartData(historicalData, ['profile_completion_rate'])}>
                                    <defs>
                                        <linearGradient id="pcGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"
                                                  stopColor={isDark ? "#fbbf24" : "#f59e0b"}
                                                  stopOpacity={0.6}/>
                                            <stop offset="95%"
                                                  stopColor={isDark ? "#fbbf24" : "#f59e0b"}
                                                  stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3"
                                                   stroke={isDark ? "#475569" : "#e5e7eb"}/>
                                    <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`}
                                           stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <Tooltip content={<CustomTooltip/>}/>
                                    <Area type="monotone" dataKey="profile_completion_rate"
                                          name={t('users.completion')}
                                          stroke={isDark ? "#fbbf24" : "#f59e0b"}
                                          fill="url(#pcGradient)"/>
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className={`${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.noData')}</div>}
                    </div>
                </div>


            </div>
        </div>
    );
}