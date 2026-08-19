"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type AuthFormState } from "@/app/auth/actions";
import { AuthCard } from "@/components/AuthCard";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

const initialState: AuthFormState = { error: null };

export default function LoginPage() {
  const [state, formAction] = useActionState(signInAction, initialState);

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to see where your transactions stand."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-brand">
            Create an agent account
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <FormError message={state.error} />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <SubmitButton>Sign in</SubmitButton>
      </form>
    </AuthCard>
  );
}
