"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useToastStore, type ToastType } from "../store/toastStore";

const icons = {
  success: <CheckCircle className="h-5 w-5 text-neonGreen" />,
  error: <AlertCircle className="h-5 w-5 text-warning" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-neonBlue" />
};

const bgColors = {
  success: "border-neonGreen/30 bg-neonGreen/10",
  error: "border-warning/30 bg-warning/10",
  warning: "border-yellow-500/30 bg-yellow-500/10",
  info: "border-neonBlue/30 bg-neonBlue/10"
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-xl transition ${bgColors[toast.type]}`}
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-semibold text-white/90">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/40 hover:text-white transition"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
