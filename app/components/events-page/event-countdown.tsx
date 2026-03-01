'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface EventCountdownProps {
    startDateTime: string;
    endDateTime?: string;
    className?: string;
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

export default function EventCountdown({ startDateTime, endDateTime, className = '' }: EventCountdownProps) {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
    const [eventStatus, setEventStatus] = useState<'upcoming' | 'started' | 'ended'>('upcoming');

    useEffect(() => {
        const calculate = () => {
            const now = Date.now();
            const startTime = new Date(startDateTime).getTime();
            const endTime = endDateTime ? new Date(endDateTime).getTime() : null;

            // Determine event status
            if (endTime && now >= endTime) {
                setEventStatus('ended');
                return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
            }
            if (now >= startTime) {
                setEventStatus('started');
                return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
            }

            setEventStatus('upcoming');
            const difference = startTime - now;
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
                total: difference,
            };
        };

        setTimeRemaining(calculate());
        const timer = setInterval(() => setTimeRemaining(calculate()), 1000);
        return () => clearInterval(timer);
    }, [startDateTime, endDateTime]);

    if (!timeRemaining) return null;

    const formatCountdown = () => {
        if (eventStatus === 'ended') return 'Event has ended';
        if (eventStatus === 'started') return 'Event has started';

        if (timeRemaining.days > 0) return `${timeRemaining.days}d ${timeRemaining.hours}h`;
        if (timeRemaining.hours > 0) return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
        if (timeRemaining.minutes > 0) return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
        return `${timeRemaining.seconds}s`;
    };

    // Prose status messages get smaller text; numeric countdowns stay large
    const isProseStatus = eventStatus !== 'upcoming';
    const statusColor = eventStatus === 'ended'
        ? 'text-gray-500'
        : eventStatus === 'started'
            ? 'text-green-600'
            : 'text-orange-600';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Clock className={`w-5 h-5 ${eventStatus === 'ended' ? 'text-gray-400' : 'text-gray-500'}`} />
            <div>
                {eventStatus === 'upcoming' && (
                    <p className="text-xs text-gray-600">Event starting in</p>
                )}
                <p className={`${isProseStatus ? 'text-sm font-semibold' : 'text-2xl font-bold'} ${statusColor}`}>
                    {formatCountdown()}
                </p>
            </div>
        </div>
    );
}
