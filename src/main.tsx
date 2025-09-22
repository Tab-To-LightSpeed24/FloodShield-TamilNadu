import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { SiteConfigProvider } from "./contexts/SiteConfigContext.tsx";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiteConfigProvider>
          <App />
        </SiteConfigProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);