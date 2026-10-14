// ==========================================================
// AUCTIONIX - IPL 2027 MEGA AUCTION COMMAND DECK
// 12 Franchises, The Verdict 2027 Retentions & RTM Engine,
// and Draggable Playing 11 Tactical Squad Workspace
// ==========================================================

// Global Application State
// Global Application State
const appState = {
  teamName: "CHENNAI SUPER KINGS (CSK)",
  totalPurse: 125.00,
  teams: [],
  squadSlots: JSON.parse(JSON.stringify(DEFAULT_SQUAD_30_SLOTS)),
  soldToOthers: [],
  playerDirectory: [],
  activeStagePlayer: null,
  activeDirFilter: "all",
  activeSquadFilter: "all",
  activeTeamFilter: "all",
  activeSearchQuery: "",
  activeRivalTeamId: "mi",
  activeModalTeamId: "csk",
  draggedSlotNumber: null
};

// Helper: Get User's Team (Chennai Super Kings)
function getUserTeam() {
  return appState.teams.find(t => t.isUserTeam) || appState.teams.find(t => t.id === "csk") || appState.teams[0];
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  init12Teams();
  initPlayerDirectory();
  loadLocalState();
  initListeners();
  initDragAndDrop();
  renderAllViews();
});

// Initialize 12 Teams
function init12Teams() {
  appState.teams = JSON.parse(JSON.stringify(DEFAULT_12_TEAMS));
}

// Initialize & Deduplicate Player Directory
function initPlayerDirectory() {
  const map = new Map();
  IPL_PLAYERS_MASTER.forEach(p => {
    const key = p.name.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, { ...p });
    }
  });
  appState.playerDirectory = Array.from(map.values());
}

// Load state from Laptop's LocalStorage (v3 supporting 12 Teams with CSK, KTK, PWI)
function loadLocalState() {
  try {
    const raw = localStorage.getItem("ipl_auction_desk_local_v3");
    if (raw) {
      const data = JSON.parse(raw);
      if (data.teamName && !data.teamName.includes("OUR SQUAD")) {
        appState.teamName = data.teamName;
      }
      if (typeof data.totalPurse === "number" && data.totalPurse >= 0) {
        appState.totalPurse = roundToTwo(data.totalPurse);
      }
      if (Array.isArray(data.teams)) {
        // Overlay stored data onto DEFAULT_12_TEAMS so team definitions and expansion teams (ktk, pwi) are always accurate
        appState.teams = DEFAULT_12_TEAMS.map(defTeam => {
          const stored = data.teams.find(t => t.id === defTeam.id || (defTeam.id === "csk" && t.id === "our_team"));
          if (stored) {
            return {
              ...defTeam,
              retentions: stored.retentions || [],
              auctionBuys: stored.auctionBuys || [],
              rtmCardsUsed: stored.rtmCardsUsed || 0,
              manualRtmCount: typeof stored.manualRtmCount === "number" ? stored.manualRtmCount : undefined,
              startingPurse: typeof stored.startingPurse === "number" ? stored.startingPurse : defTeam.startingPurse
            };
          }
          return { ...defTeam };
        });
      }
      if (data.squadSlots && data.squadSlots.length === 30) {
        appState.squadSlots = data.squadSlots.map(s => ({
          ...s,
          actualPrice: roundToTwo(parseFloat(s.actualPrice) || 0)
        }));
      }
      if (Array.isArray(data.soldToOthers)) {
        appState.soldToOthers = data.soldToOthers;
      }
      // Re-merge custom players
      if (Array.isArray(data.customPlayers)) {
        const existingNames = new Set(appState.playerDirectory.map(p => p.name.toLowerCase().trim()));
        data.customPlayers.forEach(cp => {
          if (!existingNames.has(cp.name.toLowerCase().trim())) {
            appState.playerDirectory.unshift(cp);
            existingNames.add(cp.name.toLowerCase().trim());
          }
        });
      }
    } else {
      // Check if previous v2 state exists and migrate gracefully
      const legacyRaw = localStorage.getItem("ipl_auction_desk_local_v2");
      if (legacyRaw) {
        const legacyData = JSON.parse(legacyRaw);
        if (legacyData.squadSlots && legacyData.squadSlots.length === 30) {
          appState.squadSlots = legacyData.squadSlots;
        }
        if (Array.isArray(legacyData.soldToOthers)) {
          appState.soldToOthers = legacyData.soldToOthers;
        }
      }
    }

    // Ensure CSK (user team) is synced
    const ourTeam = getUserTeam();
    if (ourTeam) {
      ourTeam.name = appState.teamName;
      ourTeam.startingPurse = appState.totalPurse;
    }
  } catch (err) {
    console.warn("Could not load local state:", err);
  }
}

// Persist state to Laptop's LocalStorage
function persistState() {
  try {
    const ourTeam = getUserTeam();
    if (ourTeam) {
      ourTeam.name = appState.teamName;
      ourTeam.startingPurse = appState.totalPurse;
    }

    const customPlayers = appState.playerDirectory.filter(p => p.isCustom);
    const payload = {
      teamName: appState.teamName,
      totalPurse: appState.totalPurse,
      teams: appState.teams,
      squadSlots: appState.squadSlots,
      soldToOthers: appState.soldToOthers,
      customPlayers: customPlayers
    };
    localStorage.setItem("ipl_auction_desk_local_v3", JSON.stringify(payload));
  } catch (err) {
    console.warn("Could not save local state:", err);
  }
}

// Helper: Float Precision Rounding
function roundToTwo(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

// Format Crore value to Indian Lakhs string
function formatLakhs(croreVal) {
  const lakhs = Math.round((croreVal * 100) + Number.EPSILON);
  return lakhs.toLocaleString('en-IN');
}

// Escape HTML for security
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================================
// EVENT LISTENERS INITIALIZATION
// ==========================================================
function initListeners() {
  // Safety window scroll lock: guarantees window.scrollY stays 0 so topbar is never pushed off-screen
  window.addEventListener("scroll", () => {
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
  });

  // Team Rename
  document.getElementById("editTeamNameBtn").addEventListener("click", () => {
    const entered = prompt("Enter Your Squad Name:", appState.teamName);
    if (entered && entered.trim()) {
      appState.teamName = entered.trim();
      document.getElementById("myTeamTitle").textContent = appState.teamName;
      const ourTeam = appState.teams.find(t => t.id === "our_team");
      if (ourTeam) ourTeam.name = appState.teamName;
      persistState();
      render12TeamsGrid();
      showToast(`Squad renamed to "${appState.teamName}"`, "success");
    }
  });

  // Total Purse Input for Our Team
  const purseInput = document.getElementById("totalPurseInput");
  purseInput.value = appState.totalPurse.toFixed(2);
  purseInput.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      appState.totalPurse = roundToTwo(val);
      const ourTeam = appState.teams.find(t => t.id === "our_team");
      if (ourTeam) ourTeam.startingPurse = appState.totalPurse;
      recalculatePurseAndMetrics();
      render12TeamsGrid();
      persistState();
    }
  });

  // Stage Action Buttons
  document.getElementById("btnBoughtByUs").addEventListener("click", handleBoughtByUs);
  document.getElementById("btnSoldToRivalConfirm").addEventListener("click", handleSoldToSelectedRival);
  document.getElementById("btnMarkUnsold").addEventListener("click", handleMarkUnsold);
  document.getElementById("btnClearStage").addEventListener("click", clearStage);

  // Live Bid Stepper Buttons on Auction Stage
  document.getElementById("subBidStep").addEventListener("click", () => adjustStageBid(-0.25));
  document.getElementById("addBidStep025").addEventListener("click", () => adjustStageBid(0.25));
  document.getElementById("addBidStep050").addEventListener("click", () => adjustStageBid(0.50));
  document.getElementById("addBidStep100").addEventListener("click", () => adjustStageBid(1.00));
  document.getElementById("addBidStep200").addEventListener("click", () => adjustStageBid(2.00));

  const liveBidInput = document.getElementById("liveBidPriceInput");
  liveBidInput.addEventListener("input", () => {
    const val = roundToTwo(parseFloat(liveBidInput.value) || 0);
    updateStageLakhsText(val);
  });

  // Rival Team Selection in Stage Action Pad
  const rivalSelect = document.getElementById("rivalTeamSelect");
  rivalSelect.addEventListener("change", (e) => {
    appState.activeRivalTeamId = e.target.value;
    updateRivalSaleUI();
  });

  // Directory Search & Role Filters
  const searchInput = document.getElementById("directorySearchInput");
  const clearSearchBtn = document.getElementById("clearDirectorySearchBtn");

  searchInput.addEventListener("input", (e) => {
    appState.activeSearchQuery = e.target.value.toLowerCase().trim();
    clearSearchBtn.style.display = appState.activeSearchQuery ? "block" : "none";
    renderPlayerDirectory();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    appState.activeSearchQuery = "";
    clearSearchBtn.style.display = "none";
    renderPlayerDirectory();
  });

  document.querySelectorAll(".dir-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".dir-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      appState.activeDirFilter = pill.dataset.dirFilter;
      renderPlayerDirectory();
    });
  });

  // Top Workspace Tabs (Our Squad, 12 Franchises, Sold Log)
  document.getElementById("tabMySquadBtn").addEventListener("click", () => switchWorkspaceTab("mySquadView"));
  document.getElementById("tabAllTeamsBtn").addEventListener("click", () => switchWorkspaceTab("teamsWorkspaceView"));
  document.getElementById("tabSoldOtherBtn").addEventListener("click", () => switchWorkspaceTab("soldOtherView"));

  // Squad Filter Pills
  document.querySelectorAll(".squad-view-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".squad-view-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      appState.activeSquadFilter = pill.dataset.squadFilter;
      renderSquadSlots();
    });
  });

  // 12 Teams View Filters
  document.querySelectorAll(".team-view-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".team-view-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      appState.activeTeamFilter = pill.dataset.teamFilter;
      render12TeamsGrid();
    });
  });

  const teamSearchInput = document.getElementById("teamSearchInput");
  if (teamSearchInput) {
    teamSearchInput.addEventListener("input", () => {
      render12TeamsGrid();
    });
  }

  // Manage Our Retentions button in squad header
  document.getElementById("manageOurRetentionsBtn").addEventListener("click", () => {
    openRetentionModalForTeam(getUserTeam().id);
  });

  // Topbar RTM Pill click -> Switch to 12 teams view and highlight CSK
  const ourRtmPill = document.getElementById("ourTeamRtmPill");
  if (ourRtmPill) {
    ourRtmPill.style.cursor = "pointer";
    ourRtmPill.title = "Click to view and manage CSK RTM Cards";
    ourRtmPill.addEventListener("click", () => {
      switchWorkspaceTab("teamsWorkspaceView");
      const cskCard = document.querySelector(".team-card.user-team");
      const rightCol = document.getElementById("workspaceScrollArea") || document.querySelector(".squad-workspace-block");
      if (cskCard && rightCol) {
        rightCol.scrollTo({ top: cskCard.offsetTop - 10, behavior: 'smooth' });
      }
    });
  }

  // Quick return to hammer stage button in directory header
  const returnBtn = document.getElementById("returnToStageBtn");
  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      const leftCol = document.querySelector(".auction-live-block");
      if (leftCol) {
        leftCol.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Auto Balance Slots
  document.getElementById("autoBalanceSlotsBtn").addEventListener("click", autoBalanceRemainingBudget);

  // Top Action Buttons
  document.getElementById("viewRulesBtn").addEventListener("click", () => openModal("retentionRulesModal"));
  document.getElementById("openFullRulesBtn").addEventListener("click", () => openModal("retentionRulesModal"));
  document.getElementById("quickFillDemoBtn").addEventListener("click", loadFullDemoSquad);
  document.getElementById("exportSquadSheetBtn").addEventListener("click", openExportSheet);
  document.getElementById("resetAllDataBtn").addEventListener("click", confirmResetAllData);
  document.getElementById("openAddCustomModalBtn").addEventListener("click", () => openModal("addCustomModal"));
  document.getElementById("saveCustomPlayerBtn").addEventListener("click", handleSaveCustomPlayer);

  // Retention Modal Controls
  document.getElementById("retentionSlotSelect").addEventListener("change", handleRetentionSlotChange);
  document.getElementById("typeCappedRadio").addEventListener("change", handleRetentionSlotChange);
  document.getElementById("typeUncappedRadio").addEventListener("change", handleRetentionSlotChange);
  document.getElementById("btnConfirmAddRetention").addEventListener("click", handleConfirmAddRetention);
  
  const retPlayerSearch = document.getElementById("retentionPlayerSearchInput");
  if (retPlayerSearch) {
    retPlayerSearch.addEventListener("input", (e) => {
      populateRetentionPlayerSelect(e.target.value.toLowerCase().trim());
    });
  }

  // Export Modal Triggers
  document.getElementById("copyWhatsAppSummaryBtn").addEventListener("click", copySummaryForWhatsApp);
  document.getElementById("printRosterBtn").addEventListener("click", () => window.print());

  // Modal Closers
  document.querySelectorAll("[data-close-modal]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
  });
}

// Per-tab scroll memory to completely isolate tab positions
if (!appState.tabScrollPositions) {
  appState.tabScrollPositions = { mySquadView: 0, teamsWorkspaceView: 0, soldOtherView: 0 };
}
appState.activeWorkspaceView = "mySquadView";

function switchWorkspaceTab(viewId) {
  const scrollContainer = document.getElementById("workspaceScrollArea") || document.querySelector(".squad-workspace-block");
  if (scrollContainer && appState.activeWorkspaceView) {
    appState.tabScrollPositions[appState.activeWorkspaceView] = scrollContainer.scrollTop;
  }

  document.querySelectorAll(".ws-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.target === viewId);
  });
  
  document.getElementById("mySquadView").style.display = viewId === "mySquadView" ? "block" : "none";
  document.getElementById("teamsWorkspaceView").style.display = viewId === "teamsWorkspaceView" ? "block" : "none";
  document.getElementById("soldOtherView").style.display = viewId === "soldOtherView" ? "block" : "none";

  // Hide or show squad filter pills bar
  document.getElementById("squadFilterBar").style.display = viewId === "mySquadView" ? "flex" : "none";

  appState.activeWorkspaceView = viewId;

  if (viewId === "teamsWorkspaceView") render12TeamsGrid();
  if (viewId === "soldOtherView") renderSoldOtherTable();

  if (scrollContainer) {
    const saved = appState.tabScrollPositions[viewId] || 0;
    scrollContainer.scrollTop = saved;
  }
}

function adjustStageBid(delta) {
  const input = document.getElementById("liveBidPriceInput");
  const current = parseFloat(input.value) || 0;
  const updated = Math.max(0.20, roundToTwo(current + delta));
  input.value = updated.toFixed(2);
  updateStageLakhsText(updated);
}

function updateStageLakhsText(cr) {
  document.getElementById("stageLakhsConversion").textContent = `₹ ${formatLakhs(cr)} Lakhs`;
}

// ==========================================================
// HIGH PRECISION PURSE & COMPOSITION RECALCULATION
// ==========================================================
function recalculatePurseAndMetrics() {
  let totalSpent = 0;
  let filledCount = 0;
  let xiFilledCount = 0;
  let batters = 0;
  let keepers = 0;
  let allRounders = 0;
  let bowlers = 0;
  let overseas = 0;

  let xiOverseas = 0;
  let xiKeepers = 0;
  let xiBowlers = 0;

  // Accurate sum across all 30 slots
  appState.squadSlots.forEach(slot => {
    const price = roundToTwo(parseFloat(slot.actualPrice) || 0);
    totalSpent += price;

    if (slot.player) {
      filledCount++;
      const p = slot.player;
      const isOs = p.country !== "India";
      if (isOs) overseas++;

      const r = (p.role || "").toLowerCase();
      if (r.includes("batter")) batters++;
      else if (r.includes("keeper") || r.includes("wk")) keepers++;
      else if (r.includes("all-rounder")) allRounders++;
      else if (r.includes("bowler")) bowlers++;

      if (slot.isXi) {
        xiFilledCount++;
        if (isOs) xiOverseas++;
        if (r.includes("keeper") || r.includes("wk")) xiKeepers++;
        if (r.includes("bowler") || r.includes("all-rounder")) xiBowlers++;
      }
    }
  });

  totalSpent = roundToTwo(totalSpent);
  const remainingPurse = roundToTwo(appState.totalPurse - totalSpent);
  const emptySlots = 30 - filledCount;

  // Safe Max Bid Calculation
  const minRequiredSquad = 18;
  const neededForMin = Math.max(0, minRequiredSquad - filledCount - 1);
  const minBasePrice = 0.20;
  const maxSafeBid = Math.max(0, roundToTwo(remainingPurse - (neededForMin * minBasePrice)));

  // Update DOM Metric Displays
  document.getElementById("myTeamTitle").textContent = appState.teamName;
  document.getElementById("totalSpentText").textContent = totalSpent.toFixed(2);
  document.getElementById("spentLakhsText").textContent = `₹ ${formatLakhs(totalSpent)} Lakhs`;

  // Highlight Remaining Purse
  const remainingDisplay = document.getElementById("remainingPurseText");
  const remainingBox = document.getElementById("remainingChipBox");
  const statusPill = document.getElementById("purseStatusPill");

  remainingDisplay.textContent = remainingPurse.toFixed(2);
  document.getElementById("remainingLakhsText").textContent = `₹ ${formatLakhs(remainingPurse)} Lakhs remaining`;

  remainingBox.classList.remove("tight", "deficit");
  statusPill.classList.remove("safe", "tight", "deficit");

  if (remainingPurse < 0) {
    remainingBox.classList.add("deficit");
    statusPill.classList.add("deficit");
    statusPill.textContent = "Deficit!";
  } else if (remainingPurse < (emptySlots * 0.5) && emptySlots > 0) {
    remainingBox.classList.add("tight");
    statusPill.classList.add("tight");
    statusPill.textContent = "Budget Tight";
  } else {
    statusPill.classList.add("safe");
    statusPill.textContent = "Safe";
  }

  // Our Team RTM Pills
  const ourTeam = getUserTeam();
  const ourMetrics = computeTeamMetrics(ourTeam);
  document.getElementById("ourTeamRtmPill").textContent = `${ourMetrics.rtmsAvailable} RTMs`;

  // Squad Capacity Counters
  document.getElementById("squadCountText").textContent = `${filledCount} / 30`;
  document.getElementById("squadSlotsLeftText").textContent = `${emptySlots} Slots Available`;
  document.getElementById("maxSafeBidText").textContent = maxSafeBid.toFixed(2);

  // Tab badges
  document.getElementById("squadTabBadge").textContent = filledCount;
  
  // Count total sold across all rival teams
  let totalSoldToRivals = 0;
  appState.teams.filter(t => !t.isUserTeam).forEach(t => {
    totalSoldToRivals += (t.auctionBuys || []).length;
  });
  document.getElementById("soldOtherTabBadge").textContent = totalSoldToRivals;

  // Composition Strip
  document.getElementById("countBatters").textContent = batters;
  document.getElementById("countKeepers").textContent = keepers;
  document.getElementById("countAllRounders").textContent = allRounders;
  document.getElementById("countBowlers").textContent = bowlers;
  document.getElementById("countOverseas").textContent = `${overseas} / 8`;
  document.getElementById("countXiSlots").textContent = `${xiFilledCount} / 11`;

  // Playing XI Overseas Rule Pill (Max 4 in Playing XI)
  const xiOsPill = document.getElementById("xiOverseasRulePill");
  xiOsPill.textContent = `XI OS: ${xiOverseas} / 4`;
  if (xiOverseas > 4) {
    xiOsPill.className = "comp-rule-pill warn";
  } else {
    xiOsPill.className = "comp-rule-pill valid";
  }

  // Playing XI Strip Stats
  const xiOsBadge = document.getElementById("xiOverseasCountBadge");
  xiOsBadge.textContent = `✈️ ${xiOverseas} / 4 Overseas`;
  xiOsBadge.className = xiOverseas > 4 ? "xi-stat-pill warn" : "xi-stat-pill valid";

  document.getElementById("xiKeepersCountBadge").textContent = `🧤 ${xiKeepers} Keepers`;
  document.getElementById("xiBowlersCountBadge").textContent = `🎯 ${xiBowlers} Bowling Options`;

  // Rule Compliance Pills
  const wkPill = document.getElementById("wkRulePill");
  if (keepers >= 1) {
    wkPill.className = "comp-rule-pill valid";
    wkPill.textContent = `${keepers} Ready ✓`;
  } else {
    wkPill.className = "comp-rule-pill warn";
    wkPill.textContent = "Min 1 Required";
  }

  const bowlPill = document.getElementById("bowlerRulePill");
  const totalBowlingOptions = bowlers + allRounders;
  if (totalBowlingOptions >= 5) {
    bowlPill.className = "comp-rule-pill valid";
    bowlPill.textContent = `${totalBowlingOptions} Options ✓`;
  } else {
    bowlPill.className = "comp-rule-pill warn";
    bowlPill.textContent = `${totalBowlingOptions} / 5 Needed`;
  }

  const osPill = document.getElementById("osRulePill");
  if (overseas > 8) {
    osPill.className = "comp-rule-pill warn";
    osPill.textContent = "Exceeded (Max 8)";
  } else {
    osPill.className = "comp-rule-pill valid";
    osPill.textContent = `${overseas} / 8 Allowed`;
  }

  persistState();
}

// ==========================================================
// AUCTION STAGE / HAMMER CONTROLS
// ==========================================================
function putPlayerOnStage(player) {
  appState.activeStagePlayer = player;

  const box = document.getElementById("stagePlayerBox");
  const pad = document.getElementById("stageActionPad");
  const note = document.getElementById("stageStatusNote");

  const isOs = player.country !== "India";
  const flag = isOs ? "✈️ Overseas" : "🇮🇳 Indian";

  box.innerHTML = `
    <div class="active-player-display">
      <div class="player-main-identity">
        <div>
          <h2 class="stage-player-name">${escapeHtml(player.name)}</h2>
          <span class="stage-country-pill ${isOs ? 'os' : ''}">${flag}</span>
        </div>
        <div class="stage-rating-row">
          <div>
            <div class="rating-title-label">PLAYER RATING</div>
            <div style="font-size:0.65rem; color:var(--ink-muted);">Current Form & Stats</div>
          </div>
          <div class="rating-score-badge">
            <span class="rating-star-icon">★</span>
            <span class="rating-number-huge">${player.rating}</span>
            <span class="rating-scale-sub">/ 100</span>
          </div>
        </div>
      </div>

      <div class="stage-player-details">
        <div class="detail-line">
          <span>Primary Role:</span>
          <strong>${player.role} (${player.detailedRole || player.role})</strong>
        </div>
        <div class="detail-line">
          <span>Playing Style:</span>
          <strong>${player.style || 'Specialist'}</strong>
        </div>
        <div class="detail-line">
          <span>Base Price:</span>
          <strong>₹ ${player.basePrice.toFixed(2)} Cr</strong>
        </div>
      </div>
    </div>
  `;

  // Set default bid price
  const bidInput = document.getElementById("liveBidPriceInput");
  bidInput.value = player.basePrice.toFixed(2);
  updateStageLakhsText(player.basePrice);

  populateTargetSlotDropdown(player);
  populateRivalTeamSelector();

  pad.style.display = "block";
  note.textContent = `Bidding Live for ${player.name}`;

  renderPlayerDirectory();
  const leftCol = document.querySelector(".auction-live-block");
  if (leftCol && leftCol.scrollTop > 350) {
    leftCol.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function populateTargetSlotDropdown(player) {
  const select = document.getElementById("assignSlotSelect");
  select.innerHTML = "";

  let bestSlotIndex = -1;
  const pRole = (player.role || "").toLowerCase();

  appState.squadSlots.forEach((slot, index) => {
    const isSlotEmpty = slot.player === null;
    const target = (slot.targetRole || "").toLowerCase();

    let match = false;
    if (pRole.includes("keeper") && target.includes("keeper")) match = true;
    else if (pRole.includes("all-rounder") && target.includes("all-rounder")) match = true;
    else if (pRole.includes("bowler") && (target.includes("pacer") || target.includes("seamer") || target.includes("spinner") || target.includes("bowler"))) match = true;
    else if (pRole.includes("batter") && (target.includes("opener") || target.includes("batter") || target.includes("top-order"))) match = true;

    if (bestSlotIndex === -1 && isSlotEmpty && match) {
      bestSlotIndex = index;
    }

    const opt = document.createElement("option");
    opt.value = slot.slotNumber;
    const prefix = slot.isXi ? `[XI #${slot.slotNumber}]` : `[Reserve #${slot.slotNumber}]`;
    const status = isSlotEmpty ? "— Empty Slot" : `(Filled: ${slot.player.name})`;
    opt.textContent = `${prefix} ${slot.targetRole} ${status}`;
    select.appendChild(opt);
  });

  if (bestSlotIndex === -1) {
    bestSlotIndex = appState.squadSlots.findIndex(s => s.player === null);
  }

  if (bestSlotIndex !== -1) {
    select.value = appState.squadSlots[bestSlotIndex].slotNumber;
  }
}

// Populate Rival Team Select Dropdown and Quick Pills
function populateRivalTeamSelector() {
  const select = document.getElementById("rivalTeamSelect");
  const pillsContainer = document.getElementById("rivalQuickPillsContainer");
  
  select.innerHTML = "";
  pillsContainer.innerHTML = "";

  const rivalTeams = appState.teams.filter(t => !t.isUserTeam);

  rivalTeams.forEach(team => {
    const metrics = computeTeamMetrics(team);

    // Option for dropdown
    const opt = document.createElement("option");
    opt.value = team.id;
    opt.textContent = `${team.logoEmoji} ${team.name} (Purse: ₹${metrics.remainingPurse.toFixed(2)} Cr | ${metrics.rtmsAvailable} RTMs)`;
    select.appendChild(opt);

    // Quick pill
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = `rival-quick-pill ${team.id === appState.activeRivalTeamId ? 'active' : ''}`;
    pill.textContent = `${team.logoEmoji} ${team.shortName}`;
    pill.title = `${team.name} (₹${metrics.remainingPurse.toFixed(2)} Cr left)`;
    pill.addEventListener("click", () => {
      appState.activeRivalTeamId = team.id;
      select.value = team.id;
      updateRivalSaleUI();
    });
    pillsContainer.appendChild(pill);
  });

  if (appState.activeRivalTeamId) {
    select.value = appState.activeRivalTeamId;
  } else if (rivalTeams.length > 0) {
    appState.activeRivalTeamId = rivalTeams[0].id;
    select.value = rivalTeams[0].id;
  }

  updateRivalSaleUI();
}

function updateRivalSaleUI() {
  const team = appState.teams.find(t => t.id === appState.activeRivalTeamId);
  if (!team) return;

  const metrics = computeTeamMetrics(team);
  
  // Highlight active pill
  document.querySelectorAll(".rival-quick-pill").forEach(p => {
    p.classList.toggle("active", p.textContent.includes(team.shortName));
  });

  // Update RTM mini badge
  const rtmBadge = document.getElementById("rivalRtmMiniBadge");
  rtmBadge.textContent = `${metrics.rtmsAvailable} left`;
  
  const rtmCheckbox = document.getElementById("rivalRtmCheckbox");
  if (metrics.rtmsAvailable === 0) {
    rtmCheckbox.checked = false;
    rtmCheckbox.disabled = true;
  } else {
    rtmCheckbox.disabled = false;
  }

  // Update Sold button label
  document.getElementById("btnSoldRivalLabel").textContent = `SELL TO ${team.shortName}`;
  document.getElementById("btnSoldRivalSub").textContent = `Deducts from ₹${metrics.remainingPurse.toFixed(2)} Cr purse`;
}

// BOUGHT BY OUR TEAM
function handleBoughtByUs() {
  if (!appState.activeStagePlayer) return;

  const player = appState.activeStagePlayer;
  const slotNum = parseInt(document.getElementById("assignSlotSelect").value);
  const winningPrice = roundToTwo(parseFloat(document.getElementById("liveBidPriceInput").value) || player.basePrice);

  const slot = appState.squadSlots.find(s => s.slotNumber === slotNum);
  if (!slot) return;

  // Remove player from any team if previously retained/bought
  removePlayerFromAllTeams(player.name);

  slot.player = player;
  slot.actualPrice = winningPrice;

  // Add to user team (CSK) auctionBuys
  const ourTeam = getUserTeam();
  if (ourTeam) {
    if (!Array.isArray(ourTeam.auctionBuys)) ourTeam.auctionBuys = [];
    ourTeam.auctionBuys.push({
      player: player,
      price: winningPrice,
      isRtm: false,
      boughtAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  clearStage();
  renderSquadSlots();
  renderPlayerDirectory();
  render12TeamsGrid();
  recalculatePurseAndMetrics();

  showToast(`✅ ${player.name} bought for ₹${winningPrice.toFixed(2)} Cr into Slot #${slotNum}!`, "success");
}

// SOLD TO SELECTED RIVAL TEAM
function handleSoldToSelectedRival() {
  if (!appState.activeStagePlayer) return;

  const player = appState.activeStagePlayer;
  const teamId = document.getElementById("rivalTeamSelect").value;
  const team = appState.teams.find(t => t.id === teamId);
  if (!team) return;

  const soldPrice = roundToTwo(parseFloat(document.getElementById("liveBidPriceInput").value) || player.basePrice);
  const isRtm = document.getElementById("rivalRtmCheckbox").checked;

  // Remove player from any team or slot first
  removePlayerFromAllTeams(player.name);

  // If RTM used, track and deduct it
  if (isRtm) {
    if (typeof team.manualRtmCount === "number") {
      team.manualRtmCount = Math.max(0, team.manualRtmCount - 1);
    }
    team.rtmCardsUsed = (team.rtmCardsUsed || 0) + 1;
  }

  // Add to team's auctionBuys
  if (!Array.isArray(team.auctionBuys)) team.auctionBuys = [];
  team.auctionBuys.push({
    player: player,
    price: soldPrice,
    isRtm: isRtm,
    boughtAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  // Also maintain in soldToOthers array for convenience
  appState.soldToOthers.push({
    player: player,
    teamId: team.id,
    teamName: team.name,
    teamEmoji: team.logoEmoji,
    soldPrice: soldPrice,
    isRtm: isRtm,
    soldAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  clearStage();
  renderPlayerDirectory();
  render12TeamsGrid();
  renderSoldOtherTable();
  recalculatePurseAndMetrics();

  showToast(`🔨 ${player.name} SOLD to ${team.name} for ₹${soldPrice.toFixed(2)} Cr ${isRtm ? '(via RTM) ' : ''}!`, "warn");
}

// Helper to remove a player by name from all teams and squad slots
function removePlayerFromAllTeams(playerName) {
  const target = playerName.toLowerCase().trim();

  // Clear from squad slots
  appState.squadSlots.forEach(s => {
    if (s.player && s.player.name.toLowerCase().trim() === target) {
      s.player = null;
      s.actualPrice = 0;
    }
  });

  // Clear from teams retentions & auctionBuys
  appState.teams.forEach(team => {
    if (Array.isArray(team.retentions)) {
      team.retentions = team.retentions.filter(r => (r.player?.name || "").toLowerCase().trim() !== target);
    }
    if (Array.isArray(team.auctionBuys)) {
      team.auctionBuys = team.auctionBuys.filter(b => (b.player?.name || "").toLowerCase().trim() !== target);
    }
  });

  // Clear from soldToOthers
  appState.soldToOthers = appState.soldToOthers.filter(s => (s.player?.name || "").toLowerCase().trim() !== target);
}

function handleMarkUnsold() {
  if (!appState.activeStagePlayer) return;
  const pName = appState.activeStagePlayer.name;
  clearStage();
  showToast(`${pName} marked Unsold (available for recall)`, "warn");
}

function clearStage() {
  appState.activeStagePlayer = null;
  document.getElementById("stageActionPad").style.display = "none";
  document.getElementById("stageStatusNote").textContent = "Select or search any player below to put on auction";
  document.getElementById("stagePlayerBox").innerHTML = `
    <div class="empty-stage-prompt">
      <span class="hammer-icon">🔨</span>
      <h3>No Player Currently On The Block</h3>
      <p>Click any player in the directory or search below. When on the hammer, you can sell them to <strong>Our Team</strong> or select any of the <strong>11 Rival Franchises</strong> with live purse deductions.</p>
    </div>
  `;
  renderPlayerDirectory();
}

// ==========================================================
// DRAG & DROP IMPLEMENTATION FOR PLAYING 11 & SQUAD REORDERING
// ==========================================================
function initDragAndDrop() {
  // Global dragover preventDefault for drop targets
  const container = document.getElementById("squadSlotsContainer");
  
  container.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
}

function setupSlotDragEvents(card, slotNumber) {
  card.setAttribute("draggable", "true");

  card.addEventListener("dragstart", (e) => {
    appState.draggedSlotNumber = slotNumber;
    card.classList.add("slot-dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", slotNumber.toString());
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("slot-dragging");
    document.querySelectorAll(".slot-item-card").forEach(c => c.classList.remove("slot-drag-over"));
    appState.draggedSlotNumber = null;
  });

  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (appState.draggedSlotNumber && appState.draggedSlotNumber !== slotNumber) {
      card.classList.add("slot-drag-over");
    }
  });

  card.addEventListener("dragleave", () => {
    card.classList.remove("slot-drag-over");
  });

  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("slot-drag-over");
    const sourceSlotNum = parseInt(e.dataTransfer.getData("text/plain") || appState.draggedSlotNumber);
    const targetSlotNum = slotNumber;

    if (sourceSlotNum && sourceSlotNum !== targetSlotNum) {
      swapSquadSlots(sourceSlotNum, targetSlotNum);
    }
  });
}

// Swap two squad slots
function swapSquadSlots(sourceNum, targetNum) {
  const slotA = appState.squadSlots.find(s => s.slotNumber === sourceNum);
  const slotB = appState.squadSlots.find(s => s.slotNumber === targetNum);

  if (!slotA || !slotB) return;

  // Swap player and price between slot A and slot B
  const tempPlayer = slotA.player;
  const tempPrice = slotA.actualPrice;

  slotA.player = slotB.player;
  slotA.actualPrice = slotB.actualPrice;

  slotB.player = tempPlayer;
  slotB.actualPrice = tempPrice;

  renderSquadSlots();
  recalculatePurseAndMetrics();
  persistState();

  const labelA = slotA.player ? slotA.player.name : `Empty`;
  const labelB = slotB.player ? slotB.player.name : `Empty`;
  showToast(`Swapped #${sourceNum} (${labelB}) ⇄ #${targetNum} (${labelA})`, "success");
}

// Quick Up / Down reorder stepper strictly for Playing XI (slots 1 to 11)
function shiftSlotOrder(slotNumber, direction) {
  const targetNum = slotNumber + direction;
  if (targetNum < 1 || targetNum > 11) return;
  swapSquadSlots(slotNumber, targetNum);
}

// ==========================================================
// RENDER SQUAD SLOTS (WITH DRAGGABLE PLAYING 11)
// ==========================================================
function renderSquadSlots() {
  const scrollContainer = document.getElementById("workspaceScrollArea") || document.querySelector(".squad-workspace-block");
  const prevScroll = scrollContainer ? scrollContainer.scrollTop : 0;

  const container = document.getElementById("squadSlotsContainer");
  if (!container) return;

  const currentH = container.offsetHeight;
  if (currentH > 0) container.style.minHeight = `${currentH}px`;
  container.innerHTML = "";

  const filter = appState.activeSquadFilter;

  // Render Category Header for Playing XI if all or xi selected
  if (filter === "all" || filter === "xi") {
    const xiHeader = document.createElement("div");
    xiHeader.className = "squad-section-divider";
    xiHeader.innerHTML = `
      <h4><span>🏏</span> Official Playing XI (Batting Order 1–11)</h4>
      <span class="squad-section-tag">Match Day Core • Drag cards or use ▲ / ▼ to reorder</span>
    `;
    container.appendChild(xiHeader);
  }

  appState.squadSlots.forEach((slot, index) => {
    // Check if we need Reserves section header
    if ((filter === "all" || filter === "reserves") && slot.slotNumber === 12) {
      const resHeader = document.createElement("div");
      resHeader.className = "squad-section-divider";
      resHeader.innerHTML = `
        <h4><span>💺</span> Squad Reserves & Bench (Slots 12–30)</h4>
        <span class="squad-section-tag">Deep Tactical Bench • Drag cards to swap into XI</span>
      `;
      container.appendChild(resHeader);
    }

    if (filter === "xi" && !slot.isXi) return;
    if (filter === "reserves" && slot.isXi) return;
    if (filter === "filled" && !slot.player) return;

    const card = document.createElement("div");
    const isFilled = slot.player !== null;
    const tierClass = getTierClass(slot.tierLevel);

    card.className = `slot-item-card ${isFilled ? 'filled' : ''} ${slot.isXi ? 'xi-slot' : 'reserve-slot'}`;
    card.id = `squad-slot-${slot.slotNumber}`;

    // Drag Handle (Available on ALL 30 slots for fluid drag and drop)
    const dragGrip = `
      <div class="slot-drag-handle" title="Drag to reorder / swap slot">⠿</div>
    `;

    // Up/Down reorder steppers ONLY for Playing XI (Slots 1–11)
    let reorderButtons = "";
    if (slot.isXi) {
      reorderButtons = `
        <div class="slot-reorder-group">
          <button class="slot-reorder-btn" title="Move Up in Playing XI" data-shift-slot="${slot.slotNumber}" data-shift-dir="-1" ${slot.slotNumber === 1 ? 'disabled' : ''}>▲</button>
          <button class="slot-reorder-btn" title="Move Down in Playing XI" data-shift-slot="${slot.slotNumber}" data-shift-dir="1" ${slot.slotNumber === 11 ? 'disabled' : ''}>▼</button>
        </div>
      `;
    }

    // Left controls cluster grouping drag grip, up/down arrows (if XI), and slot number badge
    const leftCluster = `
      <div class="slot-left-cluster">
        ${dragGrip}
        ${reorderButtons}
        <div class="slot-badge-num">
          ${slot.isXi ? `<span class="xi-order-badge">XI #${slot.slotNumber}</span>` : `<span class="res-badge-text">#${slot.slotNumber}</span>`}
        </div>
      </div>
    `;

    // Role & Level
    const roleCol = `
      <div class="slot-role-block">
        <span class="slot-tier-badge ${tierClass}">${slot.isXi ? slot.tierLevel : 'Reserve'}</span>
        <div class="slot-target-title">${escapeHtml(slot.targetRole)}</div>
      </div>
    `;

    // Player & Rating
    let playerCol = "";
    if (isFilled) {
      const p = slot.player;
      const isOs = p.country !== "India";
      playerCol = `
        <div class="slot-player-block">
          <span class="slot-player-tag">${escapeHtml(p.name)}</span>
          <span class="slot-os-tag">${isOs ? '✈️' : '🇮🇳'}</span>
          <span class="slot-rating-tag" title="Rating: ${p.rating}/100">★ ${p.rating}</span>
        </div>
      `;
    } else {
      playerCol = `
        <div class="slot-player-block">
          <span class="slot-player-empty">— Empty Slot (${slot.targetRole}) —</span>
        </div>
      `;
    }

    // Editable Price Input
    const priceCol = `
      <div class="slot-price-block">
        <div class="slot-price-edit-box">
          <span style="font-family:var(--font-mono); font-weight:700; font-size:0.85rem; color:var(--ink-muted);">₹</span>
          <input 
            type="number" 
            class="slot-price-input" 
            data-slot-num="${slot.slotNumber}"
            step="0.25" 
            min="0" 
            max="50"
            value="${(parseFloat(slot.actualPrice) || 0).toFixed(2)}"
            title="Edit price (Purse recalculates instantly)"
          >
          <span style="font-family:var(--font-mono); font-weight:700; font-size:0.85rem; color:var(--ink-muted);">Cr</span>
          <button class="slot-stepper-btn" data-slot-num="${slot.slotNumber}" data-delta="-0.25">-0.25</button>
          <button class="slot-stepper-btn" data-slot-num="${slot.slotNumber}" data-delta="0.25">+0.25</button>
          <button class="slot-stepper-btn" data-slot-num="${slot.slotNumber}" data-delta="1.00">+1.0</button>
        </div>
        <div class="slot-price-lakhs" id="slot-lakhs-${slot.slotNumber}">
          = ₹ ${formatLakhs(slot.actualPrice || 0)} L
        </div>
      </div>
    `;

    // Clear Slot Button
    const actionCol = `
      <div>
        ${isFilled ? `
          <button class="slot-delete-btn" data-slot-num="${slot.slotNumber}" title="Remove player & refund purse">
            ✕
          </button>
        ` : ''}
      </div>
    `;

    card.innerHTML = leftCluster + roleCol + playerCol + priceCol + actionCol;
    container.appendChild(card);

    // Setup drag events on card
    setupSlotDragEvents(card, slot.slotNumber);
  });

  attachSlotCardListeners();

  container.style.minHeight = "";

  if (scrollContainer && prevScroll > 0) {
    scrollContainer.scrollTop = prevScroll;
  }
}

function getTierClass(tier) {
  if (!tier) return "reserve";
  const t = tier.toLowerCase();
  if (t.includes("marquee") || t.includes("level 1")) return "marquee";
  if (t.includes("core") || t.includes("level 2")) return "core";
  if (t.includes("specialist") || t.includes("level 3")) return "specialist";
  if (t.includes("emerging") || t.includes("support") || t.includes("level 4")) return "support";
  return "reserve";
}

function attachSlotCardListeners() {
  // Direct price input editing
  document.querySelectorAll(".slot-price-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const slotNum = parseInt(e.target.dataset.slotNum);
      const slot = appState.squadSlots.find(s => s.slotNumber === slotNum);
      if (slot) {
        const val = parseFloat(e.target.value);
        slot.actualPrice = isNaN(val) ? 0 : Math.max(0, roundToTwo(val));

        const note = document.getElementById(`slot-lakhs-${slotNum}`);
        if (note) note.textContent = `= ₹ ${formatLakhs(slot.actualPrice)} L`;

        recalculatePurseAndMetrics();
        if (appState.activeWorkspaceView === "teamsWorkspaceView") {
          render12TeamsGrid();
        }
      }
    });
  });

  // Price steppers
  document.querySelectorAll(".slot-stepper-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const slotNum = parseInt(btn.dataset.slotNum);
      const delta = parseFloat(btn.dataset.delta);
      const slot = appState.squadSlots.find(s => s.slotNumber === slotNum);
      if (slot) {
        const current = parseFloat(slot.actualPrice) || 0;
        const updated = Math.max(0, roundToTwo(current + delta));
        slot.actualPrice = updated;

        const input = document.querySelector(`.slot-price-input[data-slot-num="${slotNum}"]`);
        if (input) input.value = updated.toFixed(2);

        const note = document.getElementById(`slot-lakhs-${slotNum}`);
        if (note) note.textContent = `= ₹ ${formatLakhs(updated)} L`;

        recalculatePurseAndMetrics();
        if (appState.activeWorkspaceView === "teamsWorkspaceView") {
          render12TeamsGrid();
        }
      }
    });
  });

  // Reorder Shift buttons (▲ / ▼)
  document.querySelectorAll(".slot-reorder-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const slotNum = parseInt(btn.dataset.shiftSlot);
      const dir = parseInt(btn.dataset.shiftDir);
      shiftSlotOrder(slotNum, dir);
    });
  });

  // Delete / Clear Slot
  document.querySelectorAll(".slot-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const slotNum = parseInt(btn.dataset.slotNum);
      const slot = appState.squadSlots.find(s => s.slotNumber === slotNum);
      if (slot) {
        const pName = slot.player ? slot.player.name : "";
        slot.player = null;
        slot.actualPrice = 0;
        renderSquadSlots();
        renderPlayerDirectory();
        render12TeamsGrid();
        recalculatePurseAndMetrics();
        showToast(`Cleared Slot #${slotNum} (${pName}) & refunded to purse`, "warn");
      }
    });
  });
}

// ==========================================================
// VIEW B: 12 FRANCHISES & RETENTIONS DESK
// ==========================================================
function render12TeamsGrid() {
  const container = document.getElementById("teamsGridContainer");
  if (!container) return;
  const scrollContainer = document.getElementById("workspaceScrollArea") || document.querySelector(".squad-workspace-block");
  const prevScroll = scrollContainer ? scrollContainer.scrollTop : 0;
  const currentH = container.offsetHeight;
  if (currentH > 0) container.style.minHeight = `${currentH}px`;
  container.innerHTML = "";

  const filter = appState.activeTeamFilter;
  const searchQ = (document.getElementById("teamSearchInput")?.value || "").toLowerCase().trim();

  const filteredTeams = appState.teams.filter(team => {
    if (filter === "our" && !team.isUserTeam) return false;
    if (filter === "rivals" && team.isUserTeam) return false;
    if (filter === "active" && (team.retentions || []).length === 0) return false;

    if (searchQ) {
      return team.name.toLowerCase().includes(searchQ) || team.shortName.toLowerCase().includes(searchQ);
    }
    return true;
  });

  filteredTeams.forEach(team => {
    const metrics = computeTeamMetrics(team);
    const card = document.createElement("div");
    card.className = `team-card ${team.isUserTeam ? 'user-team' : ''}`;
    card.style.borderColor = team.isUserTeam ? 'var(--brand-blue)' : team.borderTint;

    // Remaining color class
    let remClass = "safe";
    if (metrics.remainingPurse < 0) remClass = "deficit";
    else if (metrics.remainingPurse < 30) remClass = "tight";

    // Progress bar fill percentage
    const fillPercent = Math.min(100, Math.max(0, (metrics.remainingPurse / metrics.startingPurse) * 100));

    // Retentions chips
    let retChipsHtml = "";
    if (team.retentions && team.retentions.length > 0) {
      team.retentions.forEach((ret, index) => {
        const typePillClass = ret.isUncapped ? 'uncapped' : 'capped';
        const typeLabel = ret.isUncapped ? 'Uncapped' : 'Capped';
        retChipsHtml += `
          <div class="retention-chip-row">
            <div class="retention-chip-left">
              <span class="retention-slot-tag">S${ret.slotNumber || (index + 1)}</span>
              <strong>${escapeHtml(ret.player.name)}</strong>
              <span class="retention-type-pill ${typePillClass}">${typeLabel}</span>
            </div>
            <div>
              <span class="retention-chip-price">₹${(parseFloat(ret.price) || 0).toFixed(2)} Cr</span>
            </div>
          </div>
        `;
      });
    } else {
      retChipsHtml = `<div class="retention-empty-chip">0 Retentions • 5 RTM Cards Available</div>`;
    }

    card.innerHTML = `
      <div class="team-card-header">
        <div class="team-title-group">
          <div class="team-logo-avatar" style="background:${team.bgTint};">${team.logoEmoji}</div>
          <div>
            <div class="team-name-text">${escapeHtml(team.name)}</div>
            <div style="font-size:0.72rem; color:var(--ink-muted);">Starting Purse: ₹${metrics.startingPurse.toFixed(2)} Cr</div>
          </div>
        </div>
        <span class="team-short-badge" style="background:${team.badgeColor};">${team.shortName}</span>
      </div>

      <!-- Purse Meter -->
      <div class="team-purse-deck">
        <div class="team-purse-row">
          <span class="purse-label-sm">REMAINING PURSE</span>
          <span class="team-rem-amount ${remClass}">₹ ${metrics.remainingPurse.toFixed(2)} Cr</span>
        </div>
        <div class="team-purse-bar-track">
          <div class="team-purse-bar-fill" style="width:${fillPercent}%; background:${remClass === 'safe' ? '#10B981' : (remClass === 'tight' ? '#F59E0B' : '#EF4444')};"></div>
        </div>
        <div class="team-purse-substats">
          <span>Spent: ₹${metrics.totalSpent.toFixed(2)} Cr (${formatLakhs(metrics.totalSpent)} L)</span>
          <span>Balance: ₹${formatLakhs(metrics.remainingPurse)} L</span>
        </div>
      </div>

      <!-- Badges: Retentions, RTMs, Squad Size -->
      <div class="team-badge-stats-row">
        <span class="team-stat-badge rtm" title="${metrics.rtmsAvailable} RTM cards remaining out of ${metrics.totalRtmEarned} earned">
          🎟️ <strong>${metrics.rtmsAvailable} RTMs</strong>
        </span>
        <span class="team-stat-badge squad">
          👥 <strong>${metrics.totalPlayersCount} Players</strong> (✈️ ${metrics.overseasCount} OS)
        </span>
        <span class="team-stat-badge">
          🔒 <strong>${metrics.retentionsCount}/5 Retained</strong>
        </span>
      </div>

      <!-- Interactive RTM Control Strip (Easily set to 0 or adjust 0 to 5) -->
      <div class="team-rtm-interactive-bar">
        <div class="team-rtm-left">
          <span class="rtm-strip-icon">🎟️</span>
          <span class="rtm-strip-title">RTM RECORD:</span>
          <span class="rtm-live-count-badge ${metrics.rtmsAvailable > 0 ? 'active' : 'zero'}">${metrics.rtmsAvailable} / 5</span>
          ${typeof team.manualRtmCount === "number" ? '<span class="rtm-mode-badge custom" title="Manually customized">Custom</span>' : '<span class="rtm-mode-badge rule" title="Rule calculated (5 - Retentions)">Rule</span>'}
        </div>
        <div class="team-rtm-stepper">
          <button class="rtm-btn-step" data-action="rtm-dec" data-team-id="${team.id}" title="Decrease RTM" ${metrics.rtmsAvailable <= 0 ? 'disabled' : ''}>-</button>
          <select class="rtm-quick-select" data-action="rtm-select" data-team-id="${team.id}" title="Set RTM cards (0 to 5)">
            <option value="0" ${metrics.rtmsAvailable === 0 ? 'selected' : ''}>0</option>
            <option value="1" ${metrics.rtmsAvailable === 1 ? 'selected' : ''}>1</option>
            <option value="2" ${metrics.rtmsAvailable === 2 ? 'selected' : ''}>2</option>
            <option value="3" ${metrics.rtmsAvailable === 3 ? 'selected' : ''}>3</option>
            <option value="4" ${metrics.rtmsAvailable === 4 ? 'selected' : ''}>4</option>
            <option value="5" ${metrics.rtmsAvailable === 5 ? 'selected' : ''}>5</option>
          </select>
          <button class="rtm-btn-step" data-action="rtm-inc" data-team-id="${team.id}" title="Increase RTM" ${metrics.rtmsAvailable >= 5 ? 'disabled' : ''}>+</button>
          ${typeof team.manualRtmCount === "number" ? `
            <button class="rtm-btn-reset-rule" data-action="rtm-reset-rule" data-team-id="${team.id}" title="Reset to official rule (5 - Retentions)">↻ Rule</button>
          ` : ''}
        </div>
      </div>

      <!-- Retentions Summary -->
      <div class="team-retentions-summary-box">
        <div class="retentions-box-title">
          <span>Retained Stars (${metrics.retentionsCount}/5)</span>
          <span>Cost: ₹${metrics.retentionSpent.toFixed(2)} Cr</span>
        </div>
        <div class="retentions-chips-list">
          ${retChipsHtml}
        </div>
      </div>

      <!-- Card Action Buttons -->
      <div class="team-card-actions">
        <button class="btn btn-secondary btn-sm" data-action="manage-retentions" data-team-id="${team.id}">
          🔒 Retentions
        </button>
        <button class="btn btn-primary btn-sm" data-action="view-squad" data-team-id="${team.id}">
          📋 Full Squad (${metrics.totalPlayersCount})
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach card button listeners
  container.querySelectorAll('[data-action="manage-retentions"]').forEach(btn => {
    btn.addEventListener("click", () => {
      openRetentionModalForTeam(btn.dataset.teamId);
    });
  });

  container.querySelectorAll('[data-action="view-squad"]').forEach(btn => {
    btn.addEventListener("click", () => {
      openSquadModalForTeam(btn.dataset.teamId);
    });
  });

  // Attach RTM Stepper & Select listeners
  container.querySelectorAll('[data-action="rtm-dec"]').forEach(btn => {
    btn.addEventListener("click", () => {
      adjustTeamRtmCards(btn.dataset.teamId, -1);
    });
  });

  container.querySelectorAll('[data-action="rtm-inc"]').forEach(btn => {
    btn.addEventListener("click", () => {
      adjustTeamRtmCards(btn.dataset.teamId, 1);
    });
  });

  container.querySelectorAll('[data-action="rtm-select"]').forEach(sel => {
    sel.addEventListener("change", (e) => {
      setTeamRtmCards(sel.dataset.teamId, e.target.value);
    });
  });

  container.querySelectorAll('[data-action="rtm-reset-rule"]').forEach(btn => {
    btn.addEventListener("click", () => {
      resetTeamRtmToRule(btn.dataset.teamId);
    });
  });

  container.style.minHeight = "";

  if (scrollContainer && prevScroll > 0) {
    scrollContainer.scrollTop = prevScroll;
  }
}

// Helpers: Manage Team RTM Cards (0 to 5)
function setTeamRtmCards(teamId, count) {
  const team = appState.teams.find(t => t.id === teamId);
  if (!team) return;
  const num = Math.max(0, Math.min(5, parseInt(count) || 0));
  team.manualRtmCount = num;
  recalculatePurseAndMetrics();
  render12TeamsGrid();
  if (appState.activeStagePlayer) {
    populateRivalTeamSelector();
  }
  persistState();
  showToast(`Updated ${team.shortName} RTM count to ${num}!`, "success");
}

function adjustTeamRtmCards(teamId, delta) {
  const team = appState.teams.find(t => t.id === teamId);
  if (!team) return;
  const metrics = computeTeamMetrics(team);
  const current = metrics.rtmsAvailable;
  const target = Math.max(0, Math.min(5, current + delta));
  team.manualRtmCount = target;
  recalculatePurseAndMetrics();
  render12TeamsGrid();
  if (appState.activeStagePlayer) {
    populateRivalTeamSelector();
  }
  persistState();
  showToast(`Updated ${team.shortName} RTM count to ${target}!`, "success");
}

function resetTeamRtmToRule(teamId) {
  const team = appState.teams.find(t => t.id === teamId);
  if (!team) return;
  delete team.manualRtmCount;
  team.rtmCardsUsed = (team.auctionBuys || []).filter(b => b.isRtm).length;
  recalculatePurseAndMetrics();
  render12TeamsGrid();
  if (appState.activeStagePlayer) {
    populateRivalTeamSelector();
  }
  persistState();
  showToast(`Reset ${team.shortName} RTMs to official rule standard (5 - Retentions)!`, "warn");
}

// ==========================================================
// RETENTION MANAGER MODAL (UP TO 5 PLAYERS PER TEAM)
// ==========================================================
function openRetentionModalForTeam(teamId) {
  appState.activeModalTeamId = teamId;
  const team = appState.teams.find(t => t.id === teamId);
  if (!team) return;

  const metrics = computeTeamMetrics(team);

  // Set modal header details
  document.getElementById("retentionModalTeamEmoji").textContent = team.logoEmoji;
  document.getElementById("retentionModalTeamTitle").textContent = `${team.name} — Retention Manager`;
  document.getElementById("retentionModalPurseStats").textContent = 
    `Starting Purse: ₹${metrics.startingPurse.toFixed(2)} Cr | Spent: ₹${metrics.retentionSpent.toFixed(2)} Cr | Remaining: ₹${metrics.remainingPurse.toFixed(2)} Cr | RTMs: ${metrics.rtmsAvailable} Available`;

  // Populate player select dropdown
  populateRetentionPlayerSelect();

  // Set next available slot
  const nextSlot = Math.min(5, (team.retentions || []).length + 1);
  document.getElementById("retentionSlotSelect").value = nextSlot.toString();
  document.getElementById("retentionSlotNumberDisplay").textContent = nextSlot.toString();

  // Reset type to capped
  document.getElementById("typeCappedRadio").checked = true;
  handleRetentionSlotChange();

  // Render current retentions table & slot status indicators
  renderRetentionModalContent(team);

  openModal("teamRetentionModal");
}

function handleRetentionSlotChange() {
  const slotNum = parseInt(document.getElementById("retentionSlotSelect").value);
  const isUncapped = document.getElementById("typeUncappedRadio").checked;
  const team = appState.teams.find(t => t.id === appState.activeModalTeamId);

  document.getElementById("retentionSlotNumberDisplay").textContent = slotNum.toString();

  const standardPrice = calculateStandardRetentionPrice(slotNum, isUncapped, team ? team.retentions : []);
  
  const priceInput = document.getElementById("retentionPriceInput");
  priceInput.value = standardPrice.toFixed(2);

  const hint = document.getElementById("retentionRulePriceHint");
  hint.textContent = `Rule standard: ₹${standardPrice.toFixed(2)} Cr for Slot #${slotNum} (${isUncapped ? 'Uncapped' : 'Capped'}). Fully editable!`;
}

function populateRetentionPlayerSelect(filterQuery = "") {
  const select = document.getElementById("retentionPlayerSelect");
  select.innerHTML = '<option value="">-- Choose Player to Retain --</option>';

  const currentTeam = appState.teams.find(t => t.id === appState.activeModalTeamId);
  const alreadyRetainedNames = new Set();
  appState.teams.forEach(t => {
    (t.retentions || []).forEach(r => {
      if (r.player) alreadyRetainedNames.add(r.player.name.toLowerCase().trim());
    });
  });

  const availablePlayers = appState.playerDirectory.filter(p => {
    if (alreadyRetainedNames.has(p.name.toLowerCase().trim())) return false;
    if (filterQuery) {
      return p.name.toLowerCase().includes(filterQuery) || p.role.toLowerCase().includes(filterQuery);
    }
    return true;
  });

  // Sort by rating descending
  availablePlayers.sort((a, b) => b.rating - a.rating);

  availablePlayers.slice(0, 150).forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (★${p.rating} • ${p.role} • ${p.country !== 'India' ? '✈️ OS' : '🇮🇳 Ind'})`;
    select.appendChild(opt);
  });
}

function handleConfirmAddRetention() {
  const team = appState.teams.find(t => t.id === appState.activeModalTeamId);
  if (!team) return;

  if ((team.retentions || []).length >= 5) {
    showToast("Maximum 5 retentions reached for this team! Unused slots convert to RTMs.", "danger");
    return;
  }

  const playerId = document.getElementById("retentionPlayerSelect").value;
  if (!playerId) {
    showToast("Please choose a player to retain!", "warn");
    return;
  }

  const player = appState.playerDirectory.find(p => p.id === playerId);
  if (!player) return;

  const slotNum = parseInt(document.getElementById("retentionSlotSelect").value);
  const isUncapped = document.getElementById("typeUncappedRadio").checked;
  const price = roundToTwo(parseFloat(document.getElementById("retentionPriceInput").value) || 18.00);

  // Check if slot number is already taken
  if (!Array.isArray(team.retentions)) team.retentions = [];
  const existingSlotIdx = team.retentions.findIndex(r => r.slotNumber === slotNum);
  if (existingSlotIdx !== -1) {
    if (!confirm(`Slot #${slotNum} is already occupied by ${team.retentions[existingSlotIdx].player.name}. Replace it?`)) {
      return;
    }
    team.retentions.splice(existingSlotIdx, 1);
  }

  // Remove player from anywhere else
  removePlayerFromAllTeams(player.name);

  // Add retention
  team.retentions.push({
    player: player,
    slotNumber: slotNum,
    isUncapped: isUncapped,
    price: price,
    retainedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  // Sort retentions by slot number
  team.retentions.sort((a, b) => a.slotNumber - b.slotNumber);

  // If this is our team, place player into our squad slots as well
  if (team.isUserTeam) {
    const targetSlot = appState.squadSlots.find(s => s.slotNumber === slotNum) || appState.squadSlots.find(s => s.player === null);
    if (targetSlot) {
      targetSlot.player = player;
      targetSlot.actualPrice = price;
    }
  }

  renderRetentionModalContent(team);
  renderPlayerDirectory();
  render12TeamsGrid();
  renderSquadSlots();
  recalculatePurseAndMetrics();

  showToast(`🔒 Retained ${player.name} for ${team.name} at ₹${price.toFixed(2)} Cr!`, "success");
}

function renderRetentionModalContent(team) {
  const metrics = computeTeamMetrics(team);

  // Update status indicators (1 to 5)
  const bar = document.getElementById("retentionSlotsStatusBar");
  bar.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const ret = (team.retentions || []).find(r => r.slotNumber === i);
    const ind = document.createElement("div");

    if (ret) {
      ind.className = "retention-slot-indicator filled";
      ind.innerHTML = `
        <span class="slot-ind-num">Slot ${i} (${ret.isUncapped ? 'Uncapped' : 'Capped'})</span>
        <span class="slot-ind-price">₹${ret.price.toFixed(2)} Cr</span>
        <span class="slot-ind-player">${escapeHtml(ret.player.name)}</span>
      `;
    } else {
      ind.className = "retention-slot-indicator empty-rtm";
      ind.innerHTML = `
        <span class="slot-ind-num">Slot ${i} (Unused)</span>
        <span class="slot-ind-rtm-text">🎟️ Converts to RTM</span>
        <span style="font-size:0.68rem; color:var(--ink-muted);">Available Card</span>
      `;
    }
    bar.appendChild(ind);
  }

  // Render Table of current retentions
  const tbody = document.getElementById("retentionsTableBody");
  const emptyNotice = document.getElementById("retentionsEmptyNotice");
  tbody.innerHTML = "";

  if (!team.retentions || team.retentions.length === 0) {
    emptyNotice.style.display = "block";
    return;
  }
  emptyNotice.style.display = "none";

  team.retentions.forEach((ret, index) => {
    const p = ret.player;
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>Slot #${ret.slotNumber || (index + 1)}</strong></td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${p.role} (${p.style || ''})</td>
      <td><span class="retention-type-pill ${ret.isUncapped ? 'uncapped' : 'capped'}">${ret.isUncapped ? 'Uncapped' : 'Capped'}</span></td>
      <td><span class="dir-rating-pill">★ ${p.rating}</span></td>
      <td style="text-align: right;">
        <div class="inline-price-editor">
          <span>₹</span>
          <input 
            type="number" 
            class="inline-price-input" 
            data-ret-idx="${index}" 
            value="${(parseFloat(ret.price) || 0).toFixed(2)}"
            step="0.25"
            min="0.20"
            max="30"
          >
          <span>Cr</span>
          <button class="btn-icon-action save" data-action="save-ret-price" data-ret-idx="${index}" title="Save modified price">✓</button>
        </div>
      </td>
      <td style="text-align: center;">
        <button class="btn-icon-action delete" data-action="delete-ret" data-ret-idx="${index}" title="Remove retention & refund purse">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach table button listeners
  tbody.querySelectorAll('[data-action="save-ret-price"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.retIdx);
      const input = tbody.querySelector(`input[data-ret-idx="${idx}"]`);
      if (input && team.retentions[idx]) {
        const newPrice = roundToTwo(parseFloat(input.value) || 0);
        team.retentions[idx].price = newPrice;

        // If our team, sync to squad slot
        if (team.isUserTeam) {
          const slot = appState.squadSlots.find(s => s.player && s.player.name.toLowerCase() === team.retentions[idx].player.name.toLowerCase());
          if (slot) slot.actualPrice = newPrice;
        }

        renderRetentionModalContent(team);
        render12TeamsGrid();
        renderSquadSlots();
        recalculatePurseAndMetrics();
        persistState();
        showToast(`Updated retention price for ${team.retentions[idx].player.name} to ₹${newPrice.toFixed(2)} Cr!`, "success");
      }
    });
  });

  tbody.querySelectorAll('[data-action="delete-ret"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.retIdx);
      const removed = team.retentions.splice(idx, 1)[0];

      if (team.isUserTeam && removed) {
        const slot = appState.squadSlots.find(s => s.player && s.player.name.toLowerCase() === removed.player.name.toLowerCase());
        if (slot) {
          slot.player = null;
          slot.actualPrice = 0;
        }
      }

      renderRetentionModalContent(team);
      populateRetentionPlayerSelect();
      renderPlayerDirectory();
      render12TeamsGrid();
      renderSquadSlots();
      recalculatePurseAndMetrics();
      persistState();
      showToast(`Removed ${removed.player.name} from retentions & refunded purse!`, "warn");
    });
  });
}

// ==========================================================
// VIEW FULL TEAM SQUAD MODAL (WITH EDITABLE AMOUNTS)
// ==========================================================
function openSquadModalForTeam(teamId) {
  appState.activeModalTeamId = teamId;
  const team = appState.teams.find(t => t.id === teamId);
  if (!team) return;

  const metrics = computeTeamMetrics(team);

  document.getElementById("squadModalTeamEmoji").textContent = team.logoEmoji;
  document.getElementById("squadModalTeamTitle").textContent = `${team.name} — Full Squad Roster`;
  document.getElementById("squadModalTeamSubtitle").textContent = 
    `Edit player pricing below anytime. Purse recalculates immediately on save.`;

  // Stat Strip
  const strip = document.getElementById("teamModalStatStrip");
  strip.innerHTML = `
    <div class="modal-stat-item">
      <span class="modal-stat-label">Starting Purse</span>
      <span class="modal-stat-val">₹ ${metrics.startingPurse.toFixed(2)} Cr</span>
    </div>
    <div class="modal-stat-item">
      <span class="modal-stat-label">Total Spent</span>
      <span class="modal-stat-val" style="color:#DC2626;">₹ ${metrics.totalSpent.toFixed(2)} Cr</span>
    </div>
    <div class="modal-stat-item">
      <span class="modal-stat-label">Remaining Purse</span>
      <span class="modal-stat-val" style="color:#059669;">₹ ${metrics.remainingPurse.toFixed(2)} Cr</span>
    </div>
    <div class="modal-stat-item">
      <span class="modal-stat-label">RTMs Available</span>
      <span class="modal-stat-val" style="color:#D97706;">${metrics.rtmsAvailable} / ${metrics.totalRtmEarned}</span>
    </div>
    <div class="modal-stat-item">
      <span class="modal-stat-label">Squad Size</span>
      <span class="modal-stat-val">${metrics.totalPlayersCount} Players (✈️ ${metrics.overseasCount} OS)</span>
    </div>
  `;

  renderSquadModalTable(team);
  openModal("teamSquadModal");
}

function renderSquadModalTable(team) {
  const tbody = document.getElementById("teamSquadTableBody");
  const emptyNotice = document.getElementById("teamSquadEmptyNotice");
  tbody.innerHTML = "";

  // Combine retentions and auctionBuys
  const allSquadItems = [];

  (team.retentions || []).forEach(r => {
    allSquadItems.push({
      player: r.player,
      price: r.price,
      type: "Retained",
      isUncapped: r.isUncapped,
      rawItem: r,
      isRetention: true
    });
  });

  (team.auctionBuys || []).forEach(b => {
    allSquadItems.push({
      player: b.player,
      price: b.price,
      type: b.isRtm ? "Auction (RTM Matched)" : "Auction Buy",
      isUncapped: false,
      rawItem: b,
      isRetention: false
    });
  });

  if (allSquadItems.length === 0) {
    emptyNotice.style.display = "block";
    return;
  }
  emptyNotice.style.display = "none";

  allSquadItems.forEach((item, index) => {
    const p = item.player;
    const isOs = p.country !== "India";
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>${p.role} (${p.style || ''})</td>
      <td>
        <span class="retention-type-pill ${item.isRetention ? (item.isUncapped ? 'uncapped' : 'capped') : ''}" style="${!item.isRetention ? 'background:#E0E7FF; color:#3730A3;' : ''}">
          ${item.type}
        </span>
      </td>
      <td>${isOs ? '✈️ Overseas' : '🇮🇳 Indian'}</td>
      <td style="text-align: right;">
        <div class="inline-price-editor">
          <span>₹</span>
          <input 
            type="number" 
            class="inline-price-input" 
            data-squad-idx="${index}" 
            value="${(parseFloat(item.price) || 0).toFixed(2)}"
            step="0.25"
            min="0.20"
            max="40"
          >
          <span>Cr</span>
          <button class="btn-icon-action save" data-action="save-squad-price" data-squad-idx="${index}" title="Save modified price">✓</button>
        </div>
      </td>
      <td style="text-align: center;">
        <button class="btn-icon-action delete" data-action="release-squad-player" data-squad-idx="${index}" title="Release player & refund purse">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach button listeners
  tbody.querySelectorAll('[data-action="save-squad-price"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.squadIdx);
      const input = tbody.querySelector(`input[data-squad-idx="${idx}"]`);
      if (!input) return;

      const newPrice = roundToTwo(parseFloat(input.value) || 0);
      const item = allSquadItems[idx];

      if (item.isRetention) {
        item.rawItem.price = newPrice;
      } else {
        item.rawItem.price = newPrice;
      }

      // If user team, sync to squad slots
      if (team.isUserTeam) {
        const slot = appState.squadSlots.find(s => s.player && s.player.name.toLowerCase() === item.player.name.toLowerCase());
        if (slot) slot.actualPrice = newPrice;
      }

      openSquadModalForTeam(team.id);
      render12TeamsGrid();
      renderSquadSlots();
      renderSoldOtherTable();
      recalculatePurseAndMetrics();
      persistState();
      showToast(`Updated price for ${item.player.name} to ₹${newPrice.toFixed(2)} Cr!`, "success");
    });
  });

  tbody.querySelectorAll('[data-action="release-squad-player"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.squadIdx);
      const item = allSquadItems[idx];
      if (!item) return;

      if (item.isRetention) {
        team.retentions = team.retentions.filter(r => r !== item.rawItem);
      } else {
        team.auctionBuys = team.auctionBuys.filter(b => b !== item.rawItem);
        // If RTM was used, restore 1 RTM card
        if (item.rawItem.isRtm) {
          if (typeof team.manualRtmCount === "number") {
            team.manualRtmCount = Math.min(5, team.manualRtmCount + 1);
          }
          if (team.rtmCardsUsed > 0) {
            team.rtmCardsUsed--;
          }
        }
      }

      // Also remove from soldToOthers if present
      appState.soldToOthers = appState.soldToOthers.filter(s => s.player.name.toLowerCase() !== item.player.name.toLowerCase());

      // If user team, clear from squad slot
      if (team.isUserTeam) {
        const slot = appState.squadSlots.find(s => s.player && s.player.name.toLowerCase() === item.player.name.toLowerCase());
        if (slot) {
          slot.player = null;
          slot.actualPrice = 0;
        }
      }

      openSquadModalForTeam(team.id);
      renderPlayerDirectory();
      render12TeamsGrid();
      renderSquadSlots();
      renderSoldOtherTable();
      recalculatePurseAndMetrics();
      persistState();
      showToast(`Released ${item.player.name} back to available pool!`, "warn");
    });
  });
}

// ==========================================================
// RENDER PLAYER DIRECTORY (WITH TEAM RETENTION/OWNERSHIP BADGES)
// ==========================================================
function renderPlayerDirectory() {
  const container = document.getElementById("directoryPlayersContainer");
  if (!container) return;

  const leftCol = document.querySelector(".auction-live-block");
  const prevScroll = leftCol ? leftCol.scrollTop : 0;
  const currentH = container.offsetHeight;
  if (currentH > 0) container.style.minHeight = `${currentH}px`;
  container.innerHTML = "";

  const q = appState.activeSearchQuery;
  const filter = appState.activeDirFilter;

  // Build ownership lookup
  const ownershipMap = new Map(); // playerName -> { team, type, price }

  appState.teams.forEach(team => {
    (team.retentions || []).forEach(r => {
      if (r.player) {
        ownershipMap.set(r.player.name.toLowerCase().trim(), {
          team: team,
          type: "Retained",
          isUncapped: r.isUncapped,
          price: r.price
        });
      }
    });

    (team.auctionBuys || []).forEach(b => {
      if (b.player) {
        ownershipMap.set(b.player.name.toLowerCase().trim(), {
          team: team,
          type: b.isRtm ? "RTM Matched" : "Bought",
          price: b.price
        });
      }
    });
  });

  // Also check squadSlots for user team (CSK)
  appState.squadSlots.forEach(s => {
    if (s.player) {
      const key = s.player.name.toLowerCase().trim();
      if (!ownershipMap.has(key)) {
        ownershipMap.set(key, {
          team: getUserTeam(),
          type: `In Squad (#${s.slotNumber})`,
          price: s.actualPrice
        });
      }
    }
  });

  const filtered = appState.playerDirectory.filter(p => {
    const pNameKey = p.name.toLowerCase().trim();
    const ownership = ownershipMap.get(pNameKey);

    if (filter === "Overseas" && p.country === "India") return false;
    if (filter === "Top90" && p.rating < 90) return false;
    if (filter === "Retained" && (!ownership || !ownership.type.includes("Retained"))) return false;
    if (["Batter", "Wicketkeeper", "All-Rounder", "Bowler"].includes(filter) && p.role !== filter) return false;

    if (q) {
      const matchName = p.name.toLowerCase().includes(q);
      const matchRole = (p.role || "").toLowerCase().includes(q);
      const matchStyle = (p.style || "").toLowerCase().includes(q);
      const matchCountry = (p.country || "").toLowerCase().includes(q);
      return matchName || matchRole || matchCountry || matchStyle;
    }
    return true;
  });

  document.getElementById("poolRemainingCount").textContent = `${filtered.length} of ${appState.playerDirectory.length} Players`;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--ink-muted); font-size: 0.8rem;">No players found matching criteria</div>`;
    return;
  }

  filtered.forEach(player => {
    const pNameKey = player.name.toLowerCase().trim();
    const ownership = ownershipMap.get(pNameKey);
    const isCurrentStage = appState.activeStagePlayer && appState.activeStagePlayer.name.toLowerCase().trim() === pNameKey;

    const row = document.createElement("div");
    let stateClass = "";
    if (isCurrentStage) stateClass = "selected-stage";
    else if (ownership) {
      stateClass = ownership.team.isUserTeam ? "taken-by-us" : "taken-by-other";
    }

    row.className = `dir-player-row ${stateClass}`;

    let statusPill = "";
    if (isCurrentStage) {
      statusPill = `<span class="dir-status-tag" style="background:#DBEAFE; color:#1D4ED8;">On Auction 🔨</span>`;
    } else if (ownership) {
      const isOur = ownership.team.isUserTeam;
      const bg = isOur ? '#DCFCE7' : '#FEE2E2';
      const fg = isOur ? '#15803D' : '#B91C1C';
      statusPill = `<span class="dir-status-tag" style="background:${bg}; color:${fg};">${ownership.team.logoEmoji || ''} ${ownership.team.shortName || ''} (${ownership.type} ₹${(ownership.price || 0).toFixed(2)} Cr)</span>`;
    }

    const isOs = player.country !== "India";
    const flag = isOs ? "✈️" : "🇮🇳";
    const ratingClass = player.rating >= 95 ? "elite" : (player.rating >= 90 ? "high" : "");

    row.innerHTML = `
      <div class="dir-player-info">
        <div class="dir-name-title">
          <span>${flag}</span>
          <span>${escapeHtml(player.name)}</span>
          ${statusPill}
        </div>
        <div class="dir-role-sub">${player.role} • ${escapeHtml(player.style || '')}</div>
      </div>
      <div class="dir-player-right">
        <span class="dir-rating-pill ${ratingClass}">★ ${player.rating}/100</span>
        <span class="dir-price-sub">₹ ${player.basePrice.toFixed(2)} Cr Base</span>
      </div>
    `;

    row.addEventListener("click", () => {
      putPlayerOnStage(player);
    });

    container.appendChild(row);
  });

  container.style.minHeight = "";

  if (leftCol && prevScroll > 0) {
    leftCol.scrollTop = prevScroll;
  }
}

// ==========================================================
// RENDER SOLD TO OTHER TEAMS TABLE (WITH EDITABLE AMOUNTS)
// ==========================================================
function renderSoldOtherTable() {
  const scrollContainer = document.getElementById("workspaceScrollArea") || document.querySelector(".squad-workspace-block");
  const prevScroll = scrollContainer ? scrollContainer.scrollTop : 0;

  const tbody = document.getElementById("soldOtherTableBody");
  const emptyNotice = document.getElementById("soldOtherEmptyNotice");
  tbody.innerHTML = "";

  // Compile list from all rival teams' auctionBuys
  const list = [];
  appState.teams.filter(t => !t.isUserTeam).forEach(team => {
    (team.auctionBuys || []).forEach((b, bIdx) => {
      list.push({
        team: team,
        player: b.player,
        price: b.price,
        isRtm: b.isRtm,
        rawBuy: b,
        buyIdx: bIdx
      });
    });
  });

  document.getElementById("otherSoldTotalCount").textContent = `${list.length} Players Sold to Rivals`;

  if (list.length === 0) {
    emptyNotice.style.display = "block";
    return;
  }
  emptyNotice.style.display = "none";

  list.forEach((item, index) => {
    const p = item.player;
    const team = item.team;
    const isOs = p.country !== "India";
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td>
        <span class="team-short-badge" style="background:${team.badgeColor}; margin-right:4px;">${team.shortName}</span>
        <strong>${team.logoEmoji} ${escapeHtml(team.name)}</strong>
        ${item.isRtm ? '<span class="retention-type-pill uncapped" style="margin-left:4px;">RTM Matched</span>' : ''}
      </td>
      <td>${p.role} (${p.style || ''})</td>
      <td><span class="dir-rating-pill">★ ${p.rating}/100</span></td>
      <td>${isOs ? '✈️ Overseas' : '🇮🇳 Indian'}</td>
      <td style="text-align: right;">
        <div class="inline-price-editor">
          <span>₹</span>
          <input 
            type="number" 
            class="inline-price-input" 
            data-sold-idx="${index}" 
            value="${(parseFloat(item.price) || 0).toFixed(2)}"
            step="0.25"
            min="0.20"
            max="40"
          >
          <span>Cr</span>
          <button class="btn-icon-action save" data-action="save-sold-price" data-sold-idx="${index}" title="Save modified price">✓</button>
        </div>
      </td>
      <td style="text-align: center;">
        <button class="btn-undo-sold" data-sold-idx="${index}" title="Undo sale & return to auction pool">Undo</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach button listeners
  tbody.querySelectorAll('[data-action="save-sold-price"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.soldIdx);
      const input = tbody.querySelector(`input[data-sold-idx="${idx}"]`);
      if (input && list[idx]) {
        const newPrice = roundToTwo(parseFloat(input.value) || 0);
        list[idx].rawBuy.price = newPrice;

        renderSoldOtherTable();
        render12TeamsGrid();
        renderPlayerDirectory();
        recalculatePurseAndMetrics();
        persistState();
        showToast(`Updated sold price for ${list[idx].player.name} to ₹${newPrice.toFixed(2)} Cr!`, "success");
      }
    });
  });

  tbody.querySelectorAll(".btn-undo-sold").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.soldIdx);
      const item = list[idx];
      if (!item) return;

      // Remove from team auctionBuys
      item.team.auctionBuys = item.team.auctionBuys.filter(b => b !== item.rawBuy);
      if (item.isRtm) {
        if (typeof item.team.manualRtmCount === "number") {
          item.team.manualRtmCount = Math.min(5, item.team.manualRtmCount + 1);
        }
        if (item.team.rtmCardsUsed > 0) {
          item.team.rtmCardsUsed--;
        }
      }

      // Remove from soldToOthers
      appState.soldToOthers = appState.soldToOthers.filter(s => s.player.name.toLowerCase() !== item.player.name.toLowerCase());

      renderSoldOtherTable();
      render12TeamsGrid();
      renderPlayerDirectory();
      recalculatePurseAndMetrics();
      persistState();
      showToast(`Returned ${item.player.name} to available auction pool!`, "success");
    });
  });

  if (scrollContainer && prevScroll > 0) {
    scrollContainer.scrollTop = prevScroll;
  }
}

// ==========================================================
// AUTO-BALANCE BUDGET ACROSS EMPTY SLOTS
// ==========================================================
function autoBalanceRemainingBudget() {
  const emptySlots = appState.squadSlots.filter(s => s.player === null);
  if (emptySlots.length === 0) {
    showToast("All 30 squad slots are already filled!", "warn");
    return;
  }

  let filledSpent = 0;
  appState.squadSlots.forEach(s => {
    if (s.player) filledSpent += (parseFloat(s.actualPrice) || 0);
  });

  const available = roundToTwo(appState.totalPurse - filledSpent);
  if (available <= 0) {
    showToast("No remaining purse to balance!", "danger");
    return;
  }

  let totalWeight = 0;
  emptySlots.forEach(s => {
    totalWeight += (s.isXi ? 2.5 : 0.8);
  });

  emptySlots.forEach(s => {
    const weight = s.isXi ? 2.5 : 0.8;
    const share = (available * (weight / totalWeight));
    const rounded = Math.max(0.20, Math.round(share * 4) / 4);
    s.actualPrice = roundToTwo(rounded);
  });

  renderSquadSlots();
  recalculatePurseAndMetrics();
  showToast(`Auto-balanced ₹${available.toFixed(2)} Cr across ${emptySlots.length} open slots!`, "success");
}

// ==========================================================
// DEMO SQUAD PREFILL (2027 FORMAT)
// ==========================================================
function loadFullDemoSquad() {
  const demoPicks = [
    { slot: 1, name: "Ruturaj Gaikwad", price: 18.00 },
    { slot: 2, name: "Ayush Mhatre", price: 4.25 },
    { slot: 3, name: "Devon Conway", price: 9.50 },
    { slot: 4, name: "Shivam Dube", price: 18.00 },
    { slot: 5, name: "MS Dhoni", price: 4.00 },
    { slot: 6, name: "Ravindra Jadeja", price: 14.00 },
    { slot: 7, name: "Matheesha Pathirana", price: 11.00 },
    { slot: 8, name: "Noor Ahmad", price: 10.00 },
    { slot: 9, name: "Khaleel Ahmed", price: 4.80 },
    { slot: 10, name: "T Natarajan", price: 6.50 },
    { slot: 11, name: "Mukesh Choudhary", price: 1.50 },
    { slot: 12, name: "Shaik Rasheed", price: 0.50 },
    { slot: 13, name: "Sameer Rizvi", price: 1.20 },
    { slot: 14, name: "Rahul Chahar", price: 2.25 },
    { slot: 15, name: "Simarjeet Singh", price: 1.50 }
  ];

  appState.totalPurse = 125.00;
  document.getElementById("totalPurseInput").value = "125.00";

  demoPicks.forEach(pick => {
    const slot = appState.squadSlots.find(s => s.slotNumber === pick.slot);
    const player = appState.playerDirectory.find(p => p.name.toLowerCase() === pick.name.toLowerCase());
    if (slot && player) {
      slot.player = player;
      slot.actualPrice = roundToTwo(pick.price);
    }
  });

  // Setup sample retentions for CSK according to Verdict 2027 rules
  const csk = getUserTeam();
  if (csk && csk.retentions.length === 0) {
    const ruturaj = appState.playerDirectory.find(p => p.name === "Ruturaj Gaikwad");
    const jadeja = appState.playerDirectory.find(p => p.name === "Ravindra Jadeja");
    const pathirana = appState.playerDirectory.find(p => p.name === "Matheesha Pathirana");
    const dube = appState.playerDirectory.find(p => p.name === "Shivam Dube");
    const msd = appState.playerDirectory.find(p => p.name === "MS Dhoni");

    if (ruturaj) csk.retentions.push({ player: ruturaj, slotNumber: 1, isUncapped: false, price: 18.00 });
    if (jadeja) csk.retentions.push({ player: jadeja, slotNumber: 2, isUncapped: false, price: 14.00 });
    if (pathirana) csk.retentions.push({ player: pathirana, slotNumber: 3, isUncapped: false, price: 11.00 });
    if (dube) csk.retentions.push({ player: dube, slotNumber: 4, isUncapped: false, price: 18.00 });
    if (msd) csk.retentions.push({ player: msd, slotNumber: 5, isUncapped: true, price: 4.00 });
  }

  // Setup sample retentions for Mumbai Indians
  const mi = appState.teams.find(t => t.id === "mi");
  if (mi && mi.retentions.length === 0) {
    const bumrah = appState.playerDirectory.find(p => p.name === "Jasprit Bumrah");
    const hardik = appState.playerDirectory.find(p => p.name === "Hardik Pandya");
    const surya = appState.playerDirectory.find(p => p.name.includes("Suryakumar"));
    const rohit = appState.playerDirectory.find(p => p.name.includes("Rohit"));
    if (bumrah) mi.retentions.push({ player: bumrah, slotNumber: 1, isUncapped: false, price: 18.00 });
    if (hardik) mi.retentions.push({ player: hardik, slotNumber: 2, isUncapped: false, price: 14.00 });
    if (surya) mi.retentions.push({ player: surya, slotNumber: 3, isUncapped: false, price: 11.00 });
    if (rohit) mi.retentions.push({ player: rohit, slotNumber: 4, isUncapped: false, price: 18.00 });
  }

  // Setup sample retentions for Kochi Tuskers Kerala & Pune Warriors India
  const ktk = appState.teams.find(t => t.id === "ktk");
  if (ktk && ktk.retentions.length === 0) {
    const samson = appState.playerDirectory.find(p => p.name.includes("Samson"));
    if (samson) ktk.retentions.push({ player: samson, slotNumber: 1, isUncapped: false, price: 18.00 });
  }

  const pwi = appState.teams.find(t => t.id === "pwi");
  if (pwi && pwi.retentions.length === 0) {
    const bhuvi = appState.playerDirectory.find(p => p.name.includes("Bhuvneshwar"));
    if (bhuvi) pwi.retentions.push({ player: bhuvi, slotNumber: 1, isUncapped: false, price: 18.00 });
  }

  renderSquadSlots();
  renderPlayerDirectory();
  render12TeamsGrid();
  recalculatePurseAndMetrics();
  showToast("Loaded CSK Championship Squad featuring Ayush Mhatre & 2027 Retentions!", "success");
}

function confirmResetAllData() {
  if (confirm("Reset entire squad, 12 franchise retentions, purse budgets, and sold tracker?")) {
    appState.squadSlots = JSON.parse(JSON.stringify(DEFAULT_SQUAD_30_SLOTS));
    appState.teams = JSON.parse(JSON.stringify(DEFAULT_12_TEAMS));
    appState.soldToOthers = [];
    appState.totalPurse = 125.00;
    appState.teamName = "CHENNAI SUPER KINGS (CSK)";

    document.getElementById("totalPurseInput").value = "125.00";
    localStorage.removeItem("ipl_auction_desk_local_v3");
    localStorage.removeItem("ipl_auction_desk_local_v2");

    clearStage();
    renderAllViews();
    showToast("Application completely reset to clean state!", "warn");
  }
}

// ==========================================================
// ADD CUSTOM / UNLISTED PLAYER MODAL
// ==========================================================
function handleSaveCustomPlayer() {
  const name = document.getElementById("customPlayerName").value.trim();
  if (!name) return;

  const role = document.getElementById("customPlayerRole").value;
  const rating = parseInt(document.getElementById("customPlayerRating").value) || 80;
  const style = document.getElementById("customPlayerStyle").value.trim() || `${role} Specialist`;
  const country = document.getElementById("customPlayerCountry").value;
  const basePrice = roundToTwo(parseFloat(document.getElementById("customPlayerBasePrice").value) || 0.50);

  const newPlayer = {
    id: `custom_${Date.now()}`,
    name: name,
    country: country,
    role: role,
    detailedRole: "Custom Athlete",
    style: style,
    rating: rating,
    basePrice: basePrice,
    isCustom: true
  };

  appState.playerDirectory.unshift(newPlayer);
  closeModal("addCustomModal");
  document.getElementById("customPlayerForm").reset();

  renderPlayerDirectory();
  putPlayerOnStage(newPlayer);
  persistState();

  showToast(`Added custom athlete "${name}" directly to auction stage!`, "success");
}

// ==========================================================
// EXPORT SQUAD SUMMARY SHEET
// ==========================================================
function openExportSheet() {
  const container = document.getElementById("exportPreviewContainer");

  let totalSpent = 0;
  let filledCount = 0;
  let osCount = 0;

  let rows = "";
  appState.squadSlots.forEach(s => {
    const isFilled = s.player !== null;
    const price = roundToTwo(parseFloat(s.actualPrice) || 0);
    totalSpent += price;

    if (isFilled) {
      filledCount++;
      const isOs = s.player.country !== "India";
      if (isOs) osCount++;

      rows += `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:6px; font-weight:700;">#${s.slotNumber} ${s.isXi ? '(XI)' : ''}</td>
          <td style="padding:6px; font-weight:800;">${escapeHtml(s.player.name)}</td>
          <td style="padding:6px;">${s.player.role}</td>
          <td style="padding:6px;">★ ${s.player.rating}/100</td>
          <td style="padding:6px;">${isOs ? '✈️ OS' : '🇮🇳 Ind'}</td>
          <td style="padding:6px; text-align:right; font-weight:800; font-family:var(--font-mono);">₹${price.toFixed(2)} Cr</td>
        </tr>
      `;
    } else {
      rows += `
        <tr style="border-bottom:1px solid #f1f5f9; color:#94a3b8;">
          <td style="padding:6px;">#${s.slotNumber} ${s.isXi ? '(XI)' : ''}</td>
          <td style="padding:6px; font-style:italic;">— Empty Slot —</td>
          <td style="padding:6px;">${escapeHtml(s.targetRole)}</td>
          <td style="padding:6px;">—</td>
          <td style="padding:6px;">—</td>
          <td style="padding:6px; text-align:right; font-family:var(--font-mono);">₹${price.toFixed(2)} Cr</td>
        </tr>
      `;
    }
  });

  totalSpent = roundToTwo(totalSpent);
  const remaining = roundToTwo(appState.totalPurse - totalSpent);

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
      <div>
        <h2 style="font-size:1.4rem; font-weight:800; color:#0f172a;">${escapeHtml(appState.teamName)}</h2>
        <div style="font-size:0.8rem; color:#64748b;">IPL Mega Auction 2027 • Official Squad Sheet</div>
      </div>
      <div style="font-family:var(--font-mono); font-weight:800; font-size:1rem; background:#f1f5f9; padding:6px 12px; border-radius:6px;">
        Starting Purse: ₹${appState.totalPurse.toFixed(2)} Cr
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:0.82rem; margin-bottom:14px;">
      <thead>
        <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; text-align:left;">
          <th style="padding:6px;">Slot</th>
          <th style="padding:6px;">Player</th>
          <th style="padding:6px;">Role</th>
          <th style="padding:6px;">Rating /100</th>
          <th style="padding:6px;">Category</th>
          <th style="padding:6px; text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <div style="background:#f1f5f9; padding:12px; border-radius:8px; display:flex; justify-content:space-between; font-size:0.84rem; font-weight:700;">
      <div>
        <span>Squad: ${filledCount}/30 Players | Overseas: ${osCount}/8</span>
      </div>
      <div>
        <span>Spent: ₹${totalSpent.toFixed(2)} Cr | Balance: <span style="color:${remaining >= 0 ? '#10b981' : '#ef4444'}">₹${remaining.toFixed(2)} Cr</span></span>
      </div>
    </div>
  `;

  openModal("exportModal");
}

function copySummaryForWhatsApp() {
  let text = `🏏 *${appState.teamName}* - IPL 2027 Squad Sheet\n`;
  text += `💰 Starting Purse: ₹${appState.totalPurse.toFixed(2)} Cr\n`;
  text += `--------------------------------------\n`;

  let totalSpent = 0;
  let osCount = 0;

  appState.squadSlots.forEach(s => {
    const price = roundToTwo(parseFloat(s.actualPrice) || 0);
    totalSpent += price;
    if (s.player) {
      if (s.player.country !== "India") osCount++;
      text += `#${s.slotNumber} ${s.player.name} (${s.player.role}, ★${s.player.rating}) - ₹${price.toFixed(2)} Cr ${s.player.country !== "India" ? '[✈️ OS]' : ''}\n`;
    }
  });

  totalSpent = roundToTwo(totalSpent);
  const remaining = roundToTwo(appState.totalPurse - totalSpent);
  text += `--------------------------------------\n`;
  text += `⚡ Total Spent: ₹${totalSpent.toFixed(2)} Cr\n`;
  text += `💵 Remaining Purse: ₹${remaining.toFixed(2)} Cr\n`;
  text += `✈️ Overseas Players: ${osCount}/8\n`;

  navigator.clipboard.writeText(text).then(() => {
    showToast("Summary copied to clipboard for WhatsApp!", "success");
  }).catch(() => {
    showToast("Copied text ready", "warn");
  });
}

// Modal & Toast Helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  }
}

function showToast(msg, type = "success") {
  const c = document.getElementById("toastNotification");
  const t = document.createElement("div");
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

function renderAllViews() {
  renderSquadSlots();
  renderPlayerDirectory();
  render12TeamsGrid();
  renderSoldOtherTable();
  recalculatePurseAndMetrics();
}
