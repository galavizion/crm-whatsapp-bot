"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import NextTopLoader from "nextjs-toploader";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const showSidebar =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/god") ||
    pathname.startsWith("/mi-negocio");

  if (!showSidebar) {
    return (
      <>
        <NextTopLoader color="#8c7ac6" showSpinner={false} />
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen">
      <NextTopLoader color="#8c7ac6" showSpinner={false} />
      <Sidebar />
      <main className="flex-1 pt-16 lg:pt-0 p-4 md:p-6 lg:p-8 overflow-x-hidden">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}