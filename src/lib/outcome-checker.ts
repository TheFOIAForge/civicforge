import type { ContactLogEntry, ContactOutcome, Legislation } from "@/data/types";

export async function checkOutcomes(contacts: ContactLogEntry[]): Promise<ContactLogEntry[]> {
  const now = new Date();
  const updated = [...contacts];

  for (let i = 0; i < updated.length; i++) {
    const contact = updated[i];

    // Skip if no bill number
    if (!contact.billNumber) continue;

    // Skip if already has outcome
    if (contact.outcome) continue;

    // Skip if checked within the last 24 hours
    if (contact.outcomeChecked) {
      const lastCheck = new Date(contact.outcomeChecked);
      const hoursSince = (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) continue;
    }

    try {
      const res = await fetch(`/api/bills?query=${encodeURIComponent(contact.billNumber)}`);
      if (!res.ok) {
        updated[i] = { ...contact, outcomeChecked: now.toISOString() };
        continue;
      }

      const bills: Legislation[] = await res.json();
      if (!Array.isArray(bills) || bills.length === 0) {
        updated[i] = { ...contact, outcomeChecked: now.toISOString() };
        continue;
      }

      // Find the matching bill
      const normalizedQuery = contact.billNumber.replace(/[.\s]/g, "").toLowerCase();
      const matchedBill = bills.find(
        (b) => b.billNumber.replace(/[.\s]/g, "").toLowerCase() === normalizedQuery
      ) || bills[0];

      let outcome: ContactOutcome | undefined;

      if (matchedBill.status === "passed") {
        outcome = {
          type: "vote",
          description: `${matchedBill.billNumber} has passed.`,
          date: matchedBill.date,
        };
      }

      // Check if the summary mentions signing into law
      const summaryLower = (matchedBill.summary || "").toLowerCase();
      if (summaryLower.includes("signed into law") || summaryLower.includes("became public law")) {
        outcome = {
          type: "signed",
          description: `${matchedBill.billNumber} was signed into law.`,
          date: matchedBill.date,
        };
      }

      if (matchedBill.status === "failed") {
        outcome = {
          type: "vote",
          description: `${matchedBill.billNumber} failed.`,
          date: matchedBill.date,
        };
      }

      if (matchedBill.status === "in_committee") {
        outcome = {
          type: "committee_action",
          description: `${matchedBill.billNumber} is in committee.`,
          date: matchedBill.date,
        };
      }

      updated[i] = {
        ...contact,
        outcomeChecked: now.toISOString(),
        ...(outcome ? { outcome } : {}),
      };
    } catch {
      // Skip this contact on error, just update the check time
      updated[i] = { ...contact, outcomeChecked: now.toISOString() };
    }
  }

  return updated;
}
