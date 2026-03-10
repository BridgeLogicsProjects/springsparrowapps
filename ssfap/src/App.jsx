/**
 * ============================================================================
 * SPRING SPARROW FINANCIAL ADVISOR (SSFAP)
 * ============================================================================
 * 
 * Component: App (Main Dashboard)
 * Version: 1.6.0 - UNIT DETAIL MODAL + TAX TRACKING
 * Last Updated: 2026-03-10
 * 
 * PURPOSE:
 * Main dashboard showing Spring Sparrow LLC's financial health at a glance.
 * Displays CapEx reserves, monthly income, unit performance, and action items.
 * 
 * BUSINESS CONTEXT:
 * This is Keeya's command center for managing 3 rental units (Robin's Roost,
 * Dove's Den, Stadium District). Shows real-time financial position to make
 * strategic decisions: MTR vs STR, when to spend, distribution timing.
 * 
 * CHANGELOG v1.6.0:
 * - ADDED: UnitDetailModal - Click unit cards to see detailed breakdown
 * - ADDED: Actual vs Potential revenue tracking (critical for MTR!)
 * - ADDED: Tax column in revenue tables (12.5% Pierce County)
 * - IMPROVED: Clean console logging for debugging
 * - FIX: All imports and modal renders working
 * 
 * PREVIOUS CHANGELOG v1.4.0:
 * - FIXED: Removed mock CapEx data ($10,565 → $5,002.98 from Baselane)
 * - FIXED: Removed mock Distributions data ($4,689 → $0)
 * - FIXED: Month filtering - bookings now filtered by month field
 * - ADDED: Month selector dropdown (Jan/Feb/Mar 2026)
 * 
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import SignInModal from './components/SignInModal';
import BookingForm from './components/BookingForm';
import BreakdownModal from './components/BreakdownModal';
import AllBookingsModal from './components/AllBookingsModal';
import UnitDetailModal from './components/UnitDetailModal';
import { 
  Home, 
  TrendingUp, 
  Gem, 
  DollarSign, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  LogIn, 
  User, 
  LogOut, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { getBookingsByMonth, getCurrentMonth, addBooking } from './services/firebase/firestoreService';
import robinsRoostImg from './assets/robinsroost_thumbnail.png';
import dovesDenImg from './assets/doveden_thumbnail.png';
import stadiumDistrictImg from './assets/stadiumdistrict_thumbnail.png';

// Mock data for demo mode
const DEMO_BOOKINGS = [
  {
    id: 'demo-1',
    unitId: 'robins-roost',
    type: 'STR',
    checkIn: new Date('2026-03-03'),
    checkOut: new Date('2026-03-06'),
    nights: 3,
    grossPayout: 420,
    platform: 'Airbnb',
    platformFee: 63,
    cleaningCost: 150,
    netIncome: 207,
    month: '2026-03',
    isMockData: true,
  },
  {
    id: 'demo-2',
    unitId: 'robins-roost',
    type: 'STR',
    checkIn: new Date('2026-03-10'),
    checkOut: new Date('2026-03-14'),
    nights: 4,
    grossPayout: 560,
    platform: 'Vrbo',
    platformFee: 84,
    cleaningCost: 150,
    netIncome: 326,
    month: '2026-03',
    isMockData: true,
  },
  {
    id: 'demo-3',
    unitId: 'robins-roost',
    type: 'STR',
    checkIn: new Date('2026-03-20'),
    checkOut: new Date('2026-03-25'),
    nights: 5,
    grossPayout: 700,
    platform: 'Airbnb',
    platformFee: 105,
    cleaningCost: 150,
    netIncome: 445,
    month: '2026-03',
    isMockData: true,
  },
  {
    id: 'demo-4',
    unitId: 'doves-den',
    type: 'MTR',
    checkIn: new Date('2026-03-01'),
    checkOut: new Date('2026-03-31'),
    nights: 30,
    grossPayout: 2400,
    platform: 'Furnished Finder',
    platformFee: 240,
    cleaningCost: 350,
    netIncome: 1810,
    baseMonthlyRent: 2000,
    damageProtection: 80,
    hasPets: true,
    petCount: 1,
    petFeePerMonth: 50,
    petDeposit: 250,
    securityDeposit: 500,
    month: '2026-03',
    isMockData: true,
  },
  {
    id: 'demo-5',
    unitId: 'stadium-district',
    type: 'STR',
    checkIn: new Date('2026-03-08'),
    checkOut: new Date('2026-03-11'),
    nights: 3,
    grossPayout: 390,
    platform: 'Airbnb',
    platformFee: 58.50,
    cleaningCost: 150,
    netIncome: 181.50,
    month: '2026-03',
    isMockData: true,
  },
  {
    id: 'demo-6',
    unitId: 'stadium-district',
    type: 'STR',
    checkIn: new Date('2026-03-15'),
    checkOut: new Date('2026-03-25'),
    nights: 10,
    grossPayout: 1300,
    platform: 'Airbnb',
    platformFee: 195,
    cleaningCost: 150,
    netIncome: 955,
    month: '2026-03',
    isMockData: true,
  },
];

function App() {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Auth state
  const [user, setUser] = useState(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Month selector state
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  
  // Demo Mode state
  const [demoMode, setDemoMode] = useState(false);
  
  // Booking form modal state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  
  // Breakdown modal state
  const [showBreakdown, setShowBreakdown] = useState(false);

  // All Bookings modal state
  const [showAllBookings, setShowAllBookings] = useState(false);

  // Unit detail modal state 
  const [showUnitDetail, setShowUnitDetail] = useState(false); 
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState(null); 

  
  // Hardcoded user ID for now
  const userId = 'B52ye9yyQ0QINoHdEe4nH5niDef2';
  
  // ========================================================================
  // AUTH LISTENER
  // ========================================================================
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Exit demo mode when signing out
      if (!currentUser && demoMode) {
        setDemoMode(false);
      }
    });
    return () => unsubscribe();
  }, [demoMode]);
  
  // ========================================================================
  // FETCH DATA FROM FIREBASE (OR USE DEMO DATA)
  // ========================================================================
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        if (demoMode) {
          // Use demo data
          const demoForMonth = DEMO_BOOKINGS.filter(b => b.month === selectedMonth);
          setBookings(demoForMonth);
          console.log('Loaded demo data for', selectedMonth, ':', demoForMonth);
        } else {
          // Get real Firebase data
          const monthBookings = await getBookingsByMonth(userId, selectedMonth);
          setBookings(monthBookings);
          console.log('Loaded real bookings for', selectedMonth, ':', monthBookings);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [userId, selectedMonth, demoMode]);
  
  // ========================================================================
  // CALCULATE METRICS FROM DATA
  // ========================================================================
  
  // Filter bookings for displayed month
  const currentMonthBookings = bookings.filter(b => b.month === selectedMonth);
  
  // Calculate total income
  const totalIncome = currentMonthBookings.reduce((sum, booking) => sum + booking.netIncome, 0);
  
  // Count nights by unit
  const unitNights = currentMonthBookings.reduce((acc, booking) => {
    if (!acc[booking.unitId]) acc[booking.unitId] = 0;
    acc[booking.unitId] += booking.nights;
    return acc;
  }, {});
  
  // ========================================================================
  // REAL BASELANE DATA
  // ========================================================================
  
  const capexReserve = {
    current: 5002.98,
    target: 20000,
    percentage: 25,
  };
  
  const monthlyIncome = {
    current: totalIncome,
    target: 11721,
    percentage: Math.round((totalIncome / 11721) * 100),
  };
  
  const units = [
    {
      id: 'robins-roost',
      name: "Robin's Roost",
      image: robinsRoostImg,
      nights: unitNights['robins-roost'] || 0,
      target: 15,
      netIncome: currentMonthBookings
        .filter(b => b.unitId === 'robins-roost')
        .reduce((sum, b) => sum + b.netIncome, 0),
      status: (unitNights['robins-roost'] || 0) >= 15 ? 'success' : 'warning',
    },
    {
      id: 'doves-den',
      name: "Dove's Den",
      image: dovesDenImg,
      nights: unitNights['doves-den'] || 0,
      target: 15,
      netIncome: currentMonthBookings
        .filter(b => b.unitId === 'doves-den')
        .reduce((sum, b) => sum + b.netIncome, 0),
      status: (unitNights['doves-den'] || 0) >= 15 ? 'success' : 'warning',
    },
    {
      id: 'stadium-district',
      name: 'Stadium District',
      image: stadiumDistrictImg,
      nights: unitNights['stadium-district'] || 0,
      target: 18,
      netIncome: currentMonthBookings
        .filter(b => b.unitId === 'stadium-district')
        .reduce((sum, b) => sum + b.netIncome, 0),
      status: (unitNights['stadium-district'] || 0) >= 18 ? 'success' : 'warning',
    },
  ];
  
  const distributions = {
    total: 0,
    keeya: 0,
    tie: 0,
  };
  
  const actionItems = [
    { text: 'Push Robin bookings', priority: 'danger' },
    { text: 'Stadium MTR decision', priority: 'pending' },
    { text: 'Electrical repair pending - Talked with Financial Therapist', priority: 'danger' },
  ];

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-success-600';
      case 'warning': return 'text-warning-600';
      case 'danger': return 'text-danger-600';
      default: return 'text-neutral-600';
    }
  };

  const formatMonthDisplay = (monthString) => {
    const [year, month] = monthString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    if (user.displayName) return user.displayName.split(' ')[0]; // First name only
    if (user.email) {
      const name = user.email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'User';
  };

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleAddBooking = (unitId) => {
    setSelectedUnit(unitId);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedUnit(null);
    window.location.reload();
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      const { deleteBooking } = await import('./services/firebase/firestoreService');
      await deleteBooking(userId, bookingId);
      const monthBookings = await getBookingsByMonth(userId, selectedMonth);
      setBookings(monthBookings);
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking: ' + error.message);
    }
  };

  const handleUnitClick = (unit) => {
    console.log('🎯 handleUnitClick called with:', unit);
    setSelectedUnitForDetail(unit);
    setShowUnitDetail(true);
    console.log('✅ Modal state set - showUnitDetail:', true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowUserMenu(false);
      setDemoMode(false); // Exit demo mode on sign out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleToggleDemo = () => {
    setDemoMode(!demoMode);
  };
  
  // ========================================================================
  // LOADING & ERROR STATES
  // ========================================================================
  
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-neutral-600">Loading your financial data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-danger-600 font-semibold mb-2">Error loading data</p>
          <p className="text-neutral-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="min-h-screen bg-neutral-50">
      
      {/* ============================================================ */}
      {/* BEGIN: Header with Auth Controls                             */}
      {/* ============================================================ */}
      <header className="bg-white border-b border-neutral-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            
            {/* Left: Title and Month Selector */}
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                Spring Sparrow
              </h1>
              
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-md px-3 py-1.5 cursor-pointer hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="2026-03">March 2026</option>
                <option value="2026-02">February 2026</option>
                <option value="2026-01">January 2026</option>
              </select>
            </div>
            
            {/* Right: Auth Controls & Demo Toggle */}
            <div className="flex items-center gap-3">
              
              {/* Sign In Button OR User Menu */}
              {!user ? (
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>{getUserDisplayName()}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-neutral-200 py-1 z-50">
                      <div className="px-4 py-3 border-b border-neutral-200">
                        <p className="text-sm font-semibold text-neutral-900">
                          {user.displayName || getUserDisplayName()}
                        </p>
                        <p className="text-xs text-neutral-500 truncate mt-1">
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Demo Mode Toggle */}
              <button
                onClick={handleToggleDemo}
                disabled={!user}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border-2 flex items-center gap-2 ${
                  demoMode
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-900 hover:bg-yellow-100'
                    : user
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:bg-neutral-200'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
                title={!user ? 'Sign in to use Demo Mode' : ''}
              >
                <Sparkles className="w-4 h-4" />
                {demoMode ? 'Demo ON' : 'Demo OFF'}
              </button>
              
            </div>
          </div>
        </div>
      </header>
      {/* ============================================================ */}
      {/* END: Header with Auth Controls                               */}
      {/* ============================================================ */}

      {/* ============================================================ */}
      {/* BEGIN: Status Banner                                         */}
      {/* ============================================================ */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          
          {/* Not Signed In State */}
          {!user && (
            <div className="flex items-center justify-between bg-blue-50 border-2 border-blue-300 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">
                    Not signed in
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Sign in to access your real booking data, or try Demo Mode to explore
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSignInModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Sign In Now
              </button>
            </div>
          )}
          
          {/* Demo Mode State */}
          {user && demoMode && (
            <div className="flex items-center justify-between bg-yellow-50 border-2 border-yellow-400 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">
                    🎬 Demo Mode Active
                  </p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    {bookings.length} mock booking{bookings.length !== 1 ? 's' : ''} loaded • Click "Demo OFF" to see your real data
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleDemo}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Exit Demo
              </button>
            </div>
          )}
          
          {/* Real Data State */}
          {user && !demoMode && (
            <div className="bg-green-50 border-2 border-green-400 rounded-lg px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    ✅ Signed in as {user.email}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {bookings.length} real booking{bookings.length !== 1 ? 's' : ''} for {formatMonthDisplay(selectedMonth)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
      {/* ============================================================ */}
      {/* END: Status Banner                                           */}
      {/* ============================================================ */}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* ============================================================ */}
        {/* BEGIN: Top Metrics Row (CapEx + Monthly Income)              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* CapEx Reserve Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-900">
                  CapEx Reserve
                </h2>
              </div>
              <span className="text-sm font-medium text-success-600">
                On track
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-neutral-900">
                  {formatCurrency(capexReserve.current)}
                </span>
                <span className="text-sm text-neutral-600">
                  / {formatCurrency(capexReserve.target)}
                </span>
              </div>
              
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div 
                  className="bg-success-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${capexReserve.percentage}%` }}
                />
              </div>
              
              <p className="text-sm text-neutral-600">
                {capexReserve.percentage}% • Target: Dec 31, 2026
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                💡 Real balance from Baselane account 7743
              </p>
            </div>
          </div>
          
          {/* Monthly Income Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-neutral-900">
                  {formatMonthDisplay(selectedMonth)} Net Income
                </h2>
              </div>
              <span className={`text-sm font-medium ${
                totalIncome >= monthlyIncome.target ? 'text-success-600' : 
                totalIncome > 0 ? 'text-warning-600' : 'text-neutral-400'
              }`}>
                {totalIncome >= monthlyIncome.target ? 'On track' : 
                 totalIncome > 0 ? 'Behind pace' : 'No data yet'}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-neutral-900">
                  {formatCurrency(monthlyIncome.current)}
                </span>
                <span className="text-sm text-neutral-600">
                  / {formatCurrency(monthlyIncome.target)}
                </span>
              </div>
              
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    totalIncome > 0 ? 'bg-warning-500' : 'bg-neutral-300'
                  }`}
                  style={{ width: `${Math.min(monthlyIncome.percentage, 100)}%` }}
                />
              </div>
              
              <p className="text-sm text-neutral-600">
                {monthlyIncome.percentage}%
              </p>
              
              {bookings.length > 0 && (
                <button
                  onClick={() => setShowBreakdown(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View STR vs MTR Breakdown →
                </button>
              )}
            </div>
          </div>
        </div>
        {/* ============================================================ */}
        {/* END: Top Metrics Row                                         */}
        {/* ============================================================ */}

       {/* ============================================================ */}
{/* BEGIN: Unit Performance Cards                                */}
{/* ============================================================ */}
<div>
  {/* Section Header */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Home className="w-5 h-5 text-primary-600" />
      <h2 className="text-lg font-semibold text-neutral-900">
        Unit Performance - {formatMonthDisplay(selectedMonth)}
      </h2>
    </div>

    {/* View All Bookings Button */}
    {bookings.length > 0 && (
      <button
        onClick={() => setShowAllBookings(true)}
        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
      >
        View All Bookings →
      </button>
    )}
  </div>  
  
  {/* Unit Cards Grid */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {units.map(unit => (
      <div 
        key={unit.id}
        onClick={() => {
          console.log('🖱️ Unit card clicked!', unit.id);
          console.log('📦 Unit data:', unit);
          handleUnitClick(unit);
        }}
        className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-200 cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all"
      >
        {/* Unit Image */}
        <div className="relative h-48 bg-neutral-100">
          <img 
            src={unit.image} 
            alt={unit.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Unit Details */}
        <div className="p-6">
          {/* Unit Name */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              {unit.name}
            </h3>
          </div>
          
          {/* Unit Stats */}
          <div className="space-y-3">
            {/* Nights */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Nights</span>
              <span className={`font-semibold ${getStatusColor(unit.status)}`}>
                {unit.nights} / {unit.target}
              </span>
            </div>
            
            {/* Net Income */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Net Income</span>
              <span className={`font-semibold ${unit.netIncome >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {formatCurrency(unit.netIncome)}
              </span>
            </div>
            
            {/* Add Booking Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // CRITICAL: Prevent card click
                console.log('➕ Add Booking button clicked for:', unit.id);
                handleAddBooking(unit.id);
              }}
              disabled={!user}
              className="w-full mt-2 px-4 py-2 bg-blue-100 border-2 border-blue-600 text-blue-900 hover:bg-blue-200 disabled:bg-neutral-100 disabled:border-neutral-300 disabled:text-neutral-400 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              title={!user ? 'Sign in to add bookings' : ''}
            >
              + Add Booking
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
{/* ============================================================ */}
{/* END: Unit Performance Cards                                  */}
{/* ============================================================ */}

        {/* ============================================================ */}
        {/* BEGIN: Bottom Row (Distributions + Action Items)             */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Owner Distributions Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">
                Owner Distributions
              </h2>
            </div>
            
            <div className="space-y-3">
              <div className="rounded-lg p-4 border bg-neutral-50 border-neutral-200">
                <p className="text-sm mb-2 text-neutral-600">
                  Ready to distribute
                </p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(distributions.total)}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-600 mb-1">Keeya</p>
                  <p className="font-semibold text-neutral-900">
                    {formatCurrency(distributions.keeya)}
                  </p>
                </div>
                <div className="text-center p-3 bg-neutral-50 rounded-lg">
                  <p className="text-xs text-neutral-600 mb-1">Tie</p>
                  <p className="font-semibold text-neutral-900">
                    {formatCurrency(distributions.tie)}
                  </p>
                </div>
              </div>
              
              <button 
                disabled
                className="w-full mt-2 px-4 py-3 bg-neutral-100 border-2 border-neutral-300 text-neutral-500 rounded-lg font-medium cursor-not-allowed"
              >
                No funds to distribute
              </button>
              
              <p className="text-xs text-neutral-500 mt-2">
                💡 Real balance from Baselane distribution account
              </p>
            </div>
          </div>
          
          {/* Action Items Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-neutral-900">
                Action Items
              </h2>
            </div>
            
            <div className="space-y-3">
              {actionItems.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer border border-neutral-200"
                >
                  <span 
                    className={`
                      h-4 w-4 rounded-full flex-shrink-0 border-2 border-[#E6E6E6]
                      ${item.priority === 'danger' ? 'bg-red-500' : ''}
                      ${item.priority === 'pending' ? 'bg-yellow-500' : ''}
                      ${item.priority === 'easy' ? 'bg-green-500' : ''}
                      ${item.priority === 'undecided' ? 'bg-gray-400' : ''}
                    `}
                  />
                  
                  <span className="text-sm text-neutral-700 flex-1">
                    {item.text}
                  </span>
                  <span className="text-neutral-400">→</span>
                </div>
              ))}
            </div>
          </div>

        </div>
        {/* ============================================================ */}
        {/* END: Bottom Row                                              */}
        {/* ============================================================ */}

      </main>

      {/* ============================================================ */}
      {/* MODALS                                                       */}
      {/* ============================================================ */}

      {/* Sign In Modal */}
      {showSignInModal && (
        <SignInModal
          onClose={() => setShowSignInModal(false)}
          onSuccess={() => setShowSignInModal(false)}
        />
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          unitId={selectedUnit}
          onClose={() => setShowBookingForm(false)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Breakdown Modal */}
      {showBreakdown && (
        <BreakdownModal
          bookings={currentMonthBookings}
          onClose={() => setShowBreakdown(false)}
          currentMonth={selectedMonth}
        />
      )}

      {/* All Bookings Modal */}
      {showAllBookings && (
        <AllBookingsModal
          bookings={currentMonthBookings}
          onClose={() => setShowAllBookings(false)}
          onDelete={handleDeleteBooking}
        />
      )}

      {/* Unit Detail Modal */}
      {showUnitDetail && selectedUnitForDetail && (
        <UnitDetailModal
          unit={selectedUnitForDetail}
          bookings={currentMonthBookings.filter(b => b.unitId === selectedUnitForDetail.id)}
          onClose={() => {
            setShowUnitDetail(false);
            setSelectedUnitForDetail(null);
          }}
          currentMonth={selectedMonth}
        />
      )}
    </div>
  );
}

export default App;
