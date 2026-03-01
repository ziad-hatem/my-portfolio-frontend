"use client";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "url" | "email" | "date";
}

export default function FormField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-muted-foreground">
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}
