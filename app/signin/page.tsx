import type { Metadata } from "next";
import { signIn } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your Curro workspace." };

export default function SignIn() {
  return (
    <div className="container-x max-w-md py-16 md:py-24">
      <div className="rise text-center">
        <p className="eyebrow">Welcome back</p>
        <h1 className="h-display mt-2 text-4xl">Sign in to Curro.</h1>
        <p className="prose-muted mt-2 text-sm">Your clients, plans, drafts and claim ledgers are waiting where you left them.</p>
      </div>
      <AuthForm action={signIn} submitLabel="Sign in →">
        <div><label className="label" htmlFor="si-email">Email</label><input id="si-email" name="email" type="email" required className="input" autoComplete="email" placeholder="you@agency.com" /></div>
        <div><label className="label" htmlFor="si-password">Password</label><input id="si-password" name="password" type="password" required minLength={8} className="input" autoComplete="current-password" placeholder="••••••••" /></div>
        <p className="text-center text-sm text-muted-foreground">New here? <a href="/signup" className="font-semibold text-accent hover:underline">Create your workspace</a></p>
      </AuthForm>
    </div>
  );
}
