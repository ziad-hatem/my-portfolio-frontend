"use client";

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  mono?: boolean;
}

export default function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  mono = false,
}: FormTextareaProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-muted-foreground">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
          mono ? "font-mono" : "",
        ].join(" ")}
      />
    </label>
  );
}
