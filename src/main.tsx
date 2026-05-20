import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./modules/auth/auth.context";

import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Falta VITE_CLERK_PUBLISHABLE_KEY en el .env");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="urbanflow-theme">
            <TooltipProvider>
              <App />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);