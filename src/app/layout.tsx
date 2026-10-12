import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import { Footer } from "@/components/brand/Footer";
import { Splash } from "@/components/brand/Splash";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PetroManage | Petroleum Management System",
  description:
    "PetroManage unifies tank inventory, fuel distribution, station sales, and regulatory compliance in one real-time petroleum management platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          {/* pb-[30px] keeps content clear of the fixed footer */}
          <div className="flex flex-1 flex-col pb-[30px]">{children}</div>
          <Footer />
          <Splash />
        </LanguageProvider>
      </body>
    </html>
  );
}
