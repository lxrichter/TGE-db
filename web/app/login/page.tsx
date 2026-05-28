"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("your@email.com");
  const [password, setPassword] = useState("test1234");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    console.log("LOGIN DEBUG: submit fired", { email });

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      console.log("LOGIN DEBUG: signIn result", result);

      if (!result) {
        setError("No response from authentication.");
        setIsSubmitting(false);
        return;
      }

      if (result.error) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch (err) {
      console.error("LOGIN DEBUG: signIn exception", err);
      setError("Login failed unexpectedly.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--tge-surface-page)] px-6 py-10">
      <div className="mx-auto max-w-md border border-[var(--tge-governance-neutral-border)] bg-[var(--tge-surface-card)]">
        <div className="border-l-4 border-l-[var(--tge-brand-green)] px-8 py-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--tge-brand-green)]">
            ThinkGeoEnergy
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--tge-text-primary)]">
            Internal Database Platform
          </h1>
          <p className="mt-4 text-base leading-7 text-[var(--tge-text-secondary)]">
            Internal database access for authorised users only.
          </p>
        </div>

        <div className="border-t border-[var(--tge-governance-neutral-border)] px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[var(--tge-governance-neutral-border)] px-4 py-2 text-sm text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--tge-governance-neutral-text)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[var(--tge-governance-neutral-border)] px-4 py-2 text-sm text-[var(--tge-text-primary)] outline-none focus:border-[var(--tge-brand-green)]"
                required
              />
            </div>

            {error ? (
              <div className="border border-[var(--tge-governance-danger-border)] bg-[var(--tge-governance-danger-bg)] px-4 py-3 text-sm text-[var(--tge-governance-danger-text)]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full border border-[var(--tge-brand-green)] bg-[var(--tge-brand-green)] px-4 py-2.5 text-sm font-semibold text-[var(--tge-surface-card)] hover:bg-[var(--tge-brand-green-dark)] disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
