
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Gauge, BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useLocalStorage } from '@/hooks/use-local-storage';

interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  target: number;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  lastUpdated: string;
}

interface RealTimeMetricsCardProps {
  title: string;
  description?: string;
  sourceData?: any;
  metricKey: string;
  icon?: React.ReactNode;
  defaultMetric?: RealTimeMetric;
}

const defaultMetrics: RealTimeMetric = {
  id: 'default',
  name: 'Quality Score',
  value: 78,
  unit: '%',
  target: 90,
  status: 'warning',
  trend: 'up',
  trendValue: 2.5,
  lastUpdated: new Date().toISOString(),
};

const RealTimeMetricsCard: React.FC<RealTimeMetricsCardProps> = ({
  title,
  description,
  sourceData,
  metricKey,
  icon = <Gauge className="h-4 w-4 text-primary" />,
  defaultMetric = defaultMetrics,
}) => {
  const [metric, setMetric] = useLocalStorage<RealTimeMetric>(`metric-${metricKey}`, defaultMetric);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Update metric based on sourceData changes
  useEffect(() => {
    if (sourceData) {
      // Check if we have a valid value to update
      const newValue = sourceData[metricKey] !== undefined 
        ? sourceData[metricKey] 
        : metric.value;
      
      // Only update if value has changed
      if (newValue !== metric.value) {
        setIsUpdating(true);
        
        // Calculate new trend
        const trend = newValue > metric.value ? 'up' : newValue < metric.value ? 'down' : 'stable';
        const trendValue = Math.abs(((newValue - metric.value) / metric.value) * 100);
        
        // Calculate new status
        let status: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
        const ratio = newValue / metric.target;
        if (ratio >= 1) status = 'success';
        else if (ratio >= 0.8) status = 'warning';
        else status = 'danger';
        
        // Update metric
        setMetric({
          ...metric,
          value: newValue,
          trend,
          trendValue: parseFloat(trendValue.toFixed(1)),
          status,
          lastUpdated: new Date().toISOString(),
        });
        
        setTimeout(() => setIsUpdating(false), 700);
      }
    }
  }, [sourceData, metricKey]);
  
  // Format timestamp as relative time
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${diffHour}h ago`;
  };
  
  return (
    <Card className={cn(
      "shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
      isUpdating && "animate-pulse-subtle",
      metric.status === 'success' && "defect-card",
      metric.status === 'warning' && "highlight-card",
      metric.status === 'danger' && "bg-gradient-to-b from-white to-soft-pink",
      metric.status === 'neutral' && "bg-gradient-to-b from-white to-soft-blue"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          metric.status === 'success' && "bg-success/10",
          metric.status === 'warning' && "bg-warning/10",
          metric.status === 'danger' && "bg-destructive/10",
          metric.status === 'neutral' && "bg-primary/10"
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1">
          <div className={cn(
            "text-2xl font-bold",
            isUpdating && "animate-bounce-light"
          )}>
            {metric.value}
          </div>
          <div className="text-lg">{metric.unit}</div>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress to target ({metric.target}{metric.unit})</span>
            <span className={cn(
              metric.status === 'success' && "text-success",
              metric.status === 'warning' && "text-warning",
              metric.status === 'danger' && "text-destructive"
            )}>
              {Math.min(100, Math.round((metric.value / metric.target) * 100))}%
            </span>
          </div>
          <Progress 
            value={Math.min(100, (metric.value / metric.target) * 100)} 
            className={cn(
              "h-1.5",
              metric.status === 'success' && "bg-success",
              metric.status === 'warning' && "bg-warning",
              metric.status === 'danger' && "bg-destructive",
              metric.status === 'neutral' && "bg-primary"
            )}
          />
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            {metric.trend === 'up' ? (
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
            ) : metric.trend === 'down' ? (
              <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
            ) : (
              <Activity className="mr-1 h-3 w-3 text-warning" />
            )}
            <span className={cn(
              "mr-1",
              metric.trend === 'up' ? "text-success" : 
              metric.trend === 'down' ? "text-destructive" : 
              "text-warning"
            )}>
              {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : '±'}
              {metric.trendValue}%
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            Updated {getRelativeTime(metric.lastUpdated)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMetricsCard;
