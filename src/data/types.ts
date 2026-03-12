export interface OfficeAddress {
  label: string; // "Washington, DC" or "Springfield, MA"
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface SocialMedia {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

export interface StaffMember {
  name: string;
  title: string;
}

export interface Donor {
  name: string;
  amount: string;
}

export interface OutsideSpender {
  name: string;
  amount: string;
  support: boolean; // true = supporting, false = opposing
}

export interface CycleFinance {
  cycle: number | "all";
  totalFundraising: string;
  smallDollarPct: number;
  outsideSpending: OutsideSpender[];
}

export interface BillRecord {
  title: string;
  billNumber: string;
  year: number;
  role: "Sponsor" | "Co-Sponsor" | "Architect";
  description: string;
  url?: string;
}

export interface VotingCategory {
  category: string;
  yea: number;
  nay: number;
}

export interface KeyVote {
  bill: string;
  title: string;
  date: string;
  vote: "YEA" | "NAY" | "ABSTAIN";
  brokeWithParty: boolean;
}

export interface Controversy {
  title: string;
  year: number;
  description: string;
}

// ── Lobbying (Senate LDA) ──
export interface LobbyingFiling {
  filingId: string;
  registrant: string;       // lobbying firm
  client: string;            // who's paying
  amount: number;
  filingYear: number;
  issueCodes: string[];
  specificIssues: string[];
  lobbyists: string[];
  matchesDonor: boolean;     // client fuzzy-matches a top donor
}

// ── Dark Money (ProPublica 990s) ──
export interface NonprofitInfo {
  ein: string;
  name: string;
  city: string;
  state: string;
  totalRevenue: number;
  totalExpenses: number;
  totalAssets: number;
  taxPeriod: string;
}

export interface DarkMoneyConnection {
  spenderName: string;
  spenderAmount: string;
  support: boolean;
  connectedNonprofits: NonprofitInfo[];
}

// ── Federal Register ──
export interface FederalRegisterDocument {
  documentNumber: string;
  type: "RULE" | "PRORULE" | "NOTICE";
  title: string;
  abstract: string;
  agencies: string[];
  commentEndDate: string | null;
  publicationDate: string;
  htmlUrl: string;
  pdfUrl: string;
}

// ── GAO Reports ──
export interface GAOReport {
  packageId: string;
  title: string;
  dateIssued: string;
  summary: string;
  pdfUrl: string;
  govInfoUrl: string;
}

// ── Committee Hearings ──
export interface CommitteeHearing {
  title: string;
  date: string;
  chamber: "Senate" | "House" | "Joint";
  committee: string;
  url: string;
}

// ── USAspending ──
export interface DistrictSpending {
  recipientName: string;
  awardAmount: number;
  awardingAgency: string;
  description: string;
  awardType: string;
}

export interface DistrictSpendingSummary {
  totalObligated: number;
  contractCount: number;
  grantCount: number;
  topRecipients: Array<{ name: string; total: number }>;
  topAgencies: Array<{ name: string; total: number }>;
  awards: DistrictSpending[];
  donorContractorOverlaps: string[];
}

export interface Representative {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  title: "Senator" | "Representative";
  chamber: "Senate" | "House";
  party: "D" | "R" | "I";
  state: string;
  stateAbbr: string;
  district?: string;
  inOffice: boolean;

  // Leadership / roles
  leadershipRole?: string;
  committees: string[];

  // Contact
  offices: OfficeAddress[];
  email?: string;
  contactForm?: string;
  website: string;
  social: SocialMedia;
  staff: StaffMember[];

  // Stats
  partyLoyalty: number;
  votesCast: number;
  missedVotes: number;
  billsIntroduced: number;
  billsEnacted: number;

  // Dossier
  bio: string;
  notableLegislation: BillRecord[];
  topDonors: Donor[];
  topIndustries: Donor[];
  outsideSpending?: OutsideSpender[];
  financeCycles?: CycleFinance[];
  totalFundraising: string;
  smallDollarPct: number;
  opensecrets: string;
  controversies: Controversy[];
  votingRecord: VotingCategory[];
  keyVotes: KeyVote[];

  // Deep data
  lobbyingFilings?: LobbyingFiling[];
  darkMoneyConnections?: DarkMoneyConnection[];
  committeeHearings?: CommitteeHearing[];
  districtSpending?: DistrictSpendingSummary;

  // Photo
  photoUrl?: string;

  // External links
  bioguide: string;
  govtrack: string;
  votesmart: string;
  ballotpedia: string;
  congressGov: string;

  // Feature flags
  featured?: boolean;
  isLeadership?: boolean;
}

export interface Legislation {
  id: string;
  billNumber: string;
  title: string;
  sponsor: string;
  date: string;
  status: "passed" | "in_committee" | "failed" | "introduced";
  summary: string;
}

export interface Issue {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string;
  explainer: string;
  talkingPoints: string[];
  legislation: Legislation[];
}

export interface ContactLogEntry {
  id: string;
  repId: string;
  repName: string;
  method: "letter" | "call" | "social";
  issue: string;
  date: string;
  status: "sent" | "awaiting_response" | "response_received" | "follow_up_needed";
  notes: string;
  content?: string;
}

export interface Campaign {
  id: string;
  title: string;
  issue: string;
  letterTemplate: string;
  targetRepIds: string[];
  createdAt: string;
  joinCount: number;
}
