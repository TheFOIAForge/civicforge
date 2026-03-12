import { Issue } from "./types";

export const issues: Issue[] = [
  {
    id: "healthcare",
    slug: "healthcare",
    name: "Healthcare",
    icon: "\ud83e\ude7a",
    description: "Access to affordable healthcare, prescription drug pricing, Medicare and Medicaid, mental health services, and public health infrastructure.",
    explainer: "Healthcare policy in the U.S. operates across federal and state levels. The federal government runs Medicare (65+ and disabled), Medicaid (jointly with states, for low-income individuals), and the ACA marketplace. Congress controls drug pricing rules, hospital regulations, and public health funding. Your representatives vote on bills that directly affect your insurance premiums, drug costs, and what services are covered.",
    talkingPoints: [
      "The U.S. spends more per capita on healthcare than any other developed nation but ranks poorly on outcomes like life expectancy and infant mortality.",
      "Prescription drug costs in the U.S. are 2-3x higher than in other comparable countries.",
      "The Inflation Reduction Act capped insulin costs at $35/month for Medicare patients, but the cap doesn't yet extend to all insured Americans.",
      "Rural hospital closures have accelerated, leaving millions without nearby emergency care.",
      "Mental health parity laws exist on paper but enforcement remains inconsistent — many plans still limit coverage.",
    ],
    legislation: [
      { id: "hr1", billNumber: "S.1129", title: "Medicare for All Act of 2023", sponsor: "Sen. Bernie Sanders (I-VT)", date: "2023-03-22", status: "in_committee", summary: "Establishes a national single-payer healthcare system providing comprehensive benefits to all U.S. residents." },
      { id: "hr2", billNumber: "H.R.4955", title: "Lowering Drug Costs for American Families Act", sponsor: "Rep. Frank Pallone (D-NJ)", date: "2023-08-15", status: "in_committee", summary: "Expands Medicare drug price negotiation authority to cover more medications sooner." },
      { id: "hr3", billNumber: "S.2840", title: "Rural Emergency Hospital Act", sponsor: "Sen. Amy Klobuchar (D-MN)", date: "2023-09-12", status: "introduced", summary: "Creates new designation and funding stream for rural emergency hospitals." },
    ],
  },
  {
    id: "environment",
    slug: "environment",
    name: "Environment & Climate",
    icon: "\ud83c\udf3f",
    description: "Climate change action, clean energy transition, environmental regulations, air and water quality, conservation, and environmental justice.",
    explainer: "Environmental policy involves regulating emissions, funding clean energy, setting pollution standards, and managing public lands. The EPA sets and enforces environmental regulations. Congress funds clean energy research, approves drilling permits on federal land, and sets emissions targets. The Inflation Reduction Act was the largest climate investment in U.S. history, but many provisions face implementation challenges and political opposition.",
    talkingPoints: [
      "The Inflation Reduction Act invested $369 billion in climate and clean energy — the largest such investment in U.S. history.",
      "The U.S. is the largest cumulative emitter of greenhouse gases in history and the second-largest current emitter after China.",
      "Clean energy jobs are growing faster than fossil fuel jobs in most states, including many red states.",
      "Environmental justice communities — predominantly low-income and communities of color — bear disproportionate pollution burdens.",
      "Extreme weather events cost the U.S. over $90 billion in damages in 2023 alone.",
    ],
    legislation: [
      { id: "env1", billNumber: "S.2302", title: "Clean Energy for America Act", sponsor: "Sen. Ron Wyden (D-OR)", date: "2023-07-18", status: "in_committee", summary: "Simplifies and extends clean energy tax credits for wind, solar, and energy storage." },
      { id: "env2", billNumber: "H.R.3875", title: "CLEAN Future Act", sponsor: "Rep. Frank Pallone (D-NJ)", date: "2023-06-05", status: "in_committee", summary: "Sets a federal clean electricity standard requiring 100% clean power by 2035." },
    ],
  },
  {
    id: "housing",
    slug: "housing",
    name: "Housing",
    icon: "\ud83c\udfe0",
    description: "Affordable housing, rent costs, homelessness, housing discrimination, mortgage access, and zoning reform.",
    explainer: "Housing policy is split between federal programs (HUD, Section 8 vouchers, FHA loans, LIHTC tax credits) and local zoning laws. Congress controls funding for public housing, homeless assistance, and first-time homebuyer programs. The federal government also regulates mortgage lending through agencies like the CFPB. Your local representatives control zoning, which is often the biggest barrier to building more affordable housing.",
    talkingPoints: [
      "The U.S. has a shortage of approximately 7 million affordable homes for extremely low-income renters.",
      "Average rent has increased over 30% nationally since 2019, outpacing wage growth.",
      "Only 1 in 4 eligible households actually receives federal rental assistance due to funding limitations.",
      "Homelessness reached a record high in 2023, with over 650,000 people experiencing homelessness on a single night.",
      "The Low-Income Housing Tax Credit (LIHTC) has funded the vast majority of affordable housing built since 1986.",
    ],
    legislation: [
      { id: "hou1", billNumber: "S.1688", title: "Housing Supply and Affordability Act", sponsor: "Sen. Tim Kaine (D-VA)", date: "2023-05-22", status: "in_committee", summary: "Incentivizes local zoning reform and increases LIHTC funding to build more affordable housing." },
    ],
  },
  {
    id: "immigration",
    slug: "immigration",
    name: "Immigration",
    icon: "\ud83c\uddfa\ud83c\uddf8",
    description: "Border security, immigration reform, DACA, asylum policy, visa systems, and refugee resettlement.",
    explainer: "Immigration policy is primarily a federal responsibility. Congress sets visa quotas, asylum rules, enforcement priorities, and pathways to citizenship. The President directs enforcement through executive orders and agency policy. The immigration court system has a massive backlog of over 3 million pending cases. Major reform efforts have stalled for decades due to disagreements over the balance between enforcement and legal pathways.",
    talkingPoints: [
      "The U.S. immigration court backlog exceeds 3 million cases, with average wait times of over 4 years.",
      "DACA protects approximately 580,000 people brought to the U.S. as children, but its legal status remains uncertain.",
      "The U.S. admits about 1 million legal permanent residents annually through family, employment, and diversity visas.",
      "Border encounters have fluctuated dramatically — reaching over 2 million in FY2023.",
      "The last major bipartisan immigration reform bill passed in 1986 under President Reagan.",
    ],
    legislation: [
      { id: "imm1", billNumber: "H.R.2", title: "Secure the Border Act of 2023", sponsor: "Rep. Mario Diaz-Balart (R-FL)", date: "2023-05-11", status: "passed", summary: "Restarts border wall construction, limits asylum eligibility, mandates E-Verify, and increases border patrol staffing." },
      { id: "imm2", billNumber: "S.2824", title: "Emergency National Security Supplemental", sponsor: "Sen. Chris Murphy (D-CT)", date: "2024-01-28", status: "failed", summary: "Bipartisan border security and immigration deal that included new asylum restrictions, border funding, and an emergency authority to close the border." },
    ],
  },
  {
    id: "education",
    slug: "education",
    name: "Education",
    icon: "\ud83c\udf93",
    description: "K-12 funding, student loan debt, higher education costs, school choice, curriculum standards, and teacher pay.",
    explainer: "Education in the U.S. is primarily controlled at the state and local level — school boards, not Congress, make most day-to-day decisions. However, the federal government plays a significant role through funding (Title I for low-income schools), student loan policy, civil rights enforcement, and research grants. Congress sets the rules for federal student loans, Pell Grants, and programs like Head Start.",
    talkingPoints: [
      "Total student loan debt in the U.S. exceeds $1.7 trillion, carried by over 43 million borrowers.",
      "The average cost of a four-year public university has more than tripled (inflation-adjusted) since 1980.",
      "Teacher pay has declined in real terms over the past decade — the average teacher earns 26% less than other college-educated workers.",
      "The U.S. spends more per pupil on K-12 education than most OECD countries, but outcomes vary dramatically by zip code.",
      "Pell Grants now cover only about 30% of the cost of attending a public four-year university, down from 80% in the 1970s.",
    ],
    legislation: [
      { id: "edu1", billNumber: "S.1288", title: "College for All Act", sponsor: "Sen. Bernie Sanders (I-VT)", date: "2023-04-28", status: "in_committee", summary: "Eliminates tuition and fees at public colleges and universities for families earning under $125,000." },
    ],
  },
  {
    id: "economy",
    slug: "economy",
    name: "Economy & Jobs",
    icon: "\ud83d\udcb0",
    description: "Wages, employment, inflation, taxes, trade, small business, and economic inequality.",
    explainer: "Economic policy involves taxes, spending, regulation, and trade. Congress sets tax rates and spending priorities through the annual budget process. The Federal Reserve (independent of Congress) sets interest rates and monetary policy. Key debates center on tax policy (who pays, how much), minimum wage, trade deals, antitrust enforcement, and the balance between growth and inequality.",
    talkingPoints: [
      "The federal minimum wage has been $7.25/hour since 2009 — the longest period without an increase in its history.",
      "CEO pay at S&P 500 companies averages 272x the median worker's pay, up from 20x in 1965.",
      "The top 1% of Americans hold more wealth than the entire bottom 50% combined.",
      "Small businesses employ nearly half of all private-sector workers but face disproportionate regulatory and tax burdens.",
      "The national debt exceeds $34 trillion, with annual interest payments now exceeding $1 trillion.",
    ],
    legislation: [
      { id: "eco1", billNumber: "H.R.1010", title: "Raise the Wage Act", sponsor: "Rep. Bobby Scott (D-VA)", date: "2023-02-15", status: "in_committee", summary: "Gradually raises the federal minimum wage to $17/hour by 2028." },
      { id: "eco2", billNumber: "S.510", title: "Ultra-Millionaire Tax Act", sponsor: "Sen. Elizabeth Warren (D-MA)", date: "2023-02-22", status: "in_committee", summary: "Imposes an annual 2% wealth tax on net worth above $50 million and 3% above $1 billion." },
    ],
  },
  {
    id: "civil-rights",
    slug: "civil-rights",
    name: "Civil Rights & Justice",
    icon: "\u2696\ufe0f",
    description: "Voting rights, police reform, criminal justice reform, LGBTQ+ rights, disability rights, and discrimination.",
    explainer: "Civil rights protections come from constitutional amendments, federal laws (Civil Rights Act, Voting Rights Act, ADA), and court decisions. Congress has the power to strengthen or weaken these protections through legislation. Current debates focus on voting access, police accountability, sentencing reform, LGBTQ+ anti-discrimination protections, and affirmative action after the Supreme Court's 2023 ruling.",
    talkingPoints: [
      "The U.S. incarcerates more people per capita than any other country — about 1.9 million people are currently behind bars.",
      "Black Americans are incarcerated at roughly 5x the rate of white Americans.",
      "Since the Shelby County v. Holder decision in 2013 gutted the Voting Rights Act, numerous states have passed restrictive voting laws.",
      "The First Step Act (2018) was a rare bipartisan criminal justice reform, but advocates say much more is needed.",
      "28 states still lack comprehensive anti-discrimination protections for LGBTQ+ individuals in housing and employment.",
    ],
    legislation: [
      { id: "cr1", billNumber: "H.R.14", title: "John R. Lewis Voting Rights Advancement Act", sponsor: "Rep. Terri Sewell (D-AL)", date: "2023-01-09", status: "in_committee", summary: "Restores the preclearance provisions of the Voting Rights Act gutted by the Supreme Court in 2013." },
      { id: "cr2", billNumber: "H.R.1280", title: "George Floyd Justice in Policing Act", sponsor: "Rep. Sheila Jackson Lee (D-TX)", date: "2023-01-09", status: "in_committee", summary: "Bans chokeholds, limits qualified immunity, creates a national police misconduct registry, and mandates body cameras." },
    ],
  },
  {
    id: "defense",
    slug: "defense",
    name: "Defense & Foreign Policy",
    icon: "\ud83d\udee1\ufe0f",
    description: "Military spending, veterans affairs, foreign aid, NATO, trade agreements, and diplomatic relations.",
    explainer: "The U.S. has the world's largest military budget. Congress authorizes military operations, approves arms sales, ratifies treaties, and controls the defense budget through the annual National Defense Authorization Act (NDAA). The President is commander-in-chief but needs congressional authorization for sustained military action. Foreign aid is a tiny fraction of the federal budget (less than 1%) but is politically contentious.",
    talkingPoints: [
      "The U.S. defense budget for FY2024 is approximately $886 billion — more than the next 10 countries combined.",
      "Foreign aid represents less than 1% of the federal budget, though polls show Americans believe it's 25%+.",
      "Over 3.4 million veterans have service-connected disabilities, and VA healthcare serves about 9 million veterans annually.",
      "The PACT Act (2022) was the largest expansion of VA healthcare in decades, covering toxic exposure from burn pits.",
      "NATO's collective defense has been a cornerstone of U.S. security strategy since 1949.",
    ],
    legislation: [
      { id: "def1", billNumber: "H.R.2670", title: "National Defense Authorization Act for FY2024", sponsor: "Rep. Mike Rogers (R-AL)", date: "2023-12-14", status: "passed", summary: "Authorizes $886 billion in defense spending including a 5.2% military pay raise." },
    ],
  },
];

export function getIssueBySlug(slug: string): Issue | undefined {
  return issues.find((i) => i.slug === slug);
}
