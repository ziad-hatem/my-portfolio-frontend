import AdminCongratulationPage from "@/Cpages/AdminCongratulationPage/AdminCongratulationPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Congratulation Generator | Ziad Hatem",
  description: "Admin page for generating congratulations pages",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <AdminCongratulationPage />;
}
