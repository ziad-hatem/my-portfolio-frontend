import { getForm } from "@/lib/form-actions";
import { FormDisplay } from "./form-display";
import { notFound } from "next/navigation";
import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
}
 
export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  const { id } = await params
  const form = await getForm(id)
 
  if (!form) {
    return {
      title: 'Form Not Found',
    }
  }

  return {
    title: form.name,
    description: `Please fill out the ${form.name} form.`,
    openGraph: {
      title: form.name,
      description: `Please fill out the ${form.name} form.`,
      images: [
        {
          url: `/form/${id}/opengraph-image`, // Maps to the opengraph-image.tsx we created
          width: 1200,
          height: 630,
        },
      ],
    },
  }
}

export default async function FormPage({ params }: Props) {
    const { id } = await params;
    const form = await getForm(id);

    if (!form) notFound();

    return <FormDisplay form={form} />;
}
