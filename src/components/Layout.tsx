import Header from "./Header";
import { Outlet } from "react-router-dom";
import EmergencyAlertBanner from "./EmergencyAlertBanner";

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <EmergencyAlertBanner />
      <main className="flex-1 container mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout; 