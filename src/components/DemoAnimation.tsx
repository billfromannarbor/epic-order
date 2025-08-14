import React from "react";
import { motion } from "framer-motion";

export function DemoAnimation() {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2 text-sm font-semibold">Gameplay preview</div>
            <div className="relative h-28 overflow-hidden rounded-xl border bg-slate-50">
                <motion.div
                    className="absolute left-2 top-2 rounded-xl border bg-white px-3 py-1 text-xs font-semibold"
                    initial={{ x: 0 }}
                    animate={{ x: [0, 220, 440] }}
                    transition={{ repeat: Infinity, duration: 6 }}
                >
                    Event ➜
                </motion.div>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                    <div className="h-10 flex-1 rounded-xl border border-dashed" />
                    <div className="h-10 flex-1 rounded-xl border border-dashed" />
                    <div className="h-10 flex-1 rounded-xl border border-dashed" />
                </div>
            </div>
        </div>
    );
}
