import { isValidEmail } from "./validateEmail";

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export function validateContactForm(values: ContactFormData): FormErrors {
  const errors: FormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Please enter your full name.";
  }

  if (!isValidEmail(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (values.subject.trim().length < 4) {
    errors.subject = "Subject should be at least 4 characters.";
  }

  if (values.message.trim().length < 20) {
    errors.message = "Message should be at least 20 characters.";
  }

  return errors;
}
