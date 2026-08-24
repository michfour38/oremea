import { OpenSavedWorksSearch } from "@/components/works/account/open-saved-search";

export default async function MyWorksSavedSearchPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = await props.params;
  return <OpenSavedWorksSearch sessionId={params.sessionId} />;
}
