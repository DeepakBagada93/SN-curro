import type { Metadata } from "next";
import { signUp } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Create your workspace", description: "Create a Curro workspace for your agency: client knowledge brains, planning, claim-checked drafts, client review links and a publishing calendar. Free during beta." };

export default function SignUp() {
  return (
    <div className="container-x max-w-md py-16 md:py-24">
      <div className="rise text-center">
        <p className="eyebrow">Get started</p>
        <h1 className="h-display mt-2 text-4xl">Build your agency&apos;s knowledge OS.</h1>
        <p className="prose-muted mt-2 text-sm">One workspace for every client. Free during beta, no card, and a demo university account ready to explore.</p>
      </div>
      <AuthForm action={signUp} submitLabel="Create workspace →" glow>
        <div><label className="label" htmlFor="su-name">Your name</label><input id="su-name" name="name" required minLength={2} maxLength={80} className="input" autoComplete="name" placeholder="Ada Lovelace" /></div>
        <div><label className="label" htmlFor="su-email">Work email</label><input id="su-email" name="email" type="email" required className="input" autoComplete="email" placeholder="you@agency.com" /></div>
        <div><label className="label" htmlFor="su-password">Password (8+ characters)</label><input id="su-password" name="password" type="password" required minLength={8} maxLength={128} className="input" autoComplete="new-password" placeholder="Make it a good one" /></div>
        <p className="text-center text-sm text-muted-foreground">Have one already? <a href="/signin" className="font-semibold text-accent hover:underline">Sign in</a></p>
      </AuthForm>
    </div>
  );
}
