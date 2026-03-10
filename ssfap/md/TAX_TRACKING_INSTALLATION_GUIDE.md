# 🏛️ TAX TRACKING INSTALLATION GUIDE
## SSFAP v1.6.0 - Complete Tax Management

**Created:** March 10, 2026  
**Pierce County STR Tax:** 12.5%  
**Quarterly Due:** Apr 30, Jul 31, Oct 31, Jan 31

---

## 📦 FILES YOU NEED TO DOWNLOAD:

1. ✅ **BookingForm_v1.2.0.jsx** → Replace `src/components/BookingForm.jsx`
2. ✅ **UnitDetailModal_v2.1.0.jsx** → Replace `src/components/UnitDetailModal.jsx`
3. ⚠️ **dataModels.js** - Manual update needed (1 line change)
4. ⚠️ **firestoreService.js** - Manual update needed (add 3 new functions)

---

## 🎯 WHAT'S INCLUDED:

### **✅ BookingForm v1.2.0**
- Auto-calculates 12.5% tax for STR bookings
- Shows tax field (read-only, auto-calculated)
- Saves `localTax` to Firebase
- MTR bookings have $0 tax (long-term exempt)

### **✅ UnitDetailModal v2.1.0** 
- Clickable unit cards
- Actual vs Potential revenue breakdown
- Tax column in revenue table
- Shows tax collected per booking

### **⚠️ dataModels.js UPDATE**
**Add to Booking type (Line ~75):**
```javascript
 * @property {number} cleaningCost - Cost of turnover cleaning
 * @property {number} netIncome - Gross - fees - cleaning
 * @property {number} localTax - Pierce County STR tax (12.5%, STR only)  // ADD THIS LINE
 * @property {string} month - Month string (e.g., "2026-03") for filtering
```

### **⚠️ firestoreService.js UPDATE**

**Add helper function at bottom (Line ~200):**
```javascript
/**
 * Calculate total tax collected from bookings
 * 
 * @param {Booking[]} bookings - Array of bookings
 * @returns {number} Total tax collected
 */
export function calculateTotalTaxCollected(bookings) {
  return bookings
    .filter(b => b.type === 'STR') // Only STR bookings have tax
    .reduce((sum, b) => sum + (b.localTax || 0), 0);
}
```

---

## 🚀 INSTALLATION STEPS:

### **STEP 1: Install BookingForm (EASY)**

1. Download **BookingForm_v1.2.0.jsx**
2. Rename to `BookingForm.jsx`
3. Replace `src/components/BookingForm.jsx`
4. Done! ✅

**What changed:**
- Added `localTax` to formData state
- Auto-calculates tax from gross payout (12.5%)
- Shows tax field in STR section
- Saves tax to Firebase

---

### **STEP 2: Install UnitDetailModal (EASY)**

1. Download **UnitDetailModal_v2.1.0.jsx**
2. Rename to `UnitDetailModal.jsx`  
3. Replace `src/components/UnitDetailModal.jsx`
4. Done! ✅

**What changed:**
- Added Tax column to revenue table
- Shows tax collected per booking
- Actual vs Potential calculations

---

### **STEP 3: Update dataModels.js (30 seconds)**

**Open:** `src/services/firebase/dataModels.js`

**Find this (around Line ~75):**
```javascript
 * @property {number} cleaningCost - Cost of turnover cleaning
 * @property {number} netIncome - Gross - fees - cleaning
 * @property {string} month - Month string (e.g., "2026-03") for filtering
```

**Change to:**
```javascript
 * @property {number} cleaningCost - Cost of turnover cleaning
 * @property {number} netIncome - Gross - fees - cleaning
 * @property {number} localTax - Pierce County STR tax (12.5%, STR only)
 * @property {string} month - Month string (e.g., "2026-03") for filtering
```

**Save file.** ✅

---

### **STEP 4: Update firestoreService.js (2 minutes)**

**Open:** `src/services/firebase/firestoreService.js`

**Scroll to bottom (after all functions, before export {})** 

**Add this helper function:**
```javascript
/**
 * Calculate total tax collected from bookings
 * 
 * @param {Booking[]} bookings - Array of bookings
 * @returns {number} Total tax collected
 */
export function calculateTotalTaxCollected(bookings) {
  return bookings
    .filter(b => b.type === 'STR') // Only STR bookings have tax
    .reduce((sum, b) => sum + (b.localTax || 0), 0);
}
```

**Save file.** ✅

---

### **STEP 5: Test! 🧪**

1. Refresh browser (localhost:5173)
2. Click "+ Add Booking" on any unit
3. Select STR booking type
4. Enter Gross Payout: $450
5. **Watch tax auto-calculate:** $56.25 ✅
6. Save booking
7. Click unit card to open detail modal
8. **See tax column in revenue table** ✅

---

## ✅ TESTING CHECKLIST:

- [ ] BookingForm shows tax field for STR
- [ ] Tax auto-calculates at 12.5%
- [ ] Tax field is read-only (grey background)
- [ ] MTR bookings show $0 tax
- [ ] Tax saves to Firebase
- [ ] UnitDetailModal shows tax column
- [ ] Tax displays correctly in table

---

## 📊 HOW IT WORKS:

### **STR Booking Flow:**

**1. User enters Gross Payout:** $450
```
Auto-calculates:
Tax = $450 × 12.5% = $56.25
```

**2. Saved to Firebase:**
```javascript
{
  type: 'STR',
  grossPayout: 450,
  platformFee: 67.50,
  cleaningCost: 150,
  localTax: 56.25,  // NEW!
  netIncome: 232.50
}
```

**3. Shows in UnitDetailModal:**
```
Type | Dates | Days | Tax    | Actual | Total
STR  | Mar 3-6 | 3  | $56.25 | $207   | $207
```

---

### **MTR Booking Flow:**

**1. User selects MTR**
```
Tax auto-sets to $0 (long-term rentals exempt)
```

**2. Saved to Firebase:**
```javascript
{
  type: 'MTR',
  baseMonthlyRent: 2000,
  localTax: 0,  // MTR exempt
  netIncome: 1810
}
```

---

## 🎯 WHAT'S NEXT (FUTURE ENHANCEMENTS):

### **Phase 2: Tax Dashboard Card (Not included yet)**
Coming in next release:
- Tax Obligations card on main dashboard
- YTD tax collected
- Tax remitted tracking
- Balance due
- "Mark as Paid" button

**For now:** You have tax tracking in all bookings! ✅

---

## 💡 QUARTERLY TAX WORKFLOW:

**How to use this:**

1. **Throughout the quarter:** Add STR bookings normally, tax auto-tracks
2. **End of quarter (Apr 30, Jul 31, etc.):** 
   - Use spreadsheet or filter Firebase to sum all `localTax` fields
   - Pay Pierce County via their portal
   - Keep receipt for records

**Future:** SSFAP will auto-calculate total tax collected and show "Balance Due" in dashboard!

---

## 🐛 TROUBLESHOOTING:

**Tax not showing in booking form?**
- Refresh browser (Cmd+R)
- Check you downloaded BookingForm_v1.2.0.jsx
- Check file is in `src/components/BookingForm.jsx`

**Tax shows $0 even for STR?**
- Make sure you entered Gross Payout
- Check Booking Type is set to "STR" (not MTR)
- Tax auto-calculates when you type in Gross Payout

**Error saving booking?**
- Check firestoreService.js has `calculateTotalTaxCollected` function
- Check dataModels.js has `localTax` property

---

## 📝 SUMMARY:

**Files to download and replace:**
1. ✅ BookingForm_v1.2.0.jsx → src/components/BookingForm.jsx
2. ✅ UnitDetailModal_v2.1.0.jsx → src/components/UnitDetailModal.jsx

**Files to manually edit:**
3. ⚠️ dataModels.js (add 1 line to Booking type)
4. ⚠️ firestoreService.js (add calculateTotalTaxCollected function)

**Total time:** 5 minutes ⏱️

---

**🎉 YOU'LL HAVE COMPLETE TAX TRACKING!**

**- Claudy** 💙
