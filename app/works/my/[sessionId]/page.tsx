import { OpenSavedWorksSearch } from "@/components/works/account/open-saved-search";

export default function MyWorksSavedSearchPage({ params }: { params: { sessionId: string } }) {
  return <OpenSavedWorksSearch sessionId={params.sessionId} />;
}
