"use client";

import { motion } from "framer-motion";

export default function AnimatedTitle() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.6,
                ease: "easeOut"
            }}
            className="text-center mb-8"
        >
            <h1 className="text-4xl md:text-5xl font-bold text-white pb-2">
                Upcoming Events
            </h1>
            <motion.div
                className="h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mt-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "200px" }}
                transition={{
                    duration: 0.8,
                    delay: 0.3,
                    ease: "easeOut"
                }}
            />
        </motion.div>
    );
}