import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";

const fetchSiteConfig = async () => {
  const { data, error } = await supabase
    .from('site_config')
    .select('is_flood_season_active')
    .eq('id', 1)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

const SiteSettings = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['siteConfig'],
    queryFn: fetchSiteConfig,
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (is_flood_season_active: boolean) => {
      const { error } = await supabase
        .from('site_config')
        .update({ is_flood_season_active })
        .eq('id', 1);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteConfig'] });
      showSuccess("Site settings updated successfully.");
    },
    onError: (error) => {
      showError(`Failed to update settings: ${error.message}`);
    },
  });

  const handleToggle = (checked: boolean) => {
    updateConfigMutation.mutate(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site-wide Settings</CardTitle>
        <CardDescription>
          Control global application settings and emergency modes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <div className="flex items-center space-x-4">
            <Switch
              id="flood-season-mode"
              checked={data?.is_flood_season_active}
              onCheckedChange={handleToggle}
              disabled={updateConfigMutation.isPending}
            />
            <Label htmlFor="flood-season-mode" className="text-base">
              Activate Emergency Alert Mode
            </Label>
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          When activated, a warning banner will be displayed, the live map will show flood report density, and a "Flood" option will be available in the issue reporting form.
        </p>
      </CardContent>
    </Card>
  );
};

export default SiteSettings; 