import { Navigation } from "@/components/Layout/Navigation";
import { Footer } from "@/components/Layout/Footer";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navigation />
      <main className="z-50 relative" data-aos="fade-up" data-aos-delay="40">
        {children}
      </main>
      <Footer />
    </>
  );
}
