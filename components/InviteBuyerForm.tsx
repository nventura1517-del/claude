"use client";

import { useActionState, useState } from "react";
import {
  createInvitationAction,
  type InviteState,
} from "@/app/invitations/actions";
import { SubmitButton, FormError, FormNotice } from "@/components/ui/form";

const initialState: InviteState = { error: null };

function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; the link is still selectable above.
    }
  }

  return (
    <div className="rounded-xl border border-line bg-canvas p-3">
      <p className="mb-1.5 text-xs font-medium text-muted">
        Shareable invite link
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full truncate rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

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
      {state.inviteUrl && <InviteLink url={state.inviteUrl} />}
    </form>
  );
}
