import { Navigation } from "@/components/Layout/Navigation";
import { Footer } from "@/components/Layout/Footer";
import { Analytics } from "@vercel/analytics/next"
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Analytics />
      <Navigation />
      <main className="z-50 relative" data-aos="fade-up" data-aos-delay="40">
        {children}
      </main>
      <Footer />
    </>
  );
}
