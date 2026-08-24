import { SignIn } from "@clerk/nextjs";

type SignInPageProps = {
  searchParams?: Promise<{
    redirect_url?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const redirectUrl = params?.redirect_url || "/";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
        fallbackRedirectUrl={redirectUrl}
        signUpFallbackRedirectUrl={redirectUrl}
      />
    </main>
  );
}
