import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const checkAvailabilitySchema = z.object({
  startDateTime: z.string().min(1, "Start date/time is required"),
  toDateTime: z.string().min(1, "End date/time is required"),
  rideDurationMinutes: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  scheduleNameOrId: z.string().optional(),
  vehicleType: z.enum(["ATV", "UTV"]),
  requestedQty: z.coerce.number().min(1).default(1),
  suggestSlotsForWholeDay: z.boolean().default(false),
});

type CheckAvailabilityForm = z.infer<typeof checkAvailabilitySchema>;

interface InfoTooltipProps {
  description: string;
  example: string;
}

function InfoTooltip({ description, example }: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-muted-foreground cursor-help inline-block ml-1" data-testid="icon-info-tooltip" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px]" data-testid="tooltip-content">
        <p className="text-sm mb-1">{description}</p>
        <p className="text-xs text-muted-foreground">Example: {example}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export default function ApiTest() {
  const { toast } = useToast();
  const [apiResponse, setApiResponse] = useState<any>(null);

  const form = useForm<CheckAvailabilityForm>({
    resolver: zodResolver(checkAvailabilitySchema),
    defaultValues: {
      startDateTime: "",
      toDateTime: "",
      rideDurationMinutes: 60,
      scheduleNameOrId: "",
      vehicleType: "ATV",
      requestedQty: 1,
      suggestSlotsForWholeDay: false,
    },
  });

  // Auto-calculate end date/time based on start date/time and ride duration
  const startDateTime = form.watch("startDateTime");
  const rideDurationMinutes = form.watch("rideDurationMinutes");
  const suggestSlotsForWholeDay = form.watch("suggestSlotsForWholeDay");

  useEffect(() => {
    if (suggestSlotsForWholeDay) {
      // When suggesting slots for whole day:
      // Start time: 12:00 AM (midnight) of selected date (or today if no date selected)
      // End time: 11:59:59 PM of same date
      const start = startDateTime ? new Date(startDateTime) : new Date();
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      
      // Format start to datetime-local format (YYYY-MM-DDTHH:mm)
      const startYear = start.getFullYear();
      const startMonth = String(start.getMonth() + 1).padStart(2, '0');
      const startDay = String(start.getDate()).padStart(2, '0');
      const startHours = String(start.getHours()).padStart(2, '0');
      const startMinutes = String(start.getMinutes()).padStart(2, '0');
      const formattedStartDateTime = `${startYear}-${startMonth}-${startDay}T${startHours}:${startMinutes}`;
      
      // Format end to datetime-local format (YYYY-MM-DDTHH:mm)
      const endYear = end.getFullYear();
      const endMonth = String(end.getMonth() + 1).padStart(2, '0');
      const endDay = String(end.getDate()).padStart(2, '0');
      const endHours = String(end.getHours()).padStart(2, '0');
      const endMinutes = String(end.getMinutes()).padStart(2, '0');
      const formattedEndDateTime = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
      
      form.setValue("startDateTime", formattedStartDateTime);
      form.setValue("toDateTime", formattedEndDateTime);
    } else if (startDateTime && rideDurationMinutes) {
      // Otherwise, calculate based on ride duration
      const start = new Date(startDateTime);
      const end = new Date(start.getTime() + rideDurationMinutes * 60000);
      
      // Format to datetime-local format (YYYY-MM-DDTHH:mm)
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const day = String(end.getDate()).padStart(2, '0');
      const hours = String(end.getHours()).padStart(2, '0');
      const minutes = String(end.getMinutes()).padStart(2, '0');
      
      const formattedEndDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      form.setValue("toDateTime", formattedEndDateTime);
    }
  }, [startDateTime, rideDurationMinutes, suggestSlotsForWholeDay, form]);

  const checkAvailabilityMutation = useMutation({
    mutationFn: async (data: CheckAvailabilityForm) => {
      const response = await apiRequest("POST", "/api/tool/check_availability", data);
      return response.json();
    },
    onSuccess: (data) => {
      setApiResponse(data);
      toast({
        title: "API Response Received",
        description: "Check the response panel for details",
      });
    },
    onError: (error: any) => {
      setApiResponse({ error: error.message || "Request failed" });
      toast({
        title: "API Request Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckAvailabilityForm) => {
    // Ensure datetime format includes seconds (YYYY-MM-DDTHH:mm:ss)
    const formattedData = {
      ...data,
      startDateTime: data.startDateTime.includes(':00:00') ? data.startDateTime : `${data.startDateTime}:00`,
      toDateTime: data.toDateTime.includes(':00:00') ? data.toDateTime : `${data.toDateTime}:00`,
    };
    checkAvailabilityMutation.mutate(formattedData);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
            Check Availability API Tester
          </h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Test the Check Availability API with different parameters and view responses in real-time
          </p>
        </div>

        {/* API Parameters Form - Full Width */}
        <Card data-testid="card-request-form">
          <CardHeader>
            <CardTitle>API Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 3 Column Grid for Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Start Date & Time */}
                <div>
                  <Label htmlFor="startDateTime" className="flex items-center">
                    Start Date & Time
                    <InfoTooltip
                      description={suggestSlotsForWholeDay ? "Auto-set to 12:00:00 when whole day is selected" : "ISO 8601 formatted start date and time for the availability check"}
                      example={suggestSlotsForWholeDay ? "Auto-set to 12:00:00" : "2024-03-20T10:00:00"}
                    />
                  </Label>
                  <Input
                    id="startDateTime"
                    type="datetime-local"
                    {...form.register("startDateTime")}
                    className={`mt-1 ${suggestSlotsForWholeDay ? 'bg-muted cursor-not-allowed' : ''}`}
                    data-testid="input-start-datetime"
                    disabled={suggestSlotsForWholeDay}
                    readOnly={suggestSlotsForWholeDay}
                  />
                  {form.formState.errors.startDateTime && (
                    <p className="text-sm text-destructive mt-1" data-testid="error-start-datetime">
                      {form.formState.errors.startDateTime.message}
                    </p>
                  )}
                </div>

                {/* End Date & Time */}
                <div>
                  <Label htmlFor="toDateTime" className="flex items-center">
                    End Date & Time
                    <InfoTooltip
                      description={suggestSlotsForWholeDay ? "Auto-set to 23:59 when whole day is selected" : "Automatically calculated based on start time and ride duration"}
                      example={suggestSlotsForWholeDay ? "Auto-set to 23:59" : "Auto-calculated"}
                    />
                  </Label>
                  <Input
                    id="toDateTime"
                    type="datetime-local"
                    {...form.register("toDateTime")}
                    className="mt-1 bg-muted cursor-not-allowed"
                    data-testid="input-end-datetime"
                    disabled
                    readOnly
                  />
                  {form.formState.errors.toDateTime && (
                    <p className="text-sm text-destructive mt-1" data-testid="error-end-datetime">
                      {form.formState.errors.toDateTime.message}
                    </p>
                  )}
                </div>

                {/* Ride Duration */}
                <div>
                  <Label htmlFor="rideDurationMinutes" className="flex items-center">
                    Ride Duration
                    <InfoTooltip
                      description={suggestSlotsForWholeDay ? "Disabled when whole day is selected" : "Select the duration of the ride"}
                      example={suggestSlotsForWholeDay ? "N/A for whole day" : "45 min, 60 min, 90 min, 120 min"}
                    />
                  </Label>
                  <Select
                    value={form.watch("rideDurationMinutes")?.toString()}
                    onValueChange={(value) => form.setValue("rideDurationMinutes", parseInt(value))}
                    disabled={suggestSlotsForWholeDay}
                  >
                    <SelectTrigger className={`mt-1 ${suggestSlotsForWholeDay ? 'bg-muted cursor-not-allowed' : ''}`} data-testid="select-ride-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="45" data-testid="option-duration-45">45 min</SelectItem>
                      <SelectItem value="60" data-testid="option-duration-60">60 min</SelectItem>
                      <SelectItem value="90" data-testid="option-duration-90">90 min</SelectItem>
                      <SelectItem value="120" data-testid="option-duration-120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.rideDurationMinutes && (
                    <p className="text-sm text-destructive mt-1" data-testid="error-ride-duration">
                      {form.formState.errors.rideDurationMinutes.message}
                    </p>
                  )}
                </div>

                {/* Vehicle Type */}
                <div>
                  <Label htmlFor="vehicleType" className="flex items-center">
                    Vehicle Type
                    <InfoTooltip
                      description="Type of vehicle for the booking (ATV or UTV)"
                      example="ATV or UTV"
                    />
                  </Label>
                  <Select
                    value={form.watch("vehicleType")}
                    onValueChange={(value) => form.setValue("vehicleType", value as "ATV" | "UTV")}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-vehicle-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATV" data-testid="option-vehicle-atv">ATV</SelectItem>
                      <SelectItem value="UTV" data-testid="option-vehicle-utv">UTV</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.vehicleType && (
                    <p className="text-sm text-destructive mt-1" data-testid="error-vehicle-type">
                      {form.formState.errors.vehicleType.message}
                    </p>
                  )}
                </div>

                {/* Requested Quantity */}
                <div>
                  <Label htmlFor="requestedQty" className="flex items-center">
                    Requested Quantity
                    <InfoTooltip
                      description="Number of vehicles requested for the booking"
                      example="1, 2, 5"
                    />
                  </Label>
                  <Input
                    id="requestedQty"
                    type="number"
                    {...form.register("requestedQty")}
                    className="mt-1"
                    data-testid="input-requested-qty"
                  />
                  {form.formState.errors.requestedQty && (
                    <p className="text-sm text-destructive mt-1" data-testid="error-requested-qty">
                      {form.formState.errors.requestedQty.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Checkbox - Full Width Below Grid */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suggestSlotsForWholeDay"
                  checked={form.watch("suggestSlotsForWholeDay")}
                  onCheckedChange={(checked) => 
                    form.setValue("suggestSlotsForWholeDay", checked as boolean)
                  }
                  data-testid="checkbox-suggest-slots"
                />
                <Label htmlFor="suggestSlotsForWholeDay" className="flex items-center cursor-pointer">
                  Suggest Slots for Whole Day
                  <InfoTooltip
                    description="Return all available slots for the entire day instead of just checking specific time"
                    example="true or false"
                  />
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={checkAvailabilityMutation.isPending}
                data-testid="button-submit-api"
              >
                {checkAvailabilityMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  "Test Availability"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Response Viewer - Full Width at Bottom */}
        <Card data-testid="card-response-viewer" className="mt-8">
          <CardHeader>
            <CardTitle>API Response</CardTitle>
          </CardHeader>
          <CardContent>
            {apiResponse ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      apiResponse.events?.canBook === true
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`} data-testid="badge-response-status">
                      {apiResponse.events?.canBook === true ? "Available" : "Not Available"}
                    </span>
                    {apiResponse.events?.message && (
                      <span className="text-sm text-muted-foreground" data-testid="text-response-message">
                        {apiResponse.events.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 overflow-auto max-h-[600px]">
                  <pre className="text-sm" data-testid="text-response-json">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground" data-testid="text-no-response">
                <p>No response yet</p>
                <p className="text-sm mt-2">Submit the form to test the API</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
