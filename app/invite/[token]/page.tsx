import Link from "next/link";
import { getInvitationForToken } from "@/lib/data/invitations";
import { AuthCard } from "@/components/AuthCard";
import { AcceptInvitationForm } from "@/components/AcceptInvitationForm";

const INVALID_MESSAGE: Record<string, string> = {
  not_found: "We couldn't find this invitation. Please check the link.",
  expired: "This invitation has expired. Ask your agent to send a new one.",
  used: "This invitation has already been used. Try signing in instead.",
  revoked: "This invitation was withdrawn. Contact your agent for a new link.",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const view = await getInvitationForToken(token);

  if (!view.valid) {
    return (
      <AuthCard
        title="Invitation unavailable"
        subtitle={INVALID_MESSAGE[view.reason]}
        footer={
          <Link href="/login" className="font-semibold text-brand">
            Go to sign in
          </Link>
        }
      >
        <p className="text-sm text-muted">
          If you believe this is a mistake, reach out to the agent who invited
          you.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Follow your home purchase"
      subtitle={`${view.agentName} invited you to track ${view.propertyLabel}.`}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand">
            Sign in
          </Link>
        </>
      }
    >
      <AcceptInvitationForm token={token} defaultEmail={view.email} />
    </AuthCard>
  );
}
