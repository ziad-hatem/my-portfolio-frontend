import GPACalculator from "./GPACalculator";

export const revalidate = 86400; // Cache for 24 hours

export const metadata = {
  title: "GPA Calculator | Precision Academic Tool",
  description:
    "Calculate your semester GPA instantly. Supports fixed credit hours, automated logic, and result exporting. Perfect for university students.",
  keywords: [
    "GPA Calculator",
    "Academic Tool",
    "University Grades",
    "Semester GPA",
    "Credit Hours",
    "Student Tools",
  ],
  authors: [{ name: "Ziad Hatem" }],
  openGraph: {
    title: "GPA Calculator | Precision Academic Tool",
    description:
      "Calculate your semester GPA instantly with our precise, student-friendly tool.",
    type: "website",
    locale: "en_US",
    siteName: "Ziad Hatem Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "GPA Calculator | Precision Academic Tool",
    description:
      "Calculate your semester GPA instantly. Supports fixed credit hours and result exporting.",
  },
};

export default function GPACalculatorPage() {
  return (
    <main className="min-h-screen py-12 md:py-20">
      <GPACalculator />
    </main>
  );
}
