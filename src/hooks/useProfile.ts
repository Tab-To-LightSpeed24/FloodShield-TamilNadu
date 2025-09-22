import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

const fetchProfile = async (userId: string | undefined): Promise<Profile | null> => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error.message);
    // Don't throw error, as it could be a new user whose profile is not yet created.
    return null;
  }
  return data;
};

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user?.id),
    enabled: !!user,
  });
};