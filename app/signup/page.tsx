"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type AuthFormState } from "@/app/auth/actions";
import { AuthCard } from "@/components/AuthCard";
import {
  Field,
  SubmitButton,
  FormError,
  FormNotice,
} from "@/components/ui/form";

const initialState: AuthFormState = { error: null };

export default function SignupPage() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  return (
    <AuthCard
      title="Create your agent account"
      subtitle="Set up transactions and give your clients a clear view of every step."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <FormError message={state.error} />
        <FormNotice message={state.notice} />
        <Field
          label="Full name"
          name="full_name"
          autoComplete="name"
          required
        />
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
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
        />
        <SubmitButton>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
