"use client";

import { useActionState } from "react";
import {
  acceptInvitationAction,
  type InviteState,
} from "@/app/invitations/actions";
import { Field, SubmitButton, FormError } from "@/components/ui/form";

const initialState: InviteState = { error: null };

export function AcceptInvitationForm({
  token,
  defaultEmail,
}: {
  token: string;
  defaultEmail: string;
}) {
  const [state, formAction] = useActionState(
    acceptInvitationAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />
      <input type="hidden" name="token" value={token} />
      <Field label="Your name" name="full_name" autoComplete="name" required />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink shadow-sm outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
      </label>
      <Field
        label="Create a password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        placeholder="At least 8 characters"
      />
      <SubmitButton>Set up my tracker</SubmitButton>
    </form>
  );
}
