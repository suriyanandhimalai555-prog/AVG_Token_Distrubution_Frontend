import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface ShellProps {
  children?: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-terminal text-text-primary font-sans min-w-[1024px]">
      <Sidebar />
      <TopBar />
      <main className="ml-14 pt-10 min-h-screen">
        <div className="p-6">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
