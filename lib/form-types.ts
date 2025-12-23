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

export interface SubmissionMetadata {
  userAgent: string;
  language: string;
  screen: {
    width: number;
    height: number;
  };
  location?: {
    lat: number;
    lng: number;
    accuracy: number;
    error?: string;
  };
  ip?: string;
  ipInfo?: {
    country?: string;
    city?: string;
    region?: string;
    regionName?: string;
    isp?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
  };
}

export interface Submission {
  _id?: ObjectId;
  formId: string;
  submissionId: string; // Unique ID for public verification
  data: Record<string, any>; // Keys match FormField.id
  metadata?: SubmissionMetadata;
  submittedAt: Date;
}
