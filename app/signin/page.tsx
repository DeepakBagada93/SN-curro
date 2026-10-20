import type { Metadata } from "next";
import { signIn } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";
import { GoogleSignIn } from "@/components/google-signin";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your Curro workspace with Google or email." };

const ERRORS: Record<string, string> = {
  "google-config": "Google login is not configured yet. Add SUPABASE_URL and publishable key to the environment.",
  "google-start": "Google sign-in could not start. Check the Supabase Google provider configuration.",
  "google-code": "Google sign-in did not complete. Please try again.",
  "google-owner": "This workspace belongs to a different email address. Sign in with the owner account."
};

export default function SignIn({ searchParams }: { searchParams: { error?: string; next?: string } }) {
  const next = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/getting-started";
  return (
    <div className="container-x max-w-md py-16 md:py-24">
      <div className="rise text-center">
        <p className="eyebrow">Welcome back</p>
        <h1 className="h-display mt-2 text-4xl">Sign in to Curro.</h1>
        <p className="prose-muted mt-2 text-sm">Your clients, plans, drafts and claim ledgers are waiting where you left them.</p>
      </div>
      {searchParams.error && (
        <p className="alert alert-danger mt-6" role="alert">{ERRORS[searchParams.error] ?? "Sign-in failed. Please try again."}</p>
      )}
      <div className="card rise rise-1 mt-6 space-y-4">
        <GoogleSignIn next={next} label="Sign in with Google" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /><span>or use email and password</span><span className="h-px flex-1 bg-border" />
        </div>
      </div>
      <AuthForm action={signIn} submitLabel="Sign in with email →">
        <div><label className="label" htmlFor="si-email">Email</label><input id="si-email" name="email" type="email" required className="input" autoComplete="email" placeholder="you@agency.com" /></div>
        <div><label className="label" htmlFor="si-password">Password</label><input id="si-password" name="password" type="password" required minLength={8} className="input" autoComplete="current-password" placeholder="••••••••" /></div>
        <p className="text-center text-sm text-muted-foreground">New here? <a href="/signup" className="font-semibold text-accent hover:underline">Create your workspace</a></p>
      </AuthForm>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">Google sign-in is handled by Supabase Auth. Curro never sees your password.</p>
    </div>
  );
}
