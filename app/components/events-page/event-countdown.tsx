'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface EventCountdownProps {
    startDateTime: string;
    className?: string;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

export default function EventCountdown({ startDateTime, className = '' }: EventCountdownProps) {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

    useEffect(() => {
        const calculateTimeRemaining = (): TimeRemaining => {
            const eventTime = new Date(startDateTime).getTime();
            const now = new Date().getTime();
            const difference = eventTime - now;

            if (difference <= 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            return { days, hours, minutes, seconds, total: difference };
        };

        // Initial calculation
        setTimeRemaining(calculateTimeRemaining());

        // Update every second
        const timer = setInterval(() => {
            setTimeRemaining(calculateTimeRemaining());
        }, 1000);

        return () => clearInterval(timer);
    }, [startDateTime]);

    if (!timeRemaining) return null;

    const formatCountdown = () => {
        if (timeRemaining.total <= 0) {
            return 'Event has started';
        }

        if (timeRemaining.days > 0) {
            return `${timeRemaining.days}d ${timeRemaining.hours}h`;
        }

        if (timeRemaining.hours > 0) {
            return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
        }

        if (timeRemaining.minutes > 0) {
            return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
        }

        return `${timeRemaining.seconds}s`;
    };

    const getTimeUntilText = () => {
        if (timeRemaining.total <= 0) {
            return '';
        }
        return 'Event starting in';
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
                {timeRemaining.total > 0 && (
                    <p className="text-xs text-gray-600">{getTimeUntilText()}</p>
                )}
                <p className={`text-2xl font-bold ${
                    timeRemaining.total <= 0 ? 'text-green-600' : 'text-orange-600'
                }`}>
                    {formatCountdown()}
                </p>
            </div>
        </div>
    );
}
