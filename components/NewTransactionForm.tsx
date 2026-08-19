"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createTransactionAction,
  type CreateTransactionState,
} from "@/app/transactions/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

const initialState: CreateTransactionState = { error: null };

export function NewTransactionForm() {
  const [state, formAction] = useActionState(
    createTransactionAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-8">
      <FormError message={state.error} />

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Property
        </h2>
        <div className="mt-4 space-y-4">
          <Field label="Street address" name="property_street" required />
          <Field label="Unit / Apt (optional)" name="property_unit" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" name="property_city" required />
            <Field label="State" name="property_state" required />
            <Field label="ZIP" name="property_postal_code" required />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Buyer
        </h2>
        <p className="mt-1 text-sm text-muted">
          You&rsquo;ll invite them to their tracker in the next step.
        </p>
        <div className="mt-4 space-y-4">
          <Field label="Buyer name" name="buyer_name" autoComplete="off" />
          <Field
            label="Buyer email"
            name="buyer_email"
            type="email"
            autoComplete="off"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Timeline
        </h2>
        <div className="mt-4">
          <Field
            label="Estimated closing date"
            name="estimated_closing_date"
            type="date"
          />
          <p className="mt-2 text-sm text-muted">
            Used to pre-fill suggested due dates. You can change everything
            later.
          </p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <div className="w-full sm:w-auto">
          <SubmitButton>Create transaction</SubmitButton>
        </div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
