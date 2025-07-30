"use client";

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

function VelocityItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="relative text-2xl md:text-3xl font-semibold whitespace-nowrap text-gray-400 hover:text-white transition-colors duration-300 cursor-pointer p-2 rounded-lg group/item"
    >
      {children}
      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-yellow-400 scale-x-0 group-hover/item:scale-x-100 transition-transform duration-500 ease-out origin-center"></span>
    </motion.div>
  );
}

export function VelocityScroll({ items, default_velocity = 5, ...props }: { items: { name: string }[], default_velocity?: number, [key: string]: any }) {
  const { scrollY } = useScroll();
  const scrollRef = useRef<HTMLDivElement>(null);

  const smoothVelocity = useSpring(useTransform(scrollY, [0, 1000], [0, 5], { clamp: false }), {
    damping: 50,
    stiffness: 400,
  });

  const velocity = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false });

  const x = useTransform(scrollY, (v) => `${-v}px`);

  return (
    <motion.div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]" ref={scrollRef} style={{ x }} {...props}>
      {items.map((item, index) => (
        <VelocityItem key={index}>{item.name}</VelocityItem>
      ))}
    </motion.div>
  );
}
