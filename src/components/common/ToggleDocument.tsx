import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type DocumentSection = { text?: string[]; unordered?: string[] };

type ToggleDocumentProps = {
  title: string;
  sections: DocumentSection[];
  open: boolean;
  onClose: () => void;
  className?: string;
};

export default function ToggleDocument({
  title,
  sections,
  open,
  onClose,
  className = "",
}: ToggleDocumentProps) {
  // Close with ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    // Overlay: fills screen, dark background, closes on outside click
    <div
      className="fixed inset-0 z-50 bg-neutral-700/90 p-3 md:p-4 flex items-start justify-center overflow-y-auto"
      onMouseDown={(e) => {
        // Click only the overlay (gray area) -> close
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden={false}
    >
      {/* Paper stack container */}
      <div className="relative mx-auto w-full max-w-[860px]" aria-live="polite">
        {/* Back sheets (purely visual, centers match main) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[10px] bg-gray-300 shadow-md"
          style={{ transform: "rotate(-2deg) scale(0.995)", transformOrigin: "50% 50%" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[10px] bg-gray-300 shadow-sm"
          style={{ transform: "rotate(2deg) scale(0.995)", transformOrigin: "50% 50%" }}
        />

        {/* Main dialog */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`relative rounded-[10px] bg-white shadow-lg ${className}`}
          // full-height feel with gutters while allowing page scroll behind
          style={{ minHeight: "calc(100vh - 32px)" }}
          // prevent inside clicks from closing
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded p-2 hover:opacity-80 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="px-10 py-12 md:px-16 md:py-16">
            <h2 className="mb-10 text-4xl font-semibold tracking-tight md:text-5xl">
              {title}
            </h2>

            <div className="space-y-8 text-[17px] leading-8 text-neutral-800">
              {sections.map((s, i) => (
                <div key={i} className="space-y-4">
                  {s.text?.map((t, j) => <p key={j}>{t}</p>)}
                  {s.unordered && (
                    <ul className="list-disc pl-6 space-y-2">
                      {s.unordered.map((item, j) => <li key={j}>{item}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <button
                onClick={onClose}
                className="text-sm hover:underline hover:opacity-80"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
