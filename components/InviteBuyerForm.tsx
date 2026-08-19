"use client";

import { useActionState } from "react";
import {
  createInvitationAction,
  type InviteState,
} from "@/app/invitations/actions";
import { SubmitButton, FormError, FormNotice } from "@/components/ui/form";

const initialState: InviteState = { error: null };

export function InviteBuyerForm({
  transactionId,
  defaultEmail,
}: {
  transactionId: string;
  defaultEmail?: string | null;
}) {
  const [state, formAction] = useActionState(
    createInvitationAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="transaction_id" value={transactionId} />
      <FormError message={state.error} />
      <FormNotice message={state.notice} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          defaultValue={defaultEmail ?? ""}
          placeholder="buyer@email.com"
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base text-ink shadow-sm outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/30"
        />
        <div className="shrink-0">
          <SubmitButton>Send invite</SubmitButton>
        </div>
      </div>
    </form>
  );
}
