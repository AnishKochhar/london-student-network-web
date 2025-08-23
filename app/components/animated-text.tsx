'use client';

import React, { useRef } from 'react';
import { motion, useInView, Variants } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  per?: 'word' | 'char';
  className?: string;
}

export function AnimatedText({ text, per = 'word', className }: AnimatedTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 }); // Animate once when 50% in view

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: per === 'word' ? 0.1 : 0.02, // Increased stagger
        delayChildren: 1, // 4-second delay
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8 } }, // Added duration
  };

  const segments = per === 'word' ? text.split(/(\s+)/) : text.split('');

  return (
    <div ref={ref} className={className}>
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="inline-block" // Ensure it doesn't break layout
      >
        {segments.map((segment, index) => (
          <motion.span
            key={index}
            variants={itemVariants}
            className="inline-block whitespace-pre" // Preserve spaces
          >
            {segment}
          </motion.span>
        ))}
      </motion.span>
    </div>
  );
}
