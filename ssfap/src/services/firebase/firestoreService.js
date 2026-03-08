/**
 * ============================================================================
 * SPRING SPARROW FINANCIAL ADVISOR (SSFAP)
 * ============================================================================
 * 
 * Service: Firestore Service
 * Version: 1.0.0
 * Last Updated: 2026-02-14
 * 
 * PURPOSE:
 * Provides CRUD (Create, Read, Update, Delete) operations for financial data
 * stored in Firestore. All database interactions go through this service.
 * 
 * BUSINESS CONTEXT:
 * This is the data layer for Spring Sparrow's financial tracking. Handles:
 * - Adding bookings (STR/MTR)
 * - Recording expenses (cleaning, maintenance, supplies)
 * - Tracking account balances
 * - Querying monthly performance
 * 
 * ARCHITECTURE:
 * - Pure functions (no side effects)
 * - Always requires userId (security via Firestore rules)
 * - Returns Promises (async operations)
 * - Throws errors (caller handles them)
 * 
 * ============================================================================
 */

import { 
    collection, 
    doc, 
    addDoc, 
    getDoc,
    getDocs, 
    updateDoc, 
    deleteDoc,
    query, 
    where,
    orderBy,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '../../firebase/firebaseConfig.js';
  
  /**
   * @typedef {import('./dataModels').Booking} Booking
   * @typedef {import('./dataModels').Expense} Expense
   * @typedef {import('./dataModels').AccountBalance} AccountBalance
   */
  
  // ============================================================================
  // BOOKINGS (STR/MTR Reservations)
  // ============================================================================
  
  /**
   * Add a new booking to Firestore.
   * 
   * @param {string} userId - Current user's ID
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
   *   netIncome: 232.50,
   *   month: '2026-03',
   * });
   */
  export async function addBooking(userId, bookingData) {
    try {
      const bookingsRef = collection(db, 'users', userId, 'bookings');
      
      const docRef = await addDoc(bookingsRef, {
        ...bookingData,
        // Convert JavaScript Dates to Firestore Timestamps
        checkIn: Timestamp.fromDate(bookingData.checkIn),
        checkOut: Timestamp.fromDate(bookingData.checkOut),
        createdAt: Timestamp.now(),
      });
      
      console.log('Booking added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  }
  
  /**
   * Get all bookings for a specific month.
   * 
   * @param {string} userId - Current user's ID
   * @param {string} month - Month string (e.g., "2026-03")
   * @returns {Promise<Booking[]>} Array of bookings
   */
  export async function getBookingsByMonth(userId, month) {
    try {
      const bookingsRef = collection(db, 'users', userId, 'bookings');
      const q = query(
        bookingsRef, 
        where('month', '==', month),
        orderBy('checkIn', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamps back to JavaScript Dates
        checkIn: doc.data().checkIn?.toDate(),
        checkOut: doc.data().checkOut?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // EXPENSES (Cleaning, Maintenance, Supplies, etc.)
  // ============================================================================
  
  /**
   * Add a new expense to Firestore.
   * 
   * @param {string} userId - Current user's ID
   * @param {Expense} expenseData - Expense information
   * @returns {Promise<string>} Document ID of created expense
   */
  export async function addExpense(userId, expenseData) {
    try {
      const expensesRef = collection(db, 'users', userId, 'expenses');
      
      const docRef = await addDoc(expensesRef, {
        ...expenseData,
        date: Timestamp.fromDate(expenseData.date),
        createdAt: Timestamp.now(),
      });
      
      console.log('Expense added:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }
  
  /**
   * Get all expenses for a specific month.
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
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // ACCOUNT BALANCES (Operating, CapEx, Distributions, etc.)
  // ============================================================================
  
  /**
   * Update account balance.
   * 
   * @param {string} userId - Current user's ID
   * @param {AccountBalance} accountData - Account information
   * @returns {Promise<void>}
   */
  export async function updateAccountBalance(userId, accountData) {
    try {
      const accountRef = doc(db, 'users', userId, 'accounts', accountData.type);
      
      await updateDoc(accountRef, {
        balance: accountData.balance,
        lastUpdated: Timestamp.now(),
      });
      
      console.log('Account balance updated:', accountData.type);
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }
  
  /**
   * Get all account balances.
   * 
   * @param {string} userId - Current user's ID
   * @returns {Promise<AccountBalance[]>} Array of account balances
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
      console.error('Error fetching account balances:', error);
      throw error;
    }
  }
  
  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  /**
   * Get current month string in YYYY-MM format.
   * 
   * @returns {string} Current month (e.g., "2026-03")
   */
  export function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
  
  /**
   * ============================================================================
   * USAGE EXAMPLES
   * ============================================================================
   * 
   * // Import functions:
   * import { addBooking, getBookingsByMonth } from './services/firebase/firestoreService';
   * import { auth } from './services/firebase/firebaseConfig';
   * 
   * // Add a booking:
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
   *   netIncome: 232.50,
   *   month: '2026-03',
   * });
   * 
   * // Get March bookings:
   * const bookings = await getBookingsByMonth(userId, '2026-03');
   * 
   * ============================================================================
   */

  /**
 * DELETE ALL BOOKINGS (for testing/reset purposes)
 * 
 * WARNING: This permanently deletes all booking data!
 * Use only when resetting to start fresh with real data.
 * 
 * @param {string} userId - Current user's ID
 * @returns {Promise<number>} Number of bookings deleted
 */
export async function deleteAllBookings(userId) {
    try {
      const bookingsRef = collection(db, 'users', userId, 'bookings');
      const snapshot = await getDocs(bookingsRef);
      
      let deleteCount = 0;
      const deletePromises = [];
      
      snapshot.docs.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
        deleteCount++;
      });
      
      await Promise.all(deletePromises);
      
      console.log(`Deleted ${deleteCount} bookings`);
      return deleteCount;
    } catch (error) {
      console.error('Error deleting bookings:', error);
      throw error;
    }
  }

/**
* DELETE A SINGLE BOOKING
* 
* @param {string} userId - Current user's ID
* @param {string} bookingId - Booking document ID to delete
* @returns {Promise<void>}
*/
export async function deleteBooking(userId, bookingId) {
  try {
    const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);
    await deleteDoc(bookingRef);

    console.log(`Deleted booking: ${bookingId}`);
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
}