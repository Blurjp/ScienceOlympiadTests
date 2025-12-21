'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Settings } from 'lucide-react';

interface ManageSubscriptionButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ManageSubscriptionButton({
  className,
  variant = 'outline',
  size = 'default',
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManage = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open subscription portal');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open subscription portal. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleManage}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Settings className="mr-2 h-4 w-4" />
          Manage Subscription
        </>
      )}
    </Button>
  );
}
