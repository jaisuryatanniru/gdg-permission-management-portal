import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Inter } from "next/font/google"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GDG Permission Portal",
  description: "Internal tool for GDG operations",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}