import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EncouragementProps {
    show: boolean;
    confetti?: boolean;
    variant: "great" | "good" | "keep";
}

export function Encouragement({ show, confetti, variant }: EncouragementProps) {
    if (!show) return null;

    const msg = variant === "great" ? "Phenomenal!" : variant === "good" ? "Nice work!" : "Keep going!";

    return (
        <div className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-center text-2xl font-extrabold">{msg}</div>
            <div className="mt-2 text-center text-sm opacity-70">Thanks for playing. Want another round?</div>
            <AnimatePresence>
                {confetti && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute inset-0"
                    >
                        {Array.from({ length: 40 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute h-2 w-2 rounded"
                                style={{ left: `${(i * 97) % 100}%`, top: -8 }}
                                initial={{ y: -10, scale: 0.8, rotate: 0 }}
                                animate={{ y: [0, 260], rotate: [0, 360] }}
                                transition={{
                                    duration: 1.8 + (i % 10) * 0.12,
                                    repeat: Infinity,
                                    delay: (i % 10) * 0.08,
                                }}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
