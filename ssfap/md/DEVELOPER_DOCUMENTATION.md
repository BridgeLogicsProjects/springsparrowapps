# 📚 SSFAP Developer Documentation
## Spring Sparrow Financial Advisor Platform

**Version:** 1.6.0  
**Last Updated:** March 10, 2026  
**Author:** Keeya Wang-Jones  
**Business:** Spring Sparrow LLC

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Component Documentation](#component-documentation)
4. [Service Layer Documentation](#service-layer-documentation)
5. [Data Models](#data-models)
6. [Business Logic](#business-logic)
7. [Development Workflow](#development-workflow)

---

## 🎯 PROJECT OVERVIEW

### **What is SSFAP?**

Spring Sparrow Financial Advisor Platform (SSFAP) is a custom financial dashboard for managing Spring Sparrow LLC's short-term rental (STR) and medium-term rental (MTR) properties in Tacoma, Washington.

### **Core Features:**
- ✅ Real-time booking management (STR/MTR)
- ✅ Revenue tracking (Actual vs Potential)
- ✅ Tax tracking (12.5% Pierce County STR tax)
- ✅ Unit performance monitoring
- ✅ CapEx reserve tracking
- ✅ Owner distribution calculations
- ✅ Firebase real-time sync
- ✅ Google Sign-In authentication
- ✅ Demo mode for presentations

### **Tech Stack:**
- **Frontend:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Icons:** Lucide React
- **Charts:** Recharts (future)

---

## 🏗️ ARCHITECTURE

### **Folder Structure:**
```
ssfap/
├── src/
│   ├── components/          # React components
│   │   ├── BookingForm.jsx           # Add/edit bookings
│   │   ├── UnitDetailModal.jsx       # Unit performance detail
│   │   ├── BreakdownModal.jsx        # STR vs MTR breakdown
│   │   ├── AllBookingsModal.jsx      # All bookings table
│   │   ├── SignInModal.jsx           # Google Sign-In
│   │   └── TestButton.jsx            # Firebase test utilities
│   ├── services/
│   │   └── firebase/
│   │       ├── firestoreService.js   # Database operations
│   │       └── dataModels.js         # Type definitions
│   ├── firebase/
│   │   └── firebaseConfig.js         # Firebase initialization
│   ├── assets/               # Images, thumbnails
│   ├── App.jsx               # Main dashboard
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── public/                   # Static assets
├── .env.local               # Firebase credentials (gitignored)
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
└── tailwind.config.js       # Tailwind customization
```

### **Data Flow:**
```
User Action
    ↓
React Component
    ↓
firestoreService.js (Business Logic)
    ↓
Firebase Firestore (Database)
    ↓
Real-time Listener Updates UI
```

---

## 📦 COMPONENT DOCUMENTATION

### **1. App.jsx** - Main Dashboard

**Purpose:** Primary dashboard showing Spring Sparrow's financial overview

**Key Features:**
- CapEx Reserve progress (target: $20,000 by Dec 31, 2026)
- Monthly Net Income tracking
- Unit performance cards (3 units)
- Owner distributions
- Action items
- Month selector
- Demo mode toggle
- Google Sign-In integration

**State Management:**
```javascript
const [bookings, setBookings] = useState([]);        // All bookings
const [selectedMonth, setSelectedMonth] = useState('2026-03');
const [demoMode, setDemoMode] = useState(false);     // Demo vs real data
const [user, setUser] = useState(null);              // Firebase Auth user
const [showUnitDetail, setShowUnitDetail] = useState(false);
```

**Business Logic:**
- Fetches bookings from Firebase on mount
- Calculates metrics (nights, revenue, occupancy)
- Filters bookings by selected month
- Demo mode loads mock data (6 bookings)

**Props:** None (root component)

**Events:**
- `handleAddBooking(unitId)` - Opens booking form
- `handleUnitClick(unit)` - Opens unit detail modal
- `handleToggleDemo()` - Switches demo mode on/off

---

### **2. BookingForm.jsx** - Add/Edit Bookings

**Purpose:** Comprehensive form for creating or editing STR/MTR bookings

**Props:**
```javascript
{
  unitId: 'robins-roost',           // Pre-select unit
  onClose: () => void,               // Close modal callback
  onSuccess: () => void,             // Success callback (refresh data)
  existingBooking: Booking | null    // Edit mode: existing booking data
}
```

**Modes:**
- **Create Mode:** `existingBooking` is null
- **Edit Mode:** `existingBooking` has data, form pre-fills

**Key Features:**
- STR vs MTR toggle
- Auto-calculate duration (nights/months)
- Auto-calculate Pierce County tax (12.5% for STR)
- Auto-calculate net income
- MTR: Damage protection, pet fees, security deposits
- Real-time validation

**Business Logic:**
```javascript
// STR Net Income
netIncome = grossPayout - platformFee - cleaningCost

// MTR Net Income
totalRevenue = (baseRent + damageProtection + petFees) * months + petDeposit
netIncome = totalRevenue - platformFee - moveOutCleaning

// Tax (STR only)
localTax = grossPayout * 0.125  // 12.5% Pierce County
```

**State:**
```javascript
const [bookingType, setBookingType] = useState('STR');
const [formData, setFormData] = useState({
  unitId, checkIn, checkOut, platform,
  grossPayout, platformFee, cleaningCost, localTax,
  // MTR-specific
  baseMonthlyRent, damageProtection, hasPets, petCount, ...
});
const [calculated, setCalculated] = useState({
  nights, months, displayText, netIncome
});
```

---

### **3. UnitDetailModal.jsx** - Unit Performance Detail

**Purpose:** Detailed revenue breakdown with Actual vs Potential calculations

**Props:**
```javascript
{
  unit: {
    id: 'robins-roost',
    name: "Robin's Roost",
    nights: 12,
    netIncome: 978,
    target: 15
  },
  bookings: Booking[],      // Unit's bookings for selected month
  onClose: () => void,
  currentMonth: '2026-03'
}
```

**Key Features:**
- **Actual vs Potential Revenue** (critical for MTR!)
- Revenue breakdown table
- Occupancy stats
- Tax collected column
- Status indicators (Paid ✅ / Ongoing ⏳)

**Business Logic - Actual vs Potential:**
```javascript
// For STR bookings
actual = netIncome        // 100% paid upfront
potential = 0

// For MTR bookings
const today = new Date();
const elapsedDays = Math.min(daysFromCheckIn, totalDays);
const remainingDays = totalDays - elapsedDays;
const dailyRate = netIncome / totalDays;

actual = elapsedDays * dailyRate      // Already received
potential = remainingDays * dailyRate  // Future payments
```

**Why This Matters:**
- **MTR guests pay month-by-month**
- Don't overspend based on uncommitted future income
- Only distribute from ACTUAL revenue
- Critical for cash flow management

---

### **4. BreakdownModal.jsx** - STR vs MTR Breakdown

**Purpose:** Shows revenue split between STR and MTR bookings

**Props:**
```javascript
{
  bookings: Booking[],      // All bookings for period
  onClose: () => void
}
```

**Key Features:**
- Time period selector (YTD, Last 6 months, individual months)
- STR vs MTR comparison cards
- Detailed booking table
- Percentage breakdown

**Metrics Calculated:**
```javascript
const strStats = {
  count: strBookings.length,
  nights: sum(strBookings.nights),
  netIncome: sum(strBookings.netIncome),
};

const mtrStats = {
  count: mtrBookings.length,
  days: sum(mtrBookings.nights),
  netIncome: sum(mtrBookings.netIncome),
};

const percentageSTR = (strStats.netIncome / totalIncome) * 100;
```

---

### **5. SignInModal.jsx** - Google Authentication

**Purpose:** Google Sign-In flow for Firebase Authentication

**Props:**
```javascript
{
  onClose: () => void,
  onSuccess: (user) => void
}
```

**Flow:**
1. User clicks "Sign in with Google"
2. Google popup opens
3. User selects Google account
4. Firebase creates/logs in user
5. `onSuccess` callback with user object
6. Modal closes

**Error Handling:**
- Popup blocked by browser
- User cancels sign-in
- Network error
- Firebase auth error

---

## 🔧 SERVICE LAYER DOCUMENTATION

### **firestoreService.js** - Database Operations

**Purpose:** All Firestore database interactions

**Functions:**

#### **Bookings:**
```javascript
addBooking(userId, bookingData)           // Create new booking
updateBooking(userId, bookingId, data)    // Update existing booking
deleteBooking(userId, bookingId)          // Delete single booking
deleteAllBookings(userId)                 // Delete all (testing only)
getBookingsByMonth(userId, month)         // Get bookings for month
```

#### **Expenses:**
```javascript
addExpense(userId, expenseData)           // Record expense
getExpensesByMonth(userId, month)         // Get monthly expenses
```

#### **Accounts:**
```javascript
updateAccountBalance(userId, accountData)  // Sync Baselane balances
getAllAccountBalances(userId)             // Get all account balances
```

#### **Tax:**
```javascript
calculateTotalTaxCollected(bookings)      // Sum STR tax for reporting
```

#### **Helpers:**
```javascript
getCurrentMonth()                         // Returns "2026-03" format
```

**Data Conversions:**
```javascript
// JavaScript Date → Firestore Timestamp (when saving)
checkIn: Timestamp.fromDate(new Date('2026-03-15'))

// Firestore Timestamp → JavaScript Date (when reading)
checkIn: doc.data().checkIn?.toDate()
```

---

### **firebaseConfig.js** - Firebase Initialization

**Purpose:** Configure and initialize Firebase connection

**Environment Variables Required (.env.local):**
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

**Exports:**
```javascript
export const auth = getAuth(app);      // Firebase Authentication
export const db = getFirestore(app);   // Firestore Database
export default app;                     // Firebase App instance
```

---

## 📊 DATA MODELS

### **Booking Model:**
```javascript
{
  id: 'abc123',                    // Firestore document ID
  unitId: 'robins-roost',          // Which property
  type: 'STR' | 'MTR',            // Booking type
  checkIn: Date,                   // Start date
  checkOut: Date,                  // End date
  nights: 3,                       // Number of nights (or days for MTR)
  grossPayout: 450,                // Total payout from platform
  platform: 'Airbnb',              // Airbnb, Vrbo, Furnished Finder, Direct
  platformFee: 67.50,              // Platform commission
  cleaningCost: 150,               // Turnover cleaning cost
  localTax: 56.25,                 // Pierce County STR tax (12.5%, STR only)
  netIncome: 232.50,               // Gross - fees - cleaning
  month: '2026-03',                // Month string for filtering
  createdAt: Date,                 // When booking was added
  
  // MTR-specific (optional)
  baseMonthlyRent: 2000,
  securityDeposit: 500,
  damageProtection: 80,
  hasPets: true,
  petCount: 1,
  petFeePerMonth: 50,
  petDeposit: 250,
}
```

### **Expense Model:**
```javascript
{
  id: 'xyz789',
  category: 'Cleaning' | 'Maintenance' | 'Supplies' | 'Utilities' | 'Other',
  amount: 150,
  unitId: 'robins-roost' | null,   // Null for general expenses
  date: Date,
  notes: 'Turnover cleaning',
  month: '2026-03',
  createdAt: Date,
}
```

### **Account Balance Model:**
```javascript
{
  type: 'operating' | 'capex-reserve' | 'security-deposits' | 
        'fixed-obligations' | 'owner-distribution',
  balance: 5002.98,
  lastUpdated: Date,
}
```

---

## 💼 BUSINESS LOGIC

### **Spring Sparrow Units:**
1. **Robin's Roost** (owned, Sheridan duplex)
2. **Dove's Den** (owned, Sheridan duplex)
3. **Stadium District** (arbitrage, lease expires Sep 2026)

### **Financial Accounts (Baselane):**
```
Operating Account (6894):        $1,064.16
CapEx Reserves (7743):           $5,002.98 (target: $20,000)
Security Deposits (7749):        $500.14
Fixed Obligations (7753):        $50.01
Owner Distribution:              $0.00
```

### **Revenue Tracking:**

**STR (Short-Term Rental):**
- Airbnb/Vrbo bookings
- Nightly rates (PriceLabs auto-pricing)
- 12.5% Pierce County lodging tax
- Paid upfront (100% actual revenue)
- Cleaning fee: $99 per stay

**MTR (Medium-Term Rental):**
- Furnished Finder or direct outreach
- 1-6 month contracts
- No lodging tax (long-term rental exempt)
- Monthly payments (Actual vs Potential tracking critical!)
- Move-out cleaning: $350
- Optional: Damage protection ($80/month), pet fees

### **Tax Obligations:**
- **Pierce County STR Tax:** 12.5%
- **Quarterly Due Dates:** Apr 30, Jul 31, Oct 31, Jan 31
- **Calculation:** Sum all `localTax` fields from STR bookings
- **Payment:** Via Pierce County tax portal

### **Actual vs Potential (MTR Revenue):**

**The Problem:**
```
MTR Contract: $6,000 for 3 months
Month 1 Today: Only $2,000 received
MISTAKE: Thinking you have $6,000 to spend ❌
CORRECT: Only $2,000 is actual (in bank) ✅
```

**The Solution:**
```
Actual = Days elapsed × daily rate (money in hand)
Potential = Days remaining × daily rate (future payments)

Only spend/distribute from ACTUAL revenue!
```

---

## 🛠️ DEVELOPMENT WORKFLOW

### **Local Development:**
```bash
# Start dev server
npm run dev

# Open browser
http://localhost:5173/

# Build for production
npm run build

# Preview production build
npm run preview
```

### **Firebase Deployment:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (first time only)
firebase init

# Deploy to Firebase Hosting
firebase deploy
```

### **Git Workflow:**
```bash
# Create feature branch
git checkout -b feature/tax-tracking

# Make changes, commit
git add .
git commit -m "Add Pierce County tax tracking"

# Push to GitHub
git push origin feature/tax-tracking

# Merge to main (after testing)
git checkout main
git merge feature/tax-tracking
git push origin main
```

### **Testing Checklist:**

**Before Committing:**
- [ ] No console errors in browser DevTools
- [ ] No errors in terminal (npm run dev)
- [ ] Firebase data saves correctly
- [ ] All modals open/close properly
- [ ] Month selector works
- [ ] Demo mode toggles correctly
- [ ] Tax auto-calculates (STR bookings)
- [ ] Actual vs Potential shows correctly (MTR bookings)

**Before Deploying:**
- [ ] Test with real Firebase data
- [ ] Test Google Sign-In flow
- [ ] Test on mobile (responsive design)
- [ ] Check all calculations (revenue, tax, nights)
- [ ] Verify Baselane account sync
- [ ] Test month-over-month navigation

---

## 📝 CONVENTIONS

### **File Naming:**
- Components: PascalCase (`BookingForm.jsx`)
- Services: camelCase (`firestoreService.js`)
- Utils: camelCase (`formatCurrency.js`)
- CSS: kebab-case (`button-styles.css`)

### **Variable Naming:**
- React state: camelCase (`bookingData`)
- Constants: UPPER_SNAKE_CASE (`MAX_BOOKINGS`)
- Functions: camelCase (`calculateNetIncome`)
- Components: PascalCase (`UnitDetailModal`)

### **Code Comments:**
```javascript
// Single-line comment for brief explanation

/**
 * Multi-line JSDoc comment for functions
 * Includes params, returns, examples
 */

// ========== Section Divider ==========
// Use for major code sections
```

### **Commit Messages:**
```
feat: Add tax tracking to booking form
fix: Correct actual vs potential calculation for MTR
refactor: Simplify unit detail modal logic
docs: Update developer documentation
chore: Update dependencies
```

---

## 🚀 FUTURE ENHANCEMENTS

### **Phase 2: Tax Dashboard Card**
- YTD tax collected display
- Tax remitted tracking
- Balance due calculation
- "Mark as Paid" button
- Quarterly tax reports

### **Phase 3: Expense Tracking**
- Expense entry form
- Category budgets
- Monthly expense reports
- Budget alerts

### **Phase 4: Household Goals**
- Debt payoff tracker
- Emergency fund goals
- Joint financial planning (Keeya + Tie)

### **Phase 5: Advanced Analytics**
- Occupancy trends (Recharts)
- Revenue forecasting
- Seasonal pricing analysis
- Year-over-year comparisons

---

## 📞 SUPPORT

**Developer:** Keeya Wang-Jones  
**Email:** clients@springsparrowhousing.com  
**Business:** Spring Sparrow LLC  
**Location:** Tacoma, Washington

**Resources:**
- Firebase Console: https://console.firebase.google.com
- Baselane Banking: https://app.baselane.com
- Lodgify PMS: https://app.lodgify.com
- PriceLabs: https://app.pricelabs.co

---

**Last Updated:** March 10, 2026  
**Version:** 1.6.0  
**Status:** ✅ Production Ready

---

## 🎯 QUICK REFERENCE

### **Common Tasks:**

**Add a booking:**
```javascript
await addBooking(userId, {
  unitId: 'robins-roost',
  type: 'STR',
  checkIn: new Date('2026-03-15'),
  checkOut: new Date('2026-03-18'),
  nights: 3,
  grossPayout: 450,
  platformFee: 67.50,
  cleaningCost: 150,
  localTax: 56.25,
  netIncome: 232.50,
  month: '2026-03',
});
```

**Get current month bookings:**
```javascript
const month = getCurrentMonth();
const bookings = await getBookingsByMonth(userId, month);
```

**Calculate quarterly tax:**
```javascript
const q1Bookings = [...janBookings, ...febBookings, ...marBookings];
const taxDue = calculateTotalTaxCollected(q1Bookings);
```

**Update CapEx balance:**
```javascript
await updateAccountBalance(userId, {
  type: 'capex-reserve',
  balance: 5002.98,
});
```

---

**🎉 HAPPY CODING! 🎉**
