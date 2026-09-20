"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "info";
type ToastItem = { id: number; tone: Tone; text: string };

type ToastApi = {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
};

const ToastContext = createContext<ToastApi>({
  success: () => undefined,
  error: () => undefined,
  info: () => undefined,
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((tone: Tone, text: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-3), { id, tone, text }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const api: ToastApi = {
    success: (text) => push("success", text),
    error: (text) => push("error", text),
    info: (text) => push("info", text),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-end gap-2 sm:inset-x-auto sm:end-4 sm:w-[22rem]">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm shadow-lg",
              item.tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-950",
              item.tone === "error" && "border-red-200 bg-red-50 text-red-950",
              item.tone === "info" && "border-amber-200 bg-amber-50 text-amber-950",
            )}
          >
            {item.tone === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
            {item.tone === "error" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : null}
            {item.tone === "info" ? <Info className="mt-0.5 h-4 w-4 shrink-0" /> : null}
            <p className="min-w-0 flex-1 leading-5">{item.text}</p>
            <button
              type="button"
              className="rounded-md p-0.5 opacity-60 hover:opacity-100"
              onClick={() => setItems((prev) => prev.filter((row) => row.id !== item.id))}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
