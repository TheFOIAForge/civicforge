import type { Representative, BillRecord, Legislation } from "@/data/types";

// Congress.gov member detail response
interface CongressMemberDetail {
  member: {
    bioguideId: string;
    directOrderName: string;
    firstName: string;
    lastName: string;
    state: string;
    district?: number;
    partyName: string;
    depiction?: {
      imageUrl: string;
      attribution: string;
    };
    officialWebsiteUrl?: string;
    addressInformation?: {
      officeAddress: string;
      city: string;
      district: string;
      zipCode: string;
      phoneNumber: string;
    };
    currentMember: boolean;
    terms: Array<{
      chamber: string;
      startYear: number;
      endYear?: number;
    }>;
    sponsoredLegislation?: {
      count: number;
    };
    cosponsoredLegislation?: {
      count: number;
    };
  };
}

// Congress.gov sponsored legislation response
interface CongressBillItem {
  congress: number;
  number: string;
  type: string;
  title: string;
  latestAction?: {
    actionDate: string;
    text: string;
  };
  introducedDate: string;
  policyArea?: {
    name: string;
  };
}

export function transformMemberDetail(
  data: CongressMemberDetail
): Partial<Representative> {
  const m = data.member;
  return {
    bio: `${m.directOrderName} is a ${m.partyName} member of Congress representing ${m.state}.`,
    billsIntroduced: m.sponsoredLegislation?.count || 0,
  };
}

export function transformBillsToLegislation(
  bills: CongressBillItem[]
): BillRecord[] {
  return bills.slice(0, 10).map((bill) => {
    const actionText = bill.latestAction?.text?.toLowerCase() || "";
    let role: "Sponsor" | "Co-Sponsor" | "Architect" = "Sponsor";

    return {
      title: bill.title.slice(0, 150),
      billNumber: `${bill.type.toUpperCase()} ${bill.number}`,
      year: new Date(bill.introducedDate).getFullYear(),
      role,
      description: bill.latestAction?.text || "",
    };
  });
}

function billStatusFromAction(actionText: string): Legislation["status"] {
  const lower = actionText.toLowerCase();
  if (lower.includes("became public law") || lower.includes("signed by president"))
    return "passed";
  if (lower.includes("failed") || lower.includes("vetoed")) return "failed";
  if (lower.includes("committee")) return "in_committee";
  return "introduced";
}

export function transformBillsToIssueLegislation(
  bills: CongressBillItem[]
): Legislation[] {
  return bills.slice(0, 10).map((bill) => ({
    id: `${bill.type}-${bill.number}-${bill.congress}`,
    billNumber: `${bill.type.toUpperCase()} ${bill.number}`,
    title: bill.title.slice(0, 150),
    sponsor: "",
    date: bill.introducedDate,
    status: billStatusFromAction(bill.latestAction?.text || ""),
    summary: bill.latestAction?.text || "",
  }));
}
