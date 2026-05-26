// src/pages/users/components/EnrolledUsersChart.tsx
import React from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import PeriodPicker from "./PeriodPicker";
import CustomTooltip from "./CustomTooltip";

interface EnrolledUsersChartProps {
    historicalData: any;
    periodDays: number;
    setPeriodDays: (d: number) => void;
    refetchHistorical: (d: number) => void;
    formatChartData: (data: any, fields: string[]) => any[];
    formatRoleData: (data: any) => any[];
    isDark: boolean;
    t: any;
    activeModal: string | null;
}

export default function EnrolledUsersChart({
                                               historicalData,
                                               periodDays,
                                               setPeriodDays,
                                               refetchHistorical,
                                               formatChartData,
                                               formatRoleData,
                                               isDark,
                                               t,
                                               activeModal,
                                           }: EnrolledUsersChartProps) {
    const hasData = (d: any) => Array.isArray(d?.dates) && d.dates.length > 0;


    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.enrollmentStats')}</h3>
                <p className={`${isDark ? "text-slate-400" : "text-gray-600"}`}>{t('users.enrollmentDynamics')}</p>
            </div>
            <div className="mb-4 flex items-center justify-center px-2">
                <PeriodPicker value={periodDays} onChange={refetchHistorical}/>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                    className={`rounded-xl p-6 ${isDark ? "bg-slate-700" : "bg-gradient-to-br from-purple-50 to-pink-50"}`}>
                    <h4 className={`text-lg font-semibold mb-4 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.courseEnrollments')}</h4>
                    <div style={{width: '100%', height: 300}}>
                        {hasData(historicalData) ? (
                            <ResponsiveContainer width="100%" height="100%"
                                                 key={`total-${activeModal}-${periodDays}`}>
                                <AreaChart data={formatChartData(historicalData, ['enrollments'])}>
                                    <defs>
                                        <linearGradient id="enrollGradient" x1="0" y1="0" x2="0"
                                                        y2="1">
                                            <stop offset="5%"
                                                  stopColor={isDark ? "#f472b6" : "#ec4899"}
                                                  stopOpacity={0.6}/>
                                            <stop offset="95%"
                                                  stopColor={isDark ? "#f472b6" : "#ec4899"}
                                                  stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3"
                                                   stroke={isDark ? "#475569" : "#e5e7eb"}/>
                                    <XAxis dataKey="date" stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <YAxis allowDecimals={false}
                                           stroke={isDark ? "#94a3b8" : "#6b7280"}/>
                                    <Tooltip content={<CustomTooltip/>}/>
                                    <Area type="monotone" dataKey="enrollments" name={t('users.enrolled')}
                                          stroke={isDark ? "#f472b6" : "#ec4899"}
                                          fill="url(#enrollGradient)"/>
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : <div className={`${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.noData')}</div>}
                    </div>
                </div>


                <div
                    className={`rounded-xl p-6 ${isDark ? "bg-slate-700" : "bg-gradient-to-br from-orange-50 to-red-50"}`}>
                    <h4 className={`text-lg font-semibold mb-4 ${isDark ? "text-slate-200" : "text-gray-900"}`}>{t('users.roleDistribution')}</h4>
                    <div style={{width: '100%', height: 300}}>
                        {hasData(historicalData) ? (
                            <ResponsiveContainer width="100%" height="100%"
                                                 key={`total-${activeModal}-${periodDays}`}>
                                <PieChart>
                                    <Pie
                                        data={formatRoleData(historicalData)}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius="80%"
                                        label
                                    >
                                        {formatRoleData(historicalData).map((entry, idx) => (
                                            <Cell key={`cell-${idx}`} fill={entry.fill}/>
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip/>}/>
                                    <Legend/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className={`${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('common.noData')}</div>}
                    </div>
                </div>


            </div>
        </div>
    );
}