'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  currentPlan?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function PricingCard({
  name,
  price,
  period = '/month',
  description,
  features,
  highlighted = false,
  currentPlan = false,
  children,
  className,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        'relative flex flex-col',
        highlighted && 'border-primary shadow-lg',
        className
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}
      {currentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="secondary">Current Plan</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">{price}</span>
          {price !== 'Free' && (
            <span className="text-muted-foreground">{period}</span>
          )}
        </div>
        <ul className="space-y-3 mb-6 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        {children}
      </CardContent>
    </Card>
  );
}
