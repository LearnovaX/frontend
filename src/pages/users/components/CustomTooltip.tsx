// src/pages/users/components/CustomTooltip.tsx
import {useTheme} from "@/components/common/ThemeContext.tsx";

const CustomTooltip = ({active, payload, label}: any) => {
    const { actualTheme } = useTheme();
    const isDark = actualTheme === 'dark';
    if (active && payload && payload.length) {
        return (
            <div
                className={`p-3 border rounded-lg shadow-lg ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-gray-200 text-gray-900"}`}>
                <p className={`font-medium text-sm ${isDark ? "text-slate-200" : "text-gray-900"}`}>{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} style={{color: entry.color}} className="text-sm">
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default CustomTooltip;