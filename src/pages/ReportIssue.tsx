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
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  issueType: z.string({
    required_error: "Please select an issue type.",
  }),
  location: z
    .string()
    .min(5, { message: "Please provide a more specific location." }),
  description: z.string().optional(),
  photo: z.any()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
  lat: z.number().optional(),
  lng: z.number().optional(),
}).refine(data => !!data.lat && !!data.lng, {
  message: "Location must be validated. Please use the GPS button or wait for the location to be confirmed after typing.",
  path: ["location"],
});

type LocationStatus = 'idle' | 'validating' | 'valid' | 'invalid';

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { isFloodSeasonActive } = useSiteConfig();
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [validationMessage, setValidationMessage] = useState('');

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
    let toastId = showLoading("Fetching your location with high accuracy...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        form.setValue("lat", latitude, { shouldValidate: true });
        form.setValue("lng", longitude, { shouldValidate: true });
        
        dismissToast(toastId);
        toastId = showLoading("Looking up address...");

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) {
            throw new Error('Failed to fetch address');
          }
          const data = await response.json();
          
          if (data && data.display_name) {
            form.setValue("location", data.display_name, { shouldValidate: true });
            setLocationStatus('valid');
            showSuccess("Location and address captured!");
          } else {
            form.setValue("location", `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, { shouldValidate: true });
            setLocationStatus('valid');
            showSuccess("Location captured, but could not find a street address.");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          form.setValue("location", `GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, { shouldValidate: true });
          setLocationStatus('valid');
          showError("Location captured, but failed to get address.");
        } finally {
          dismissToast(toastId);
          setIsGettingLocation(false);
        }
      },
      (error) => {
        dismissToast(toastId);
        let message = `Error getting location: ${error.message}`;
        if (error.code === 1) {
          message = "Please allow location access in your browser settings.";
        } else if (error.code === 2) {
          message = "Location information is unavailable.";
        } else if (error.code === 3) {
          message = "Getting location timed out. Please try again.";
        }
        showError(message);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const handleLocationBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const locationValue = e.target.value;
    if (locationValue.length < 5 || locationStatus === 'valid') {
      return;
    }

    setLocationStatus('validating');
    setValidationMessage('');
    form.clearErrors("location");

    try {
      const { data, error } = await supabase.functions.invoke("validate-location", {
        body: { location: locationValue },
      });

      if (error) throw error;

      if (data.isValid) {
        setLocationStatus('valid');
        setValidationMessage(`Location confirmed: ${data.displayName}`);
        form.setValue('lat', data.lat, { shouldValidate: true });
        form.setValue('lng', data.lng, { shouldValidate: true });
        form.setValue('location', data.displayName, { shouldValidate: true });
      } else {
        setLocationStatus('invalid');
        setValidationMessage(data.message);
        form.setError("location", { type: "manual", message: data.message });
        form.setValue('lat', undefined, { shouldValidate: true });
        form.setValue('lng', undefined, { shouldValidate: true });
      }
    } catch (err: any) {
      setLocationStatus('invalid');
      const errorMessage = "Could not validate location at this time. Please try again or use GPS.";
      setValidationMessage(errorMessage);
      form.setError("location", { type: "manual", message: errorMessage });
      console.error("Location validation error:", err);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      showError("You must be logged in to report an issue.");
      return;
    }

    const toastId = showLoading("Submitting your report...");
    let photoUrl: string | null = null;

    try {
      // Handle photo upload if a file is provided
      if (values.photo && values.photo.length > 0) {
        const file = values.photo[0];
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        dismissToast(toastId);
        showLoading("Uploading photo...");

        const { error: uploadError } = await supabase.storage
          .from("issue_photos")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("issue_photos")
          .getPublicUrl(filePath);
        
        photoUrl = publicUrlData.publicUrl;
        dismissToast(toastId);
        showLoading("Finalizing report...");
      }

      const { issueType, location, description, lat, lng } = values;
      const { error: insertError } = await supabase.from("issues").insert([
        {
          issue_type: issueType,
          location,
          description,
          user_id: user.id,
          photo_url: photoUrl,
          lat,
          lng,
        },
      ]);

      if (insertError) {
        throw new Error(`Failed to submit report: ${insertError.message}`);
      }

      dismissToast(toastId);
      showSuccess("Issue reported successfully! Thank you.");
      form.reset();
      navigate("/");

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
      console.error("Error reporting issue:", error);
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
                        {isFloodSeasonActive && (
                          <SelectItem value="flood" className="text-destructive font-bold focus:bg-destructive/10 focus:text-destructive">
                            Flood
                          </SelectItem>
                        )}
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
                          onChange={(e) => {
                            setLocationStatus('idle');
                            form.clearErrors("location");
                            field.onChange(e);
                          }}
                          onBlur={handleLocationBlur}
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
                      {locationStatus === 'validating' && <span className="text-muted-foreground">Validating location...</span>}
                      {locationStatus === 'valid' && <span className="text-green-600">{validationMessage}</span>}
                      {locationStatus === 'idle' && "Provide a landmark or use the button to get your GPS location."}
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
                      <Input 
                        type="file" 
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                     <FormDescription>
                      Max file size: 5MB. Accepted formats: JPG, PNG, WEBP.
                    </FormDescription>
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