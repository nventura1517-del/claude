/**
 * The standard homebuying milestone template applied when a transaction is
 * created. Descriptions are deliberately plain-language and jargon-free — the
 * buyer reads these. `dayOffset` is a suggested number of days BEFORE the
 * estimated closing date, used only to pre-fill a due date the agent can edit.
 *
 * This is a code constant for the MVP (no template-editing UI). If it changes,
 * only future transactions are affected; existing milestones are untouched.
 */

export type ResponsibleParty =
  "agent" | "buyer" | "lender" | "escrow" | "inspector" | "seller";

export type MilestoneTemplate = {
  key: string;
  name: string;
  description: string;
  responsibleParty: ResponsibleParty;
  /** Days before the estimated closing date this is typically due. */
  dayOffset: number;
};

export const MILESTONE_TEMPLATE: readonly MilestoneTemplate[] = [
  {
    key: "offer_accepted",
    name: "Offer Accepted",
    description:
      "The seller agreed to your offer. This is the official start of your purchase.",
    responsibleParty: "agent",
    dayOffset: 40,
  },
  {
    key: "escrow_opened",
    name: "Escrow Opened",
    description:
      "A neutral third party now holds the money and paperwork safely until everything is done.",
    responsibleParty: "escrow",
    dayOffset: 38,
  },
  {
    key: "deposit_received",
    name: "Deposit Received",
    description:
      "Your good-faith deposit (earnest money) has been received and is being held securely.",
    responsibleParty: "buyer",
    dayOffset: 36,
  },
  {
    key: "home_inspection",
    name: "Home Inspection",
    description:
      "A professional checks the home's condition so there are no surprises.",
    responsibleParty: "inspector",
    dayOffset: 32,
  },
  {
    key: "inspection_contingency",
    name: "Inspection Review",
    description:
      "You review the inspection findings and decide whether to move forward, ask for repairs, or renegotiate.",
    responsibleParty: "buyer",
    dayOffset: 28,
  },
  {
    key: "appraisal",
    name: "Appraisal",
    description:
      "An independent expert confirms the home's value for your lender.",
    responsibleParty: "lender",
    dayOffset: 24,
  },
  {
    key: "loan_underwriting",
    name: "Loan Review",
    description:
      "Your lender reviews all the details to finalize your loan. They may ask for a few documents.",
    responsibleParty: "lender",
    dayOffset: 18,
  },
  {
    key: "loan_approved",
    name: "Loan Approved",
    description:
      "Your financing is officially approved. A big milestone — you're almost there.",
    responsibleParty: "lender",
    dayOffset: 10,
  },
  {
    key: "final_walkthrough",
    name: "Final Walkthrough",
    description:
      "One last visit to confirm the home is in the condition you expect before closing.",
    responsibleParty: "buyer",
    dayOffset: 3,
  },
  {
    key: "closing_documents",
    name: "Sign Closing Documents",
    description: "You sign the final paperwork for your loan and the purchase.",
    responsibleParty: "buyer",
    dayOffset: 2,
  },
  {
    key: "funds_received",
    name: "Funds Received",
    description: "All the money is in place and confirmed by escrow.",
    responsibleParty: "escrow",
    dayOffset: 1,
  },
  {
    key: "recorded",
    name: "Recorded",
    description:
      "The sale is officially recorded with the county. The home is legally yours.",
    responsibleParty: "escrow",
    dayOffset: 0,
  },
  {
    key: "keys_received",
    name: "Keys Received",
    description: "Congratulations — you get the keys to your new home!",
    responsibleParty: "agent",
    dayOffset: 0,
  },
];
