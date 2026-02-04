"use client";

import { motion } from "framer-motion";

export function LoadingAnimation() {
    return (
        <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
            <div className="relative h-16 w-16">
                <motion.span
                    className="absolute block h-16 w-16 rounded-full border-4 border-t-transparent border-b-transparent border-l-primary border-r-primary"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
                <motion.span
                    className="absolute block h-16 w-16 rounded-full border-4 border-t-primary border-b-primary border-l-transparent border-r-transparent opacity-20"
                    animate={{ rotate: -180 }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                >
                    <div className="h-3 w-3 rounded-full bg-primary" />
                </motion.div>
            </div>
        </div>
    );
}
