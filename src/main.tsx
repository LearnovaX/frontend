// src/main.tsx
import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n"; // 👈 import BEFORE App so detectors and backend are ready
import App from "./App";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Suspense
            fallback={
                <div className="min-h-screen grid place-items-center">
                    <div className="text-sm opacity-70">Loading translations…</div>
                </div>
            }
        >
            <App />
        </Suspense>
    </StrictMode>
);
