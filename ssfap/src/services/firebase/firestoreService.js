/**
 * ============================================================================
 * SPRING SPARROW FINANCIAL ADVISOR (SSFAP)
 * ============================================================================
 * 
 * Service: Firestore Service
 * Version: 1.2.0
 * Last Updated: 2026-03-10
 * 
 * PURPOSE:
 * Provides CRUD (Create, Read, Update, Delete) operations for financial data
 * stored in Firestore. All database interactions go through this service.
 * 
 * BUSINESS CONTEXT:
 * This is the data layer for Spring Sparrow's financial tracking. Handles:
 * - Adding bookings (STR/MTR)
 * - Updating bookings (edit existing reservations)
 * - Deleting bookings (cancel reservations)
 * - Recording expenses (cleaning, maintenance, supplies)
 * - Tracking account balances
 * - Querying monthly performance
 * - Tax tracking (12.5% Pierce County STR tax)
 * 
 * ARCHITECTURE:
 * - Pure functions (no side effects)
 * - Always requires userId (security via Firestore rules)
 * - Returns Promises (async operations)
 * - Throws errors (caller handles them)
 * 
 * CHANGELOG v1.2.0:
 * - ADDED: updateBooking() - Edit existing bookings
 * - ADDED: deleteBooking() - Delete single booking
 * - ADDED: calculateTotalTaxCollected() - Sum STR tax for reporting
 * - IMPROVED: Comprehensive inline documentation
 * 
 * ============================================================================
 */

// ============================================================================
// FIREBASE IMPORTS
// ============================================================================

import { 
  collection,   // Reference to a collection of documents
  doc,          // Reference to a single document
  addDoc,       // Add new document with auto-generated ID
  getDoc,       // Get single document by ID
  getDocs,      // Get multiple documents from a query
  updateDoc,    // Update existing document
  deleteDoc,    // Delete document
  query,        // Build a query
  where,        // Filter query by field value
  orderBy,      // Sort query results
  Timestamp     // Firebase timestamp type
} from 'firebase/firestore';

import { db } from '../../firebase/firebaseConfig.js';

/**
 * TYPE DEFINITIONS
 * These come from dataModels.js and provide IntelliSense/autocomplete
 * @typedef {import('./dataModels').Booking} Booking
 * @typedef {import('./dataModels').Expense} Expense
 * @typedef {import('./dataModels').AccountBalance} AccountBalance
 */

// ============================================================================
// BOOKINGS - CREATE, READ, UPDATE, DELETE
// ============================================================================

/**
 * Add a new booking to Firestore.
 * 
 * BUSINESS LOGIC:
 * - Converts JavaScript Date objects to Firestore Timestamps
 * - Auto-generates document ID
 * - Adds createdAt timestamp for tracking
 * - Returns the new booking ID for reference
 * 
 * @param {string} userId - Current user's ID (from Firebase Auth)
 * @param {Booking} bookingData - Booking information
 * @returns {Promise<string>} Document ID of created booking
 * 
 * EXAMPLE:
 * const bookingId = await addBooking(userId, {
 *   unitId: 'robins-roost',
 *   type: 'STR',
 *   checkIn: new Date('2026-03-15'),
 *   checkOut: new Date('2026-03-18'),
 *   nights: 3,
 *   grossPayout: 450,
 *   platform: 'Airbnb',
 *   platformFee: 67.50,
 *   cleaningCost: 150,
 *   localTax: 56.25,        // 12.5% Pierce County tax
 *   netIncome: 232.50,
 *   month: '2026-03',
 * });
 */
export async function addBooking(userId, bookingData) {
  try {
    // Get reference to user's bookings collection
    // Path: users/{userId}/bookings
    const bookingsRef = collection(db, 'users', userId, 'bookings');
    
    // Add document with auto-generated ID
    const docRef = await addDoc(bookingsRef, {
      ...bookingData,
      // Convert JavaScript Dates to Firestore Timestamps
      // (Firestore doesn't understand native JS Date objects)
      checkIn: Timestamp.fromDate(bookingData.checkIn),
      checkOut: Timestamp.fromDate(bookingData.checkOut),
      createdAt: Timestamp.now(),  // Track when booking was added
    });
    
    console.log('✅ Booking added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding booking:', error);
    throw error;  // Re-throw so caller can handle
  }
}

/**
 * Update an existing booking in Firestore.
 * 
 * BUSINESS LOGIC:
 * - Updates existing document by ID
 * - Converts JavaScript Date objects to Firestore Timestamps
 * - Adds updatedAt timestamp to track last edit
 * - Preserves createdAt timestamp
 * 
 * USE CASES:
 * - Guest extends stay (change checkOut date)
 * - Platform fee correction
 * - Pet fees added after booking
 * - Damage protection added/removed
 * 
 * @param {string} userId - Current user's ID
 * @param {string} bookingId - Booking document ID to update
 * @param {Booking} bookingData - Updated booking information
 * @returns {Promise<void>}
 * 
 * EXAMPLE:
 * await updateBooking(userId, 'abc123', {
 *   checkOut: new Date('2026-03-20'),  // Extended stay
 *   nights: 5,                          // Updated night count
 *   netIncome: 350,                     // Recalculated income
 * });
 */
export async function updateBooking(userId, bookingId, bookingData) {
  try {
    // Get reference to specific booking document
    // Path: users/{userId}/bookings/{bookingId}
    const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
    
    // Update document with new data
    await updateDoc(bookingRef, {
      ...bookingData,
      // Convert JavaScript Dates to Firestore Timestamps
      checkIn: Timestamp.fromDate(bookingData.checkIn),
      checkOut: Timestamp.fromDate(bookingData.checkOut),
      updatedAt: Timestamp.now(),  // Track when booking was last edited
    });
    
    console.log('✅ Booking updated:', bookingId);
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    throw error;
  }
}

/**
 * Get all bookings for a specific month.
 * 
 * BUSINESS LOGIC:
 * - Filters by month string (e.g., "2026-03")
 * - Sorts by check-in date (newest first)
 * - Converts Firestore Timestamps back to JavaScript Dates
 * - Returns array of booking objects
 * 
 * WHY MONTH FILTERING:
 * - Dashboard shows one month at a time
 * - Performance: Only fetch needed data
 * - Month-over-month comparisons
 * 
 * @param {string} userId - Current user's ID
 * @param {string} month - Month string (e.g., "2026-03")
 * @returns {Promise<Booking[]>} Array of bookings
 * 
 * EXAMPLE:
 * const marchBookings = await getBookingsByMonth(userId, '2026-03');
 * // Returns: [{ id: 'abc123', unitId: 'robins-roost', ... }, ...]
 */
export async function getBookingsByMonth(userId, month) {
  try {
    // Get reference to user's bookings collection
    const bookingsRef = collection(db, 'users', userId, 'bookings');
    
    // Build query with filters and sorting
    const q = query(
      bookingsRef, 
      where('month', '==', month),       // Filter: Only this month
      orderBy('checkIn', 'desc')         // Sort: Newest first
    );
    
    // Execute query
    const snapshot = await getDocs(q);
    
    // Convert Firestore documents to JavaScript objects
    return snapshot.docs.map(doc => ({
      id: doc.id,              // Document ID
      ...doc.data(),           // All booking fields
      // Convert Firestore Timestamps back to JavaScript Dates
      checkIn: doc.data().checkIn?.toDate(),
      checkOut: doc.data().checkOut?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    throw error;
  }
}

/**
 * Delete a single booking.
 * 
 * BUSINESS LOGIC:
 * - Permanently removes booking from Firestore
 * - Cannot be undone (consider soft deletes for production)
 * 
 * USE CASES:
 * - Guest cancels reservation
 * - Duplicate booking entry
 * - Test data cleanup
 * 
 * @param {string} userId - Current user's ID
 * @param {string} bookingId - Booking document ID to delete
 * @returns {Promise<void>}
 * 
 * EXAMPLE:
 * await deleteBooking(userId, 'abc123');
 */
export async function deleteBooking(userId, bookingId) {
  try {
    // Get reference to specific booking document
    const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
    
    // Delete document permanently
    await deleteDoc(bookingRef);

    console.log('✅ Deleted booking:', bookingId);
  } catch (error) {
    console.error('❌ Error deleting booking:', error);
    throw error;
  }
}

/**
 * Delete ALL bookings (for testing/reset purposes).
 * 
 * ⚠️ WARNING: This permanently deletes all booking data!
 * Use only when resetting to start fresh with real data.
 * 
 * BUSINESS LOGIC:
 * - Fetches all bookings (no filters)
 * - Deletes them in parallel for speed
 * - Returns count of deleted bookings
 * 
 * @param {string} userId - Current user's ID
 * @returns {Promise<number>} Number of bookings deleted
 * 
 * EXAMPLE:
 * const count = await deleteAllBookings(userId);
 * console.log(`Deleted ${count} bookings`);
 */
export async function deleteAllBookings(userId) {
  try {
    // Get reference to all bookings
    const bookingsRef = collection(db, 'users', userId, 'bookings');
    const snapshot = await getDocs(bookingsRef);
    
    let deleteCount = 0;
    const deletePromises = [];
    
    // Queue up all delete operations
    snapshot.docs.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
      deleteCount++;
    });
    
    // Execute all deletes in parallel
    await Promise.all(deletePromises);
    
    console.log(`✅ Deleted ${deleteCount} bookings`);
    return deleteCount;
  } catch (error) {
    console.error('❌ Error deleting all bookings:', error);
    throw error;
  }
}

// ============================================================================
// EXPENSES (Cleaning, Maintenance, Supplies, etc.)
// ============================================================================

/**
 * Add a new expense to Firestore.
 * 
 * BUSINESS LOGIC:
 * - Records operational expenses
 * - Categorizes for budget tracking
 * - Links to specific unit (or null for general expenses)
 * 
 * EXPENSE CATEGORIES:
 * - Cleaning (turnover cleaning, deep cleaning)
 * - Maintenance (repairs, fixes)
 * - Supplies (toiletries, linens)
 * - Utilities (electric, water, internet)
 * - Other (misc expenses)
 * 
 * @param {string} userId - Current user's ID
 * @param {Expense} expenseData - Expense information
 * @returns {Promise<string>} Document ID of created expense
 * 
 * EXAMPLE:
 * const expenseId = await addExpense(userId, {
 *   category: 'Cleaning',
 *   amount: 150,
 *   unitId: 'robins-roost',
 *   date: new Date('2026-03-15'),
 *   notes: 'Turnover cleaning after 3-night stay',
 *   month: '2026-03',
 * });
 */
export async function addExpense(userId, expenseData) {
  try {
    // Get reference to user's expenses collection
    const expensesRef = collection(db, 'users', userId, 'expenses');
    
    // Add document with auto-generated ID
    const docRef = await addDoc(expensesRef, {
      ...expenseData,
      date: Timestamp.fromDate(expenseData.date),
      createdAt: Timestamp.now(),
    });
    
    console.log('✅ Expense added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding expense:', error);
    throw error;
  }
}

/**
 * Get all expenses for a specific month.
 * 
 * BUSINESS LOGIC:
 * - Filters by month string
 * - Sorts by date (newest first)
 * - Returns array of expense objects
 * 
 * USE CASES:
 * - Monthly expense reports
 * - Budget vs actual tracking
 * - Category breakdown
 * 
 * @param {string} userId - Current user's ID
 * @param {string} month - Month string (e.g., "2026-03")
 * @returns {Promise<Expense[]>} Array of expenses
 */
export async function getExpensesByMonth(userId, month) {
  try {
    const expensesRef = collection(db, 'users', userId, 'expenses');
    const q = query(
      expensesRef,
      where('month', '==', month),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
  } catch (error) {
    console.error('❌ Error fetching expenses:', error);
    throw error;
  }
}

// ============================================================================
// ACCOUNT BALANCES (Operating, CapEx, Distributions, etc.)
// ============================================================================

/**
 * Update account balance.
 * 
 * BUSINESS LOGIC:
 * - Syncs Baselane account balances to Firebase
 * - Tracks balance changes over time
 * - Used for financial reporting
 * 
 * SPRING SPARROW ACCOUNTS:
 * - operating: Operating Account (Checking 6894)
 * - capex-reserve: CapEx Reserves (Savings 7743)
 * - security-deposits: Client Security Deposits (Savings 7749)
 * - fixed-obligations: Fixed Obligations/Mortgage (Checking 7753)
 * - owner-distribution: Owner Distribution (balance to distribute)
 * 
 * @param {string} userId - Current user's ID
 * @param {AccountBalance} accountData - Account information
 * @returns {Promise<void>}
 * 
 * EXAMPLE:
 * await updateAccountBalance(userId, {
 *   type: 'capex-reserve',
 *   balance: 5002.98,
 * });
 */
export async function updateAccountBalance(userId, accountData) {
  try {
    // Get reference to specific account document
    // Path: users/{userId}/accounts/{accountType}
    const accountRef = doc(db, 'users', userId, 'accounts', accountData.type);
    
    // Update balance and timestamp
    await updateDoc(accountRef, {
      balance: accountData.balance,
      lastUpdated: Timestamp.now(),
    });
    
    console.log('✅ Account balance updated:', accountData.type);
  } catch (error) {
    console.error('❌ Error updating account balance:', error);
    throw error;
  }
}

/**
 * Get all account balances.
 * 
 * BUSINESS LOGIC:
 * - Fetches all account balances at once
 * - Used for dashboard display
 * - Shows total assets
 * 
 * @param {string} userId - Current user's ID
 * @returns {Promise<AccountBalance[]>} Array of account balances
 * 
 * EXAMPLE:
 * const accounts = await getAllAccountBalances(userId);
 * // Returns: [
 * //   { type: 'operating', balance: 1064.16, lastUpdated: Date },
 * //   { type: 'capex-reserve', balance: 5002.98, lastUpdated: Date },
 * //   ...
 * // ]
 */
export async function getAllAccountBalances(userId) {
  try {
    const accountsRef = collection(db, 'users', userId, 'accounts');
    const snapshot = await getDocs(accountsRef);
    
    return snapshot.docs.map(doc => ({
      type: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate(),
    }));
  } catch (error) {
    console.error('❌ Error fetching account balances:', error);
    throw error;
  }
}

// ============================================================================
// TAX TRACKING (Pierce County STR Tax - 12.5%)
// ============================================================================

/**
 * Calculate total tax collected from bookings.
 * 
 * BUSINESS LOGIC:
 * - Only STR bookings have tax (12.5% Pierce County)
 * - MTR bookings are exempt (long-term rentals)
 * - Sums localTax field from all STR bookings
 * 
 * USE CASES:
 * - Quarterly tax reporting (due Apr 30, Jul 31, Oct 31, Jan 31)
 * - Dashboard "Tax Obligations" card
 * - Year-to-date tax tracking
 * 
 * @param {Booking[]} bookings - Array of bookings
 * @returns {number} Total tax collected
 * 
 * EXAMPLE:
 * const allBookings = await getBookingsByMonth(userId, '2026-03');
 * const taxCollected = calculateTotalTaxCollected(allBookings);
 * console.log(`Tax collected in March: $${taxCollected}`);
 * // Output: Tax collected in March: $126.25
 */
export function calculateTotalTaxCollected(bookings) {
  return bookings
    .filter(b => b.type === 'STR')  // Only STR bookings have tax
    .reduce((sum, b) => sum + (b.localTax || 0), 0);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current month string in YYYY-MM format.
 * 
 * BUSINESS LOGIC:
 * - Used for filtering bookings/expenses by month
 * - Matches Firebase month field format
 * - Always zero-padded (e.g., "2026-03" not "2026-3")
 * 
 * @returns {string} Current month (e.g., "2026-03")
 * 
 * EXAMPLE:
 * const currentMonth = getCurrentMonth();
 * console.log(currentMonth);  // "2026-03"
 */
export function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * EXAMPLE 1: Add a new STR booking
 * 
 * import { addBooking, getCurrentMonth } from './services/firebase/firestoreService';
 * import { auth } from './firebase/firebaseConfig';
 * 
 * const userId = auth.currentUser.uid;
 * const bookingId = await addBooking(userId, {
 *   unitId: 'robins-roost',
 *   type: 'STR',
 *   checkIn: new Date('2026-03-15'),
 *   checkOut: new Date('2026-03-18'),
 *   nights: 3,
 *   grossPayout: 450,
 *   platform: 'Airbnb',
 *   platformFee: 67.50,
 *   cleaningCost: 150,
 *   localTax: 56.25,        // Auto-calculated 12.5%
 *   netIncome: 232.50,
 *   month: getCurrentMonth(),
 * });
 * console.log('Booking created:', bookingId);
 */

/**
 * EXAMPLE 2: Get bookings for current month
 * 
 * const currentMonth = getCurrentMonth();
 * const bookings = await getBookingsByMonth(userId, currentMonth);
 * console.log(`Found ${bookings.length} bookings for ${currentMonth}`);
 */

/**
 * EXAMPLE 3: Update a booking (guest extends stay)
 * 
 * await updateBooking(userId, 'abc123', {
 *   checkOut: new Date('2026-03-20'),  // Extended from Mar 18 to Mar 20
 *   nights: 5,                          // Updated from 3 to 5 nights
 *   grossPayout: 750,                   // Recalculated
 *   localTax: 93.75,                    // Recalculated 12.5%
 *   netIncome: 506.25,                  // Recalculated
 * });
 */

/**
 * EXAMPLE 4: Calculate quarterly tax
 * 
 * // Get all Q1 bookings (Jan, Feb, Mar)
 * const janBookings = await getBookingsByMonth(userId, '2026-01');
 * const febBookings = await getBookingsByMonth(userId, '2026-02');
 * const marBookings = await getBookingsByMonth(userId, '2026-03');
 * 
 * const allQ1Bookings = [...janBookings, ...febBookings, ...marBookings];
 * const q1Tax = calculateTotalTaxCollected(allQ1Bookings);
 * 
 * console.log(`Q1 2026 tax to remit: $${q1Tax.toFixed(2)}`);
 * // Pay Pierce County by Apr 30, 2026
 */