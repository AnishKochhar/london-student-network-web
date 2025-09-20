"use client";

import { animate, useMotionValue, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import useMeasure from "react-use-measure";
import { PartnerLogos } from "@/app/lib/utils";

export default function SlidingPartners() {
    const FAST_DURATION = 35;
    const SLOW_DURATION = 80;

    const [duration, setDuration] = useState(FAST_DURATION);
    const [mustFinish, setMustFinish] = useState(false);
    const [rerender, setRerender] = useState(false);

    const [ref, { width }] = useMeasure();
    const xTranslation = useMotionValue(0);

    useEffect(() => {
        let controls;
        const finalPosition = -width / 2 - 8;

        if (mustFinish) {
            controls = animate(
                xTranslation,
                [xTranslation.get(), finalPosition],
                {
                    ease: "linear",
                    duration:
                        duration * (1 - xTranslation.get() / finalPosition),
                    onComplete: () => {
                        setMustFinish(false);
                        setRerender(!rerender);
                    },
                },
            );
        } else {
            controls = animate(xTranslation, [0, finalPosition], {
                ease: "linear",
                duration: duration,
                repeat: Infinity,
                repeatType: "loop",
                repeatDelay: 0,
            });
        }

        return controls?.stop;
    }, [xTranslation, width, duration, rerender, mustFinish]);

    return (
        <motion.div
            className="relative mx-auto flex gap-24 h-auto"
            ref={ref}
            style={{ x: xTranslation }}
            onHoverStart={() => {
                setMustFinish(true);
                setDuration(SLOW_DURATION);
            }}
            onHoverEnd={() => {
                setMustFinish(true);
                setDuration(FAST_DURATION);
            }}
        >
            {[...PartnerLogos, ...PartnerLogos].map((logo, index) => (
                <LogoCard image={logo.src} alt={logo.name} key={index} />
            ))}
        </motion.div>
    );
}

function LogoCard({ image, alt }: { image: string; alt: string }) {
    return (
        <div className="relative h-[10px] min-w-[100px] flex justify-center items-center">
            {/* TODO: AnimatePresence item to display logo society name above (https://www.youtube.com/watch?v=Ot4nZ6UjJLE&ab_channel=BuiltWithCode) */}
            <Image
                src={image}
                alt={alt}
                width={90}
                height={90}
                className="object-contain"
            />
        </div>
    );
}
