'use client';

import React, { useEffect, useState } from 'react';
import { formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Pause, Play } from 'lucide-react';

interface TimerProps {
  totalTime: number; // in seconds
  isRunning: boolean;
  onToggle: () => void;
  onTimeUpdate: (time: number) => void;
  timeRemaining: number;
}

export function Timer({
  totalTime,
  isRunning,
  onToggle,
  onTimeUpdate,
  timeRemaining,
}: TimerProps) {
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      onTimeUpdate(timeRemaining - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, onTimeUpdate]);

  const percentage = (timeRemaining / totalTime) * 100;
  const isLowTime = percentage < 20;
  const isMediumTime = percentage < 50 && percentage >= 20;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-600">Time Remaining</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Resume
            </>
          )}
        </Button>
      </div>

      <div className="mt-4">
        <div
          className={`text-4xl font-mono font-bold ${
            isLowTime
              ? 'text-red-600'
              : isMediumTime
              ? 'text-yellow-600'
              : 'text-blue-600'
          }`}
        >
          {formatTime(timeRemaining)}
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-300 ${
              isLowTime
                ? 'bg-red-600'
                : isMediumTime
                ? 'bg-yellow-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {timeRemaining === 0 && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-center">
          <p className="text-sm font-medium text-red-800">Time&apos;s up!</p>
        </div>
      )}
    </Card>
  );
}
