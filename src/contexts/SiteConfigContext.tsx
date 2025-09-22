import { createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type SiteConfigContextType = {
  isFloodSeasonActive: boolean;
  isLoading: boolean;
};

const SiteConfigContext = createContext<SiteConfigContextType>({
  isFloodSeasonActive: false,
  isLoading: true,
});

const fetchSiteConfig = async () => {
  const { data, error } = await supabase
    .from('site_config')
    .select('is_flood_season_active')
    .eq('id', 1)
    .single();

  if (error) {
    console.error("Error fetching site config:", error);
    // Default to false if there's an error to be safe
    return { is_flood_season_active: false };
  }
  return data;
};


export const SiteConfigProvider = ({ children }: { children: ReactNode }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['siteConfig'],
    queryFn: fetchSiteConfig,
    staleTime: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const value = {
    isFloodSeasonActive: data?.is_flood_season_active || false,
    isLoading,
  };

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};