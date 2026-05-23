// src/components/ui/RoundedCheckbox.tsx
import React, { KeyboardEvent, memo } from "react";

type RoundedCheckboxProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    indeterminate?: boolean;
    disabled?: boolean;
    size?: number; // px (default 20)
    isDark?: boolean;
    className?: string;
    "aria-label"?: string;
};

function join(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

/**
 * Accessible, theme-aware, animated round checkbox.
 * - Button-based (role="checkbox") for custom visuals + full keyboard support
 * - Animated checkmark path
 * - Indeterminate dash
 */
export const RoundedCheckbox = memo(function RoundedCheckbox({
                                                                 checked,
                                                                 onChange,
                                                                 indeterminate = false,
                                                                 disabled = false,
                                                                 size = 20,
                                                                 isDark = false,
                                                                 className,
                                                                 "aria-label": ariaLabel = "checkbox",
                                                             }: RoundedCheckboxProps) {
    const handleKey = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
        }
    };

    const ringBase = isDark ? "ring-slate-700 ring-offset-slate-800" : "ring-gray-200 ring-offset-white";
    const bgBase = isDark ? "bg-slate-800" : "bg-white";
    const borderBase = isDark ? "border-slate-600" : "border-gray-300";
    const checkedBg = isDark
        ? "bg-gradient-to-br from-sky-500 to-indigo-500"
        : "bg-gradient-to-br from-indigo-500 to-fuchsia-500";

    const dimension = { width: size, height: size, minWidth: size, minHeight: size };

    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={indeterminate ? "mixed" : checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            onKeyDown={handleKey}
            className={join(
                "relative inline-flex items-center justify-center rounded-full border transition-all",
                "motion-safe:duration-300 motion-safe:ease-out focus:outline-none",
                "focus-visible:ring-2 focus-visible:ring-offset-2",
                ringBase,
                bgBase,
                borderBase,
                disabled && "opacity-60 cursor-not-allowed",
                !disabled && "cursor-pointer",
                // scale pulse on hover/focus for better affordance
                !disabled && "hover:scale-[1.04] focus-visible:scale-[1.04]",
                // state styles
                checked && checkedBg,
                checked && "border-transparent text-white",
                className
            )}
            style={dimension}
            data-state={indeterminate ? "indeterminate" : checked ? "checked" : "unchecked"}
        >
            {/* Icon layer */}
            <svg
                viewBox="0 0 20 20"
                width={Math.round(size * 0.75)}
                height={Math.round(size * 0.75)}
                className="pointer-events-none"
            >
                {/* Indeterminate: centered dash */}
                {indeterminate && (
                    <rect
                        x="4" y="9" width="12" height="2" rx="1"
                        className={isDark ? "fill-slate-200" : "fill-white"}
                    />
                )}

                {/* Checkmark: rounded stroke with draw animation */}
                {!indeterminate && (
                    <path
                        d="M5 10.5l3 3 7-7"
                        fill="none"
                        stroke={checked ? "#fff" : "transparent"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                            transition: "stroke 200ms ease",
                        }}
                    />
                )}
            </svg>

            {/* subtle inner glow when checked */}
            <span
                className={join(
                    "pointer-events-none absolute inset-0 rounded-full",
                    checked && "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]"
                )}
            />
        </button>
    );
});
