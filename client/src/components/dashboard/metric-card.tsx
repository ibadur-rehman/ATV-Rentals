import { Card, CardContent } from "@/components/ui/card";
import { Phone, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: "phone" | "check-circle" | "clock" | "alert-triangle";
  iconColor: "blue" | "green" | "amber" | "red";
  loading?: boolean;
  testId?: string;
}

const iconMap = {
  phone: Phone,
  "check-circle": CheckCircle,
  clock: Clock,
  "alert-triangle": AlertTriangle,
};

const colorMap = {
  blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  green: "bg-green-500/20 text-green-400 border border-green-500/30",
  amber: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  red: "bg-primary/20 text-primary border border-primary/30",
};

export default function MetricCard({
  title,
  value,
  change,
  changeType,
  icon,
  iconColor,
  loading = false,
  testId,
}: MetricCardProps) {
  const IconComponent = iconMap[icon];
  const iconColorClass = colorMap[iconColor];

  if (loading) {
    return (
      <Card className="card-elevated bg-charcoal border-gray-800" data-testid={testId}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 skeleton-red rounded mb-3 w-24"></div>
              <div className="h-8 skeleton-red rounded mb-2 w-20"></div>
              <div className="h-3 skeleton-red rounded w-16"></div>
            </div>
            <div className="w-12 h-12 skeleton-red rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated bg-charcoal border-gray-800 hover:border-primary/50 transition-all duration-300" data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 mb-2">{title}</p>
            <p className="text-3xl font-bold text-white mb-1" data-testid={`text-${testId}-value`}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClass}`}>
            <IconComponent className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
