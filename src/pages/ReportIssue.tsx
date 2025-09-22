import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  issueType: z.string({
    required_error: "Please select an issue type.",
  }),
  location: z
    .string()
    .min(5, { message: "Please provide a more specific location." }),
  description: z.string().optional(),
  photo: z.any().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: "",
      description: "",
    },
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser.");
      return;
    }

    setIsGettingLocation(true);
    const toastId = showLoading("Fetching your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("lat", latitude);
        form.setValue("lng", longitude);
        form.setValue("location", `Location captured via GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        dismissToast(toastId);
        showSuccess("Location captured successfully!");
        setIsGettingLocation(false);
      },
      (error) => {
        dismissToast(toastId);
        showError(`Error getting location: ${error.message}`);
        setIsGettingLocation(false);
      }
    );
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("You must be logged in to report an issue.");
      return;
    }

    const { issueType, location, description, lat, lng } = values;

    const { error } = await supabase.from("issues").insert([
      {
        issue_type: issueType,
        location,
        description,
        user_id: user.id,
        lat,
        lng,
      },
    ]);

    if (error) {
      console.error("Error reporting issue:", error);
      showError(`Failed to submit report: ${error.message}`);
    } else {
      showSuccess("Issue reported successfully! Thank you.");
      form.reset();
      navigate("/");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Report an Issue</CardTitle>
          <p className="text-muted-foreground">
            Help us identify problem areas by reporting them.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Issue</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an issue type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="waterlogging">
                          Waterlogging
                        </SelectItem>
                        <SelectItem value="blocked-drain">
                          Blocked Drain
                        </SelectItem>
                        <SelectItem value="damaged-infra">
                          Damaged Infrastructure
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="e.g., Near Meenakshi Amman Temple, Madurai"
                          {...field}
                        />
                         <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Provide a landmark or use the button to get your GPS location.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any extra details here..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Photo (Optional)</FormLabel>
                    <FormControl>
                      <Input type="file" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="outline" asChild>
                  <Link to="/">Cancel</Link>
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Submitting..."
                    : "Submit Report"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportIssue;