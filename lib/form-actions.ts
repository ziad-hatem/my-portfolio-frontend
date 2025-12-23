"use server";

import { getDatabase } from "@/lib/mongodb";
import { Form, Submission, FormField } from "@/lib/form-types";
import { nanoid } from "nanoid";

export async function createForm(name: string = "Untitled Form", fields: FormField[] = []) {
  const db = await getDatabase();
  const formsCollection = db.collection<Form>("forms");

  const formId = nanoid(10); // Short unique ID
  const newForm: Form = {
    formId,
    name,
    fields,
    createdAt: new Date(),
    status: "active",
  };

  await formsCollection.insertOne(newForm);
  return { success: true, formId };
}

export async function submitForm(formId: string, data: any) {
  const db = await getDatabase();
  const submissionsCollection = db.collection<Submission>("submissions");

  const submissionId = nanoid(12);
  const newSubmission: Submission = {
    formId,
    submissionId,
    data,
    submittedAt: new Date(),
  };

  await submissionsCollection.insertOne(newSubmission);
  return { success: true, submissionId };
}

export async function verifySubmission(submissionId: string) {
    const db = await getDatabase();
    const submissionsCollection = db.collection<Submission>("submissions");
    
    // Add a slight artificial delay to simulate "checking" if needed, 
    // or just instant db lookup
    const exists = await submissionsCollection.findOne({ submissionId });
    return { exists: !!exists };
}

export async function getForm(formId: string) {
    const db = await getDatabase();
    // Assuming 'forms' collection. Verify collection name if needed.
    const formsCollection = db.collection<Form>("forms");
    const form = await formsCollection.findOne({ formId });
    
    if (form) {
        // serialization for client component
        return {
            ...form,
            _id: form._id?.toString(),
            createdAt: form.createdAt.toISOString()
        };
    }
    return null;
}

export async function getForms() {
    const db = await getDatabase();
    const formsCollection = db.collection<Form>("forms");
    
    const forms = await formsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    // Get submission counts
    const submissionsCollection = db.collection<Submission>("submissions");
    
    const formsWithCounts = await Promise.all(forms.map(async (form) => {
        const count = await submissionsCollection.countDocuments({ formId: form.formId });
        return {
            ...form,
            _id: form._id?.toString(),
            createdAt: form.createdAt.toISOString(),
            submissionCount: count
        };
    }));
    
    return formsWithCounts;
}

export async function getSubmissions(formId: string) {
    const db = await getDatabase();
    const submissionsCollection = db.collection<Submission>("submissions");
    
    const submissions = await submissionsCollection
        .find({ formId })
        .sort({ submittedAt: -1 })
        .toArray();
        
    return submissions.map(sub => ({
        ...sub,
        _id: sub._id?.toString(),
        submittedAt: sub.submittedAt.toISOString()
    }));
}
