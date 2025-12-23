import { ObjectId } from "mongodb";

export type FieldType =
  | "text"
  | "email"
  | "textarea"
  | "image"
  | "video"
  | "static-text"
  | "static-image"
  | "static-video"
  | "replicator";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  // For static content
  content?: string;
  // For replicator
  schema?: FormField[];
  maxItems?: number;
  minItems?: number;
}

export interface Form {
  _id?: ObjectId;
  formId: string; // Public ID (slug)
  name: string;
  description?: string;
  fields: FormField[];
  createdAt: Date;
  status: "active" | "inactive";
}

export interface Submission {
  _id?: ObjectId;
  formId: string;
  submissionId: string; // Unique ID for public verification
  data: Record<string, any>; // Keys match FormField.id
  submittedAt: Date;
}
