# IPL 2027 Mega Auction Desk (12 Franchises Edition)

A high-performance, offline application designed specifically to run locally on your laptop during your college IPL team auction event.

## 🚀 Quick Launch
Simply double-click **[`Launch_Auction_App.bat`](file:///C:/Users/ashis/.gemini/antigravity-ide/scratch/ipl-auction-hub/Launch_Auction_App.bat)** or open **[`index.html`](file:///C:/Users/ashis/.gemini/antigravity-ide/scratch/ipl-auction-hub/index.html)** in any modern browser.

---

## ⚡ Core Features & 2027 Rules Engine

### 1. 12 Franchises & Retentions Desk ("The Verdict 2027 Rules")
- **Our Team**: **Chennai Super Kings (CSK)** (🦁) with interactive Playing XI and full 30-player tactical slots.
- **11 Rival Franchises**: Mumbai Indians (MI), Royal Challengers Bengaluru (RCB), Kolkata Knight Riders (KKR), Sunrisers Hyderabad (SRH), Rajasthan Royals (RR), Gujarat Titans (GT), Lucknow Super Giants (LSG), Delhi Capitals (DC), Punjab Kings (PBKS), plus expansion franchises **Kochi Tuskers Kerala (KTK)** and **Pune Warriors India (PWI)**.
- **Starting Purse**: **₹125.00 Crore** per team.
- **Max 5 Retentions**:
  - **1st Slot**: ₹18.00 Cr (Capped)
  - **2nd Slot**: ₹14.00 Cr (Capped)
  - **3rd Slot**: ₹11.00 Cr (Capped)
  - **4th Slot**: ₹18.00 Cr (Capped) / ₹8.00 Cr (Uncapped)
  - **5th Slot**: ₹14.00 Cr (Capped) / ₹4.00 Cr (Uncapped)
- **Automatic RTM Card Calculation**:
  - Any unused retention slot converts 1:1 into an **RTM (Right to Match)** card (up to 5 total).
  - e.g., 3 Retentions = 2 RTM Cards Available.
- **Dynamic Purse Deduction**: All retentions automatically deduct from the team's ₹125 Cr starting purse.

### 2. Live Auction Hammer Stage with 12-Franchise Target Bidding
- Put any player on auction by clicking or searching in the directory.
- Two live decision routes:
  1. **`✅ BOUGHT BY OUR TEAM`**: Assigns to selected slot in our 30-player roster and deducts from our purse.
  2. **`❌ SELL TO RIVAL FRANCHISE`**:
     - Quick 1-click franchise pills (CSK, MI, RCB, etc.) or dropdown.
     - Optional **RTM Matched** checkbox (consumes 1 RTM card if available).
     - Deducts winning price directly from THAT rival team's remaining purse!

### 3. Editable Player Pricing Anytime (Error Correction)
- If you make a mistake in player pricing during the rush of an auction:
  - **In Our Squad Slots**: Edit the price input directly on any slot card or click `-0.25` / `+0.25` / `+1.00`.
  - **In Any Team's Squad Modal**: Click `📋 Full Squad` on any of the 12 franchise cards. Each player (retained or bought) has an editable `[₹ Cr]` input with instant save `✓`.
  - **In Sold to Rivals Log**: Edit sold price inline or click `Undo` to release the player back to the open pool.

### 4. Interactive Playing XI with Drag & Drop Reordering
- **Batting Order Slots 1 to 11**:
  - Distinct **XI #1** through **XI #11** batting order badges.
  - **Drag & Drop**: Grab any card using the **`⠿`** grip handle to rearrange batting order.
  - **Quick Steppers**: Click **`▲`** or **`▼`** to shift batting position up or down.
  - Drag players between Playing XI and Reserves (Slots 12 to 30) anytime.
- **IPL Composition Rules Check**:
  - Real-time indicator for **Overseas in Playing XI (Max 4 allowed)**.
  - Keepers check (Min 1 required) and Bowling options check (Min 5 required).

### 5. 318+ Rated Stars Directory & Custom Player Addition
- 318+ real IPL stars and domestic sensations with current form ratings out of 100 and base prices.
- Includes emerging stars like **Ayush Mhatre** (17-yr Mumbai Ranji ton opener), **Vaibhav Suryavanshi**, **Priyansh Arya**, **Digvesh Rathi**, **Musheer Khan**, **Angkrish Raghuvanshi**, **Urvil Patel**, **Tanush Kotian**, and **Jake Fraser-McGurk**.
- Clear status badges: `Retained by CSK`, `Sold to MI`, `In Our Squad (CSK)`, or `Available`.
- **"+ Add Unlisted Player"**: Quick modal to add college athletes or custom players during the auction.

### 6. Local Laptop Persistence & Export
- All retentions, team budgets, and squad allocations persist automatically in laptop `localStorage`.
- One-click formatted export sheet and copy for WhatsApp.
