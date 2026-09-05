import type { Metadata } from "next";
import { SignInWithGoogle } from "@/components/SignInWithGoogle";

export const metadata: Metadata = {
  title: "Sign In — VeriTrace",
  description: "Sign in to VeriTrace to verify media authenticity",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo / brand */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">VeriTrace</h1>
          <p className="text-muted-foreground">
            Detect · Explain · Verify · Trace
          </p>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          Sign in to analyze media for manipulation, verify contextual claims,
          and trace sources before you trust or share.
        </p>

        {/* Sign-in */}
        <div className="flex flex-col items-center gap-4">
          <SignInWithGoogle />
          <p className="text-xs text-muted-foreground">
            By signing in you agree to use VeriTrace responsibly.
          </p>
        </div>
      </div>
    </main>
  );
}
