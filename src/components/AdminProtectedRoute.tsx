import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

const AdminProtectedRoute = () => {
  const { session, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!session || profile?.role !== 'admin') {
    // Redirect them to the home page if they are not an admin
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute; 