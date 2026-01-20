import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { User, Edit, MapPin, Camera } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useEffect, useState, useRef } from "react";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import { Separator } from "@/components/ui/separator";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  home_location: z.string().optional(),
  avatar_file: z.any()
    .optional()
    .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 2MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

const ProfileInfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div>
    <Label className="text-sm text-muted-foreground">{label}</Label>
    <p className="text-base">{value || <span className="italic">Not set</span>}</p>
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm({
    resolver: zodResolver(profileSchema),
  });

  const avatarFile = watch("avatar_file");
  const previewAvatarUrl = avatarFile && avatarFile.length > 0 ? URL.createObjectURL(avatarFile[0]) : profile?.avatar_url;

  useEffect(() => {
    if (profile) {
      const defaultValues = {
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        home_location: profile.home_location || "",
        avatar_file: undefined, // Reset file input
      };
      reset(defaultValues);
    }
  }, [profile, reset]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showError("Geolocation is not supported by your browser.");
      return;
    }

    setIsFetchingLocation(true);
    const toastId = showLoading("Fetching your location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error('Failed to fetch address');
          
          const data = await response.json();
          if (data && data.display_name) {
            setValue("home_location", data.display_name, { shouldValidate: true });
            showSuccess("Location set successfully!");
          } else {
            throw new Error("Could not find address for your location.");
          }
        } catch (error: any) {
          showError(error.message);
        } finally {
          dismissToast(toastId);
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        dismissToast(toastId);
        showError(`Error getting location: ${error.message}`);
        setIsFetchingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: z.infer<typeof profileSchema>) => {
      if (!user) throw new Error("User not found");

      let avatarUrl = profile?.avatar_url;

      // Handle avatar upload if a file is provided
      if (updatedProfile.avatar_file && updatedProfile.avatar_file.length > 0) {
        const file = updatedProfile.avatar_file[0];
        const filePath = `${user.id}/avatars/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);
        
        avatarUrl = publicUrlData.publicUrl;

        // Optionally delete old avatar if it exists and is not default
        if (profile?.avatar_url && !profile.avatar_url.includes('googleusercontent.com')) {
          const oldPath = profile.avatar_url.split('avatars/')[1];
          if (oldPath) {
            await supabase.storage.from('avatars').remove([`${user.id}/avatars/${oldPath}`]);
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id,
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          phone: updatedProfile.phone,
          home_location: updatedProfile.home_location,
          avatar_url: avatarUrl,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      showSuccess("Profile updated successfully!");
      setIsEditing(false);
    },
    onError: (error) => {
      showError(`Failed to update profile: ${error.message}`);
    },
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32 self-end" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={previewAvatarUrl} alt={profile?.first_name || ""} />
                <AvatarFallback>
                  <User className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    {...register("avatar_file")}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">{profile?.first_name} {profile?.last_name}</CardTitle>
              <CardDescription>View and edit your personal information below.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input id="first_name" {...register("first_name")} />
                  {errors.first_name && <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input id="last_name" {...register("last_name")} />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="e.g., +91 12345 67890" {...register("phone")} />
              </div>
              <div>
                <Label htmlFor="home_location">Home Location</Label>
                <div className="relative">
                  <Input id="home_location" placeholder="e.g., T. Nagar, Chennai" {...register("home_location")} />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={handleGetLocation}
                    disabled={isFetchingLocation}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Set a primary location for targeted alerts.</p>
              </div>
              {errors.avatar_file && <p className="text-sm text-destructive mt-1">{errors.avatar_file.message}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <ProfileInfoRow label="First Name" value={profile?.first_name} />
                <ProfileInfoRow label="Last Name" value={profile?.last_name} />
              </div>
              <ProfileInfoRow label="Email" value={user?.email} />
              <ProfileInfoRow label="Phone Number" value={profile?.phone} />
              <ProfileInfoRow label="Home Location" value={profile?.home_location} />
              <Separator />
              <PushNotificationToggle />
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 