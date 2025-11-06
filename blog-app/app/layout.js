'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { AuthProvider } from "./src/utils/auth_context";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function LayoutContent({ children }) {
  const pathname = usePathname();
  
  // Check if the current path is a dashboard route
  const isDashboardRoute = pathname?.startsWith('/src/dashboard') || 
                          pathname?.startsWith('/my-posts') || 
                          pathname?.startsWith('/create-post') ||
                          pathname?.startsWith('/categories') ||
                          pathname?.startsWith('/analytics') ||
                          pathname?.startsWith('/comments') ||
                          pathname?.startsWith('/settings') ||
                          pathname?.startsWith('/help') ||
                          pathname?.startsWith('/admin');

  return (
    <>
      {!isDashboardRoute && <Navbar />}
      <main className={!isDashboardRoute ? "min-h-screen" : ""}>
        {children}
      </main>
      {!isDashboardRoute && <Footer />}
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
