import { SignUp } from "@clerk/nextjs";

type SignUpPageProps = {
  searchParams?: Promise<{
    redirect_url?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url || "/";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl={`/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`}
        fallbackRedirectUrl={redirectUrl}
        signInFallbackRedirectUrl={redirectUrl}
      />
    </main>
  );
}
