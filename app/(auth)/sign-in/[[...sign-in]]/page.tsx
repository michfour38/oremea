import { SignIn } from "@clerk/nextjs";

type SignInPageProps = {
  searchParams?: {
    redirect_url?: string;
  };
};

export default function SignInPage({ searchParams }: SignInPageProps) {
  const redirectUrl = searchParams?.redirect_url || "/";

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
