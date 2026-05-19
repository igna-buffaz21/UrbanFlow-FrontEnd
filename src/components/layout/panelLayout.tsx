import { Outlet } from "react-router-dom";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function PanelLayout() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />

        <div className="flex flex-1">
          <AppSidebar />

          <SidebarInset>
            <main className="flex flex-1 flex-col gap-4 p-4">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}