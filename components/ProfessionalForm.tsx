"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { ProfessionalFormState } from "@/app/network/actions";
import type { Professional } from "@/lib/types";
import { PROFESSIONAL_CATEGORIES } from "@/lib/professionals/categories";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

const initialState: ProfessionalFormState = { error: null };

export function ProfessionalForm({
  action,
  professional,
  submitLabel,
}: {
  action: (
    prev: ProfessionalFormState,
    formData: FormData
  ) => Promise<ProfessionalFormState>;
  professional?: Professional;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      {professional && (
        <input type="hidden" name="id" value={professional.id} />
      )}

      <Field
        label="Name"
        name="name"
        required
        placeholder="e.g. Priya Sharma"
        defaultValue={professional?.name}
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Category
        </span>
        <select
          name="category"
          defaultValue={professional?.category ?? ""}
          required
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        >
          <option value="" disabled>
            Select a category…
          </option>
          {PROFESSIONAL_CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Company (optional)"
        name="company"
        defaultValue={professional?.company ?? undefined}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Phone (optional)"
          name="phone"
          type="tel"
          defaultValue={professional?.phone ?? undefined}
        />
        <Field
          label="Email (optional)"
          name="email"
          type="email"
          defaultValue={professional?.email ?? undefined}
        />
      </div>
      <Field
        label="Website (optional)"
        name="website"
        type="url"
        placeholder="https://"
        defaultValue={professional?.website ?? undefined}
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">
          Notes (optional)
        </span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={professional?.notes ?? ""}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </label>

      <div className="flex items-center gap-3 pt-2">
        <div className="w-full sm:w-auto">
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
        <Link
          href="/network"
          className="text-sm font-medium text-muted hover:text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
