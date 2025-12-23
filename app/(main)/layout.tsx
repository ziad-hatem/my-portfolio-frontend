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
      <main className="z-50 relative">{children}</main>
      <Footer />
    </>
  );
}
