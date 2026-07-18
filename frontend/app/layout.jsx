import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Information Is Wealth | Government Welfare Schemes Portal",
  description: "Find, track, and apply for government welfare schemes you are eligible for in India.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#11172a", // Match brand navy-950
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Additional meta tags if needed */}
      </head>
      <body className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}