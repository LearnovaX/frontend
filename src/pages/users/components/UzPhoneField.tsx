// UzPhoneField.tsx
import React from "react";

const UZ_PREFIX = "+998";
const REST_MAX = 9; // 9 digits after +998
const REST_PLACEHOLDER = "xx xxx xx xx";

function normalizeRestDigits(input: string): string {
    const digits = (input || "").replace(/\D/g, "");
    const rest = digits.startsWith("998") ? digits.slice(3) : digits;
    return rest.slice(0, REST_MAX);
}

function formatRest(restDigits: string): string {
    const r = normalizeRestDigits(restDigits);
    const p1 = r.slice(0, 2); // xx
    const p2 = r.slice(2, 5); // xxx
    const p3 = r.slice(5, 7); // xx
    const p4 = r.slice(7, 9); // xx
    return [p1, p2, p3, p4].filter(Boolean).join(" ");
}

// From full string (maybe "+998 90 123 45 67") to the "rest" (e.g. "90 123 45 67")
function splitFullToRest(full?: string | null): string {
    if (!full) return "";
    const digits = full.replace(/\D/g, "");
    const rest = digits.startsWith("998") ? digits.slice(3) : digits;
    return formatRest(rest);
}

// From "rest" (e.g. "90 123 45 67") to the full string (e.g. "+998 90 123 45 67")
// If empty => return empty (so you can clear the field)
function composeFullFromRest(restFormatted: string): string {
    const digits = normalizeRestDigits(restFormatted);
    if (!digits) return "";
    return `${UZ_PREFIX} ${formatRest(digits)}`;
}

export default function UzPhoneField({
                                         value,              // full value in state (e.g. "+998 90 123 45 67" or "")
                                         onChange,           // (nextFull: string) => void
                                         isDark,
                                         id,
                                         label,
                                     }: {
    value: string | null | undefined;
    onChange: (nextFull: string) => void;
    isDark: boolean;
    id?: string;
    label?: string;
}) {
    const rest = splitFullToRest(value ?? "");

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Fixed visible prefix */}
                <span
                    aria-hidden="true"
                    className={`absolute left-3 top-1/2 -translate-y-1/2 select-none ${isDark ? "text-slate-300" : "text-gray-500"}`}
                >
          {UZ_PREFIX}
        </span>

                <input
                    id={id}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder={REST_PLACEHOLDER}
                    // "xx xxx xx xx" => 12 chars max
                    maxLength={12}
                    className={[
                        "w-full px-4 py-3 rounded-lg transition duration-200 text-base",
                        // left padding so text doesn't overlap the prefix
                        "pl-14", // tweak if your font size changes
                        isDark
                            ? "bg-slate-700 border border-slate-600 text-slate-200 focus:ring-2 focus:ring-blue-900/30"
                            : "bg-white border border-gray-200 text-gray-900 focus:ring-2 focus:ring-black/10",
                    ].join(" ")}
                    value={rest}
                    onChange={(e) => onChange(composeFullFromRest(e.target.value))}
                    onPaste={(e) => {
                        e.preventDefault();
                        const text = e.clipboardData.getData("text") || "";
                        onChange(composeFullFromRest(text));
                    }}
                    onBlur={(e) => {
                        // Recompose to ensure spacing; empty rest -> save empty
                        onChange(composeFullFromRest(e.target.value));
                    }}
                />
            </div>
        </div>
    );
}
