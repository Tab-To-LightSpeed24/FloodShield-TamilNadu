import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import ReportIssue from "./pages/ReportIssue";
import LiveMap from "./pages/LiveMap";
import Alerts from "./pages/Alerts";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import MyReports from "./pages/MyReports";
import Admin from "./pages/Admin";
import { useAuth } from "./contexts/AuthContext";
import { Skeleton } from "./components/ui/skeleton";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import DetailedForecast from "./pages/DetailedForecast";
import IssueDetails from "./pages/IssueDetails";

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/map" element={<LiveMap />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/login" element={<Login />} />
          <Route path="/issue/:id" element={<IssueDetails />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/forecast" element={<DetailedForecast />} />
          </Route>

          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES HERE */}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App; 