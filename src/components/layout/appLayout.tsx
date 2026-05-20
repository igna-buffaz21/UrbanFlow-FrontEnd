import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
        <Outlet />
    </div>
  );
}