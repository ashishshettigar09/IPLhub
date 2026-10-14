// ==========================================================
// IPL 2027 MEGA AUCTION - 12 TEAMS & RETENTION ENGINE
// Adhering strictly to "THE VERDICT" Retention & RTM Rules
// Starting Purse: ₹125 Crore per team
// User Team: Chennai Super Kings (CSK)
// 2 Expansion Franchises: Kochi Tuskers Kerala & Pune Warriors India
// ==========================================================

const IPL_2027_RULES = {
  startingPurseDefault: 125.00,
  maxRetentions: 5,
  maxRTMTotalCombined: 5,
  slots: [
    { slotNumber: 1, label: "1st Retention", cappedPrice: 18.00, uncappedPrice: 18.00, canBeUncapped: false },
    { slotNumber: 2, label: "2nd Retention", cappedPrice: 14.00, uncappedPrice: 14.00, canBeUncapped: false },
    { slotNumber: 3, label: "3rd Retention", cappedPrice: 11.00, uncappedPrice: 11.00, canBeUncapped: false },
    { slotNumber: 4, label: "4th Retention", cappedPrice: 18.00, uncappedPrice: 8.00, canBeUncapped: true },
    { slotNumber: 5, label: "5th Retention", cappedPrice: 14.00, uncappedPrice: 4.00, canBeUncapped: true }
  ],
  standardCombinations: [
    { retentions: 0, capped: 0, uncapped: 0, cost: 0.00, rtms: 5, remaining: 125.00, desc: "0 Retentions" },
    { retentions: 1, capped: 1, uncapped: 0, cost: 18.00, rtms: 4, remaining: 107.00, desc: "1 Capped" },
    { retentions: 2, capped: 2, uncapped: 0, cost: 32.00, rtms: 3, remaining: 93.00, desc: "2 Capped (18+14)" },
    { retentions: 3, capped: 3, uncapped: 0, cost: 43.00, rtms: 2, remaining: 82.00, desc: "3 Capped (18+14+11)" },
    { retentions: 4, capped: 3, uncapped: 1, cost: 51.00, rtms: 1, remaining: 74.00, desc: "4 (3 Capped + 1 Uncapped)" },
    { retentions: 4, capped: 4, uncapped: 0, cost: 61.00, rtms: 1, remaining: 64.00, desc: "4 (4 Capped)" },
    { retentions: 5, capped: 3, uncapped: 2, cost: 55.00, rtms: 0, remaining: 70.00, desc: "5 (3 Capped + 2 Uncapped)" },
    { retentions: 5, capped: 4, uncapped: 1, cost: 69.00, rtms: 0, remaining: 56.00, desc: "5 (4 Capped + 1 Uncapped)" },
    { retentions: 5, capped: 5, uncapped: 0, cost: 75.00, rtms: 0, remaining: 50.00, desc: "5 (5 Capped)" }
  ]
};

// Calculate standard retention price for a given slot index (1 to 5) and capped status
function calculateStandardRetentionPrice(slotNumber, isUncapped, currentRetentions = []) {
  if (slotNumber === 1) return 18.00;
  if (slotNumber === 2) return 14.00;
  if (slotNumber === 3) return 11.00;
  if (slotNumber === 4) return isUncapped ? 8.00 : 18.00;
  if (slotNumber === 5) return isUncapped ? 4.00 : 14.00;
  return isUncapped ? 4.00 : 12.00;
}

// 12 Official Franchises in the IPL 2027 Auction
// User's Team: Chennai Super Kings (CSK)
// Including Kochi Tuskers Kerala & Pune Warriors India
const DEFAULT_12_TEAMS = [
  {
    id: "csk",
    name: "Chennai Super Kings",
    shortName: "CSK",
    color: "#D97706",
    bgTint: "#FFFBEB",
    borderTint: "#FDE68A",
    badgeColor: "#B45309",
    logoEmoji: "🦁",
    isUserTeam: true, // <--- OUR TEAM
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "mi",
    name: "Mumbai Indians",
    shortName: "MI",
    color: "#0284C7",
    bgTint: "#F0F9FF",
    borderTint: "#7DD3FC",
    badgeColor: "#0369A1",
    logoEmoji: "🌪️",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "rcb",
    name: "Royal Challengers Bengaluru",
    shortName: "RCB",
    color: "#DC2626",
    bgTint: "#FEF2F2",
    borderTint: "#FCA5A5",
    badgeColor: "#B91C1C",
    logoEmoji: "🦅",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "kkr",
    name: "Kolkata Knight Riders",
    shortName: "KKR",
    color: "#7E22CE",
    bgTint: "#FAF5FF",
    borderTint: "#D8B4FE",
    badgeColor: "#6B21A8",
    logoEmoji: "⚔️",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "srh",
    name: "Sunrisers Hyderabad",
    shortName: "SRH",
    color: "#EA580C",
    bgTint: "#FFF7ED",
    borderTint: "#FDBA74",
    badgeColor: "#C2410C",
    logoEmoji: "🦅",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "rr",
    name: "Rajasthan Royals",
    shortName: "RR",
    color: "#DB2777",
    bgTint: "#FDF2F8",
    borderTint: "#F9A8D4",
    badgeColor: "#BE185D",
    logoEmoji: "👑",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "gt",
    name: "Gujarat Titans",
    shortName: "GT",
    color: "#0F766E",
    bgTint: "#F0FDFA",
    borderTint: "#5EEAD4",
    badgeColor: "#115E59",
    logoEmoji: "⚡",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "lsg",
    name: "Lucknow Super Giants",
    shortName: "LSG",
    color: "#0891B2",
    bgTint: "#ECFEFF",
    borderTint: "#67E8F9",
    badgeColor: "#0E7490",
    logoEmoji: "🕊️",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "dc",
    name: "Delhi Capitals",
    shortName: "DC",
    color: "#1D4ED8",
    bgTint: "#EFF6FF",
    borderTint: "#93C5FD",
    badgeColor: "#1E40AF",
    logoEmoji: "🐯",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "pbks",
    name: "Punjab Kings",
    shortName: "PBKS",
    color: "#E11D48",
    bgTint: "#FFF1F2",
    borderTint: "#FDA4AF",
    badgeColor: "#BE123C",
    logoEmoji: "🦁",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "ktk",
    name: "Kochi Tuskers Kerala",
    shortName: "KTK",
    color: "#9333EA",
    bgTint: "#FAF5FF",
    borderTint: "#E9D5FF",
    badgeColor: "#7E22CE",
    logoEmoji: "🐘",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  },
  {
    id: "pwi",
    name: "Pune Warriors India",
    shortName: "PWI",
    color: "#0284C7",
    bgTint: "#F0F9FF",
    borderTint: "#BAE6FD",
    badgeColor: "#0369A1",
    logoEmoji: "⚔️",
    isUserTeam: false,
    startingPurse: 125.00,
    retentions: [],
    auctionBuys: [],
    rtmCardsUsed: 0
  }
];

// Helper: Calculate full metrics for a single team
function computeTeamMetrics(team) {
  const startingPurse = parseFloat(team.startingPurse) || 125.00;
  
  let retentionSpent = 0;
  let cappedCount = 0;
  let uncappedCount = 0;
  let overseasCount = 0;

  (team.retentions || []).forEach(r => {
    retentionSpent += (parseFloat(r.price) || 0);
    if (r.isUncapped) uncappedCount++;
    else cappedCount++;
    if (r.player && r.player.country !== "India") overseasCount++;
  });

  let auctionSpent = 0;
  (team.auctionBuys || []).forEach(b => {
    auctionSpent += (parseFloat(b.price) || 0);
    if (b.player && b.player.country !== "India") overseasCount++;
  });

  retentionSpent = Math.round(retentionSpent * 100) / 100;
  auctionSpent = Math.round(auctionSpent * 100) / 100;
  const totalSpent = Math.round((retentionSpent + auctionSpent) * 100) / 100;
  const remainingPurse = Math.round((startingPurse - totalSpent) * 100) / 100;

  const retentionsCount = (team.retentions || []).length;
  // According to rule: Default RTMs earned = 5 - (Players Retained)
  const defaultRtmEarned = Math.max(0, 5 - retentionsCount);

  let totalRtmBase;
  let rtmsAvailable;
  if (typeof team.manualRtmCount === "number") {
    totalRtmBase = Math.max(0, Math.min(5, team.manualRtmCount));
    rtmsAvailable = totalRtmBase;
  } else {
    totalRtmBase = defaultRtmEarned;
    rtmsAvailable = Math.max(0, defaultRtmEarned - (team.rtmCardsUsed || 0));
  }

  const totalPlayersCount = retentionsCount + (team.auctionBuys || []).length;

  return {
    startingPurse,
    retentionSpent,
    auctionSpent,
    totalSpent,
    remainingPurse,
    retentionsCount,
    cappedCount,
    uncappedCount,
    totalRtmEarned: totalRtmBase,
    rtmsAvailable,
    rtmCardsUsed: team.rtmCardsUsed || 0,
    totalPlayersCount,
    overseasCount
  };
}
