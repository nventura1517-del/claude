import { APP_NAME } from "@/lib/constants";

/** Minimal, inline-styled email shell that renders acceptably everywhere. */
function shell(bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f6f8fb;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;padding:28px">
    <div style="font-weight:600;font-size:18px;color:#1f6feb;margin-bottom:16px">${APP_NAME}</div>
    ${bodyHtml}
  </div>
  <div style="max-width:480px;margin:12px auto 0;color:#64748b;font-size:12px;text-align:center">You received this because someone invited you to track a home purchase on ${APP_NAME}.</div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#1f6feb;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px">${label}</a>`;
}

export function invitationEmail(params: {
  agentName: string;
  propertyLabel: string;
  acceptUrl: string;
}): { subject: string; html: string; text: string } {
  const { agentName, propertyLabel, acceptUrl } = params;
  const subject = `${agentName} invited you to track your home purchase`;
  const html = shell(
    `<h1 style="font-size:20px;margin:0 0 8px">You're invited to follow your home purchase</h1>
     <p style="color:#334155;line-height:1.5;margin:0 0 8px">${agentName} set up a simple tracker for <strong>${propertyLabel}</strong>.</p>
     <p style="color:#334155;line-height:1.5;margin:0 0 20px">See exactly what's happening, what's next, and whether you need to do anything — all in one place.</p>
     ${button(acceptUrl, "Set up my tracker")}
     <p style="color:#64748b;font-size:12px;margin:20px 0 0">This link expires in 14 days. If you weren't expecting this, you can ignore it.</p>`
  );
  const text = `${agentName} invited you to track your home purchase for ${propertyLabel} on ${APP_NAME}.\n\nSet up your tracker: ${acceptUrl}\n\nThis link expires in 14 days.`;
  return { subject, html, text };
}

export function milestoneCompleteEmail(params: {
  milestoneName: string;
  propertyLabel: string;
  nextMilestoneName: string | null;
  trackUrl: string;
}): { subject: string; html: string; text: string } {
  const { milestoneName, propertyLabel, nextMilestoneName, trackUrl } = params;
  const subject = `✓ ${milestoneName} — your home purchase moved forward`;
  const nextLine = nextMilestoneName
    ? `<p style="color:#334155;line-height:1.5;margin:0 0 20px">Next up: <strong>${nextMilestoneName}</strong>.</p>`
    : `<p style="color:#334155;line-height:1.5;margin:0 0 20px">You're at the finish line — congratulations!</p>`;
  const html = shell(
    `<h1 style="font-size:20px;margin:0 0 8px">${milestoneName} is done</h1>
     <p style="color:#334155;line-height:1.5;margin:0 0 8px">Good news about <strong>${propertyLabel}</strong>.</p>
     ${nextLine}
     ${button(trackUrl, "View my progress")}`
  );
  const nextText = nextMilestoneName
    ? `Next up: ${nextMilestoneName}.`
    : `You're at the finish line — congratulations!`;
  const text = `${milestoneName} is complete for ${propertyLabel}. ${nextText}\n\nView your progress: ${trackUrl}`;
  return { subject, html, text };
}
