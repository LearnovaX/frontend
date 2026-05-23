// src/pages/users/components/UserStatistics.tsx
import React from "react";
import { User, UserCheck, Check, Calendar } from "lucide-react";

interface UserStatisticsProps {
    statistics: Statistics;
    isDark: boolean;
    t: any;
    openModal: (modalType: string) => void;
}

export default function UserStatistics({
                                           statistics,
                                           isDark,
                                           t,
                                           openModal,
                                       }: UserStatisticsProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <div
                className={`rounded-2xl border shadow-sm p-6 transition duration-200 hover:shadow-md cursor-pointer transform hover:scale-105 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
                onClick={() => openModal('total')}
            >
                <div className="flex items-center gap-4">
                    <User
                        className={`h-8 w-8 ${isDark ? "text-blue-400" : "text-gray-900"}`}/>
                    <div>
                        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('users.totalUsers')}</p>
                        <p className={`text-2xl font-bold ${isDark ? "text-slate-200" : "text-gray-900"}`}>
                            {statistics.total_users}
                        </p>
                    </div>
                </div>
            </div>

            <div
                className={`rounded-2xl border shadow-sm p-6 transition duration-200 hover:shadow-md cursor-pointer transform hover:scale-105 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
                onClick={() => openModal('enrolled')}
            >
                <div className="flex items-center gap-4">
                    <UserCheck
                        className={`h-8 w-8 ${isDark ? "text-emerald-300" : "text-emerald-600"}`}/>
                    <div>
                        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('users.enrolledOnCourses')}</p>
                        <p className={`text-2xl font-bold ${isDark ? "text-slate-200" : "text-gray-900"}`}>
                            {statistics.enrolled_users || 0}
                        </p>
                    </div>
                </div>
            </div>

            <div
                className={`rounded-2xl border shadow-sm p-6 transition duration-200 hover:shadow-md cursor-pointer transform hover:scale-105 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
                onClick={() => openModal('authorized')}
            >
                <div className="flex items-center gap-4">
                    <Check
                        className={`h-8 w-8 ${isDark ? "text-sky-300" : "text-sky-600"}`}/>
                    <div>
                        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('users.authorized')}</p>
                        <p className={`text-2xl font-bold ${isDark ? "text-slate-200" : "text-gray-900"}`}>
                            {statistics.authorized_users}
                        </p>
                    </div>
                </div>
            </div>

            <div
                className={`rounded-2xl border shadow-sm p-6 transition duration-200 hover:shadow-md cursor-pointer transform hover:scale-105 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}
                onClick={() => openModal('daily')}
            >
                <div className="flex items-center gap-4">
                    <Calendar
                        className={`h-8 w-8 ${isDark ? "text-indigo-300" : "text-indigo-600"}`}/>
                    <div>
                        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('users.lastDay')}</p>
                        <p className={`text-2xl font-bold ${isDark ? "text-slate-200" : "text-gray-900"}`}>
                            {statistics.users_last_day}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}