import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="[--header-height:calc(--spacing(14))]">
        <h1>rol ciudadano</h1>
        <Outlet />
    </div>
  );
}