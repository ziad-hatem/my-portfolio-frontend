import { AdminAnalytics } from "@/Cpages/AdminPage/AdminAnalytics";

// Force dynamic rendering since this page uses client-side features like localStorage
export const dynamic = 'force-dynamic';

export default function Admin() {
  return <AdminAnalytics />;
}
