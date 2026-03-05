import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import type { CallType } from "@shared/schema";

interface CallTypesChartProps {
  callTypes: CallType[];
  loading?: boolean;
}

const colorMap: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  purple: "bg-purple-500",
};

export default function CallTypesChart({ callTypes, loading = false }: CallTypesChartProps) {
  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded animate-pulse w-48"></div>
            <div className="h-6 w-6 bg-muted rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-muted rounded-full animate-pulse"></div>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-24 bg-muted rounded-full h-2 animate-pulse"></div>
                  <div className="h-4 w-12 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Call Types Distribution
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-expand-chart"
          >
            <Expand className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {callTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${colorMap[type.color] || "bg-gray-500"}`}></div>
                <span className="text-sm font-medium text-foreground" data-testid={`text-call-type-${type.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {type.name}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${colorMap[type.color] || "bg-gray-500"}`}
                    style={{ width: `${type.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right" data-testid={`text-call-type-percentage-${type.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  {type.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
