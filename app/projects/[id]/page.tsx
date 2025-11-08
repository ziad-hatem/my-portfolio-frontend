import { SingleProjectPage } from "@/Cpages/Projects Page/Single Project Page/SingleProjectPage";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SingleProjectPage projectId={id} />;
}
