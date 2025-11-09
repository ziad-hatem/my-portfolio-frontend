import { SinglePostPage } from "@/Cpages/Posts Page/Single Post/SinglePostPage";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SinglePostPage postId={id} />;
}
