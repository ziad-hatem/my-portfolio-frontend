"use client";

import { useState, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Share2,
  Calculator,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { toPng } from "html-to-image";
import { StyledInput } from "@/components/ui/StyledInput";
import { cn } from "@/utils/cn";

interface Subject {
  id: string;
  name: string;
  grade: string;
  credits: string;
}

interface GradeResult {
  gpa: number;
  totalPoints: number;
  totalCredits: number;
  rank: string;
  rankColor: string;
}

const INITIAL_ROW: Subject = { id: "1", name: "", grade: "", credits: "" };

const PREDEFINED_SUBJECTS = [
  { name: "Economics and Management", credits: 3 },
  { name: "Physics", credits: 3 },
  { name: "Math 1", credits: 2 },
  { name: "English", credits: 2 },
  { name: "Human Rights", credits: 1 },
  { name: "Intro to Programming", credits: 4 },
  { name: "Intro to Computer Science", credits: 3 },
];

export default function GPACalculator() {
  const [subjects, setSubjects] = useState<Subject[]>([INITIAL_ROW]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const getAvailableSubjects = (currentId: string) => {
    const selectedNames = subjects
      .filter((s) => s.id !== currentId)
      .map((s) => s.name);
    return PREDEFINED_SUBJECTS.filter((s) => !selectedNames.includes(s.name));
  };

  const addRow = () => {
    if (subjects.length < PREDEFINED_SUBJECTS.length) {
      setSubjects([
        ...subjects,
        { id: crypto.randomUUID(), name: "", grade: "", credits: "" },
      ]);
    }
  };

  const removeRow = (id: string) => {
    if (subjects.length > 1) {
      setSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  const updateSubject = (id: string, field: keyof Subject, value: string) => {
    if (field === "name") {
      const selectedSubject = PREDEFINED_SUBJECTS.find((s) => s.name === value);
      if (selectedSubject) {
        setSubjects(
          subjects.map((s) =>
            s.id === id
              ? {
                  ...s,
                  name: value,
                  credits: selectedSubject.credits.toString(),
                }
              : s
          )
        );
      }
    } else {
      setSubjects(
        subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
    }
  };

  const getPoints = (percentage: number) => {
    if (percentage >= 93) return 4.0;
    if (percentage >= 89) return 3.7;
    if (percentage >= 84) return 3.3;
    if (percentage >= 80) return 3.0;
    if (percentage >= 76) return 2.7;
    if (percentage >= 73) return 2.3;
    if (percentage >= 70) return 2.0;
    if (percentage >= 67) return 1.7;
    if (percentage >= 64) return 1.3;
    if (percentage >= 60) return 1.0;
    return 0.0;
  };

  const getLetterGrade = (points: number) => {
    if (points === 4.0) return "A";
    if (points === 3.7) return "A-";
    if (points === 3.3) return "B+";
    if (points === 3.0) return "B";
    if (points === 2.7) return "B-";
    if (points === 2.3) return "C+";
    if (points === 2.0) return "C";
    if (points === 1.7) return "C-";
    if (points === 1.3) return "D+";
    if (points === 1.0) return "D";
    return "F";
  };

  const getRank = (gpa: number) => {
    if (gpa >= 3.5)
      return {
        text: "Excellent",
        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      };
    if (gpa >= 3.0)
      return {
        text: "Very Good",
        color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      };
    if (gpa >= 2.5)
      return {
        text: "Good",
        color: "text-teal-400 bg-teal-400/10 border-teal-400/20",
      };
    if (gpa >= 2.0)
      return {
        text: "Sufficient",
        color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      };
    if (gpa >= 1.0)
      return {
        text: "Weak",
        color: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      };
    return {
      text: "Very Weak",
      color: "text-red-400 bg-red-400/10 border-red-400/20",
    };
  };

  const calculateGPA = () => {
    let totalQualityPoints = 0;
    let totalCredits = 0;

    subjects.forEach((s) => {
      const grade = parseFloat(s.grade);
      const credits = parseFloat(s.credits);

      if (!isNaN(grade) && !isNaN(credits)) {
        const points = getPoints(grade);
        totalQualityPoints += points * credits;
        totalCredits += credits;
      }
    });

    if (totalCredits === 0) {
      setResult(null); // Or show error?
      return;
    }

    const gpa = totalQualityPoints / totalCredits;
    const rank = getRank(gpa);

    setResult({
      gpa,
      totalPoints: totalQualityPoints,
      totalCredits,
      rank: rank.text,
      rankColor: rank.color,
    });
  };

  const resetForm = () => {
    setSubjects([INITIAL_ROW]);
    setResult(null);
  };

  const exportAsImage = useCallback(async () => {
    if (resultRef.current === null) {
      return;
    }

    try {
      const dataUrl = await toPng(resultRef.current, { cacheBust: true });
      const link = document.createElement("a");
      link.download = "gpa-report.png";
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    }
  }, [resultRef]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-foreground">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400 mb-2">
          Academic GPA Calculator
        </h1>
        <p className="text-muted-foreground">
          Calculate your semester GPA with precision.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr]">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-card/50 backdrop-blur-sm rounded-3xl shadow-sm border border-border p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-card-foreground">
                Subjects
              </h2>
            </div>

            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div
                  key={subject.id}
                  className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-start animate-in fade-in slide-in-from-bottom-2 duration-300 bg-background/30 p-3 sm:p-0 rounded-xl sm:bg-transparent"
                >
                  <div className="flex-1 min-w-[120px] relative group">
                    <select
                      className="w-full bg-background/50 border border-input text-foreground placeholder:text-muted-foreground focus:ring-accent/20 focus:border-accent py-3 pl-4 pr-10 rounded-xl appearance-none transition-all hover:bg-accent/5 hover:border-accent/50 cursor-pointer outline-none"
                      value={subject.name}
                      onChange={(e) =>
                        updateSubject(subject.id, "name", e.target.value)
                      }
                    >
                      <option value="" disabled>
                        Select Subject
                      </option>
                      {getAvailableSubjects(subject.id).map((s) => (
                        <option
                          key={s.name}
                          value={s.name}
                          className="text-foreground bg-popover"
                        >
                          {s.name}
                        </option>
                      ))}
                      {/* Always show current value even if "taken" by this row */}
                      {subject.name &&
                        !getAvailableSubjects(subject.id).some(
                          (s) => s.name === subject.name
                        ) && (
                          <option
                            value={subject.name}
                            className="text-foreground bg-popover"
                          >
                            {subject.name}
                          </option>
                        )}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-accent transition-colors pointer-events-none"
                      size={18}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 sm:w-24">
                      <StyledInput
                        type="number"
                        placeholder="%"
                        className="bg-background/50 border-input text-foreground placeholder:text-muted-foreground focus:ring-accent/20 focus:border-accent py-3 rounded-xl text-center w-full"
                        value={subject.grade}
                        onChange={(e) =>
                          updateSubject(subject.id, "grade", e.target.value)
                        }
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="flex-1 sm:w-20">
                      <StyledInput
                        type="number"
                        placeholder="Cr"
                        className="bg-background/20 border-input text-muted-foreground placeholder:text-muted-foreground py-3 rounded-xl text-center w-full cursor-not-allowed opacity-70"
                        value={subject.credits}
                        readOnly
                        min={0}
                        max={10}
                      />
                    </div>
                    {subjects.length > 1 && (
                      <button
                        onClick={() => removeRow(subject.id)}
                        className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors sm:mt-1"
                        aria-label="Remove subject"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {subjects.length < PREDEFINED_SUBJECTS.length && (
              <button
                onClick={addRow}
                className="mt-6 w-full py-3 flex items-center justify-center gap-2 text-accent bg-accent/10 hover:bg-accent/20 rounded-xl font-medium transition-colors"
              >
                <Plus size={18} /> Add Subject
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetForm}
              className="flex-1 py-4 flex items-center justify-center gap-2 text-muted-foreground bg-card border border-border hover:bg-muted/50 rounded-2xl font-semibold shadow-sm transition-all"
            >
              <RotateCcw size={18} /> Reset
            </button>
            <button
              onClick={calculateGPA}
              className="flex-[2] py-4 flex items-center justify-center gap-2 text-accent-foreground bg-accent hover:bg-emerald-400 rounded-2xl font-semibold shadow-md shadow-accent/20 transition-all hover:scale-[1.02]"
            >
              <Calculator size={20} /> Calculate GPA
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="relative">
          {result ? (
            <div className="sticky top-6">
              <div
                ref={resultRef}
                className="bg-card rounded-3xl shadow-xl shadow-black/20 border border-border overflow-hidden"
              >
                <div className="p-8 text-center border-b border-border">
                  <h3 className="text-muted-foreground font-medium mb-1">
                    Final GPA
                  </h3>
                  <div className="text-6xl font-bold text-card-foreground tracking-tight my-2">
                    {result.gpa.toFixed(2)}
                  </div>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold mt-2 border",
                      result.rankColor
                    )}
                  >
                    {result.rank}
                  </div>
                </div>

                <div className="bg-muted/30 p-6">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    Summary
                  </h4>
                  <div className="space-y-3">
                    {subjects.map((s, i) => {
                      const grade = parseFloat(s.grade);
                      const credits = parseFloat(s.credits);
                      if (isNaN(grade) || isNaN(credits)) return null;
                      return (
                        <div
                          key={s.id}
                          className="flex justify-between items-center text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0"
                        >
                          <span className="font-medium text-foreground max-w-[120px]">
                            {s.name || `Subject ${i + 1}`}
                          </span>
                          <div className="flex gap-4 text-muted-foreground">
                            <span>{grade}%</span>
                            <span className="w-8 text-right font-semibold text-foreground">
                              {getLetterGrade(getPoints(grade))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/50 flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Credits</span>
                    <span className="font-bold text-foreground">
                      {result.totalCredits}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={exportAsImage}
                className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-primary-foreground bg-primary hover:bg-primary/90 rounded-2xl font-medium transition-colors shadow-lg shadow-black/20"
              >
                <Share2 size={18} /> Share Results
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-card/50 rounded-3xl border border-dashed border-border text-muted-foreground p-8 text-center sticky top-6">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 text-muted-foreground/50">
                <Calculator size={32} />
              </div>
              <p className="max-w-[200px]">
                Enter your grades and credit hours to see your GPA ranking.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
