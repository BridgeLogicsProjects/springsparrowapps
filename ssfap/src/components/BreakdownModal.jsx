/**
 * ============================================================================
 * SPRING SPARROW FINANCIAL ADVISOR (SSFAP)
 * ============================================================================
 * 
 * Component: BreakdownModal
 * Version: 2.0.0 - ENHANCED
 * Last Updated: 2026-03-09
 * 
 * PURPOSE:
 * Shows STR vs MTR breakdown with flexible time period filtering.
 * Supports viewing single months, YTD, or custom date ranges (3mo, 6mo).
 * 
 * CHANGELOG v2.0.0:
 * - ADDED: Time period dropdown (YTD, 6mo, 3mo, individual months)
 * - ADDED: Dynamic date range display
 * - ADDED: Smart filtering across multiple months
 * - FIXED: Now respects selected time period for all calculations
 * - IMPROVED: Better breakdown table with dates
 * 
 * BUSINESS CONTEXT:
 * Alandis Jones extended his Stadium District MTR booking, resulting in
 * 2 separate booking records (one for Feb, one for Mar). This modal now
 * properly handles cross-month bookings and shows accurate breakdowns.
 * 
 * ============================================================================
 */

import { useState, useMemo } from 'react';

function BreakdownModal({ bookings, onClose, currentMonth }) {
  // ========================================================================
  // STATE - Time Period Selection
  // ========================================================================
  
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonth || 'ytd');
  
  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const getMonthName = (monthString) => {
    const [year, month] = monthString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };
  
  // ========================================================================
  // TIME PERIOD FILTERING LOGIC
  // ========================================================================
  
  const { filteredBookings, periodTitle, dateRange } = useMemo(() => {
    let filtered = [];
    let title = '';
    let range = '';
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    
    switch (selectedPeriod) {
      case 'ytd':
        // Year to Date - all bookings from Jan 1 to now
        filtered = bookings.filter(b => {
          const [year] = b.month.split('-');
          return year === String(currentYear);
        });
        title = `${currentYear} - Year to Date`;
        range = `Jan 1 - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${currentYear}`;
        break;
        
      case '6mo':
        // Last 6 months
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const sixMonthsAgoStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
        
        filtered = bookings.filter(b => b.month >= sixMonthsAgoStr);
        title = 'Last 6 Months';
        range = `${sixMonthsAgo.toLocaleDateString('en-US', { month: 'short' })} ${sixMonthsAgo.getFullYear()} - ${now.toLocaleDateString('en-US', { month: 'short' })} ${now.getFullYear()}`;
        break;
        
      case '3mo':
        // Last 3 months
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const threeMonthsAgoStr = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
        
        filtered = bookings.filter(b => b.month >= threeMonthsAgoStr);
        title = 'Last 3 Months';
        range = `${threeMonthsAgo.toLocaleDateString('en-US', { month: 'short' })} ${threeMonthsAgo.getFullYear()} - ${now.toLocaleDateString('en-US', { month: 'short' })} ${now.getFullYear()}`;
        break;
        
      default:
        // Specific month (e.g., "2026-03")
        filtered = bookings.filter(b => b.month === selectedPeriod);
        title = getMonthName(selectedPeriod);
        
        // Calculate date range for the month
        const [year, month] = selectedPeriod.split('-');
        const firstDay = new Date(year, parseInt(month) - 1, 1);
        const lastDay = new Date(year, parseInt(month), 0);
        range = `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${year}`;
        break;
    }
    
    return { filteredBookings: filtered, periodTitle: title, dateRange: range };
  }, [bookings, selectedPeriod]);
  
  // ========================================================================
  // CALCULATE STR VS MTR BREAKDOWN
  // ========================================================================
  
  const strBookings = filteredBookings.filter(b => b.type === 'STR');
  const mtrBookings = filteredBookings.filter(b => b.type === 'MTR');
  
  const strStats = {
    count: strBookings.length,
    nights: strBookings.reduce((sum, b) => sum + b.nights, 0),
    netIncome: strBookings.reduce((sum, b) => sum + b.netIncome, 0),
  };
  
  const mtrStats = {
    count: mtrBookings.length,
    days: mtrBookings.reduce((sum, b) => sum + b.nights, 0),
    netIncome: mtrBookings.reduce((sum, b) => sum + b.netIncome, 0),
  };
  
  const totalIncome = strStats.netIncome + mtrStats.netIncome;
  
  // ========================================================================
  // GENERATE MONTH OPTIONS (Jan 2026 - Current Month)
  // ========================================================================
  
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1;
    
    // Generate months from Jan 2026 to current month
    for (let month = 1; month <= currentMonthNum; month++) {
      const monthStr = `${currentYear}-${String(month).padStart(2, '0')}`;
      options.push({
        value: monthStr,
        label: getMonthName(monthStr),
      });
    }
    
    return options.reverse(); // Most recent first
  }, []);
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* ============================================================ */}
        {/* Header with Time Period Selector                             */}
        {/* ============================================================ */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-neutral-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-neutral-900">Revenue Breakdown</h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 text-2xl transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* Time Period Dropdown */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-2">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 rounded-lg text-sm font-medium text-neutral-900 cursor-pointer hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            >
              <optgroup label="Summary Periods">
                <option value="ytd">2026 - Year to Date</option>
                <option value="6mo">Last 6 Months</option>
                <option value="3mo">Last 3 Months</option>
              </optgroup>
              <optgroup label="Individual Months">
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          
          {/* Period Info */}
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-600">
            <span className="font-semibold">{periodTitle}</span>
            <span>{dateRange}</span>
          </div>
        </div>
        
        {/* ============================================================ */}
        {/* Content                                                      */}
        {/* ============================================================ */}
        <div className="p-6 space-y-6">
          
          {/* No Data Message */}
          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-neutral-600 font-medium">No bookings for this period</p>
              <p className="text-sm text-neutral-500 mt-1">Try selecting a different time range</p>
            </div>
          )}
          
          {/* Summary Cards */}
          {filteredBookings.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* MTR Card */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">MTR Bookings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-blue-700">Bookings:</span>
                      <span className="font-semibold text-blue-900">{mtrStats.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-blue-700">Days:</span>
                      <span className="font-semibold text-blue-900">{mtrStats.days}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-blue-700">Net Income:</span>
                      <span className="font-semibold text-blue-900">{formatCurrency(mtrStats.netIncome)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-xs text-blue-700">% of Total:</span>
                      <span className="font-semibold text-blue-900">
                        {totalIncome > 0 ? Math.round((mtrStats.netIncome / totalIncome) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* STR Card */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-green-900 mb-3">STR Bookings</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-green-700">Bookings:</span>
                      <span className="font-semibold text-green-900">{strStats.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-green-700">Nights:</span>
                      <span className="font-semibold text-green-900">{strStats.nights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-green-700">Net Income:</span>
                      <span className="font-semibold text-green-900">{formatCurrency(strStats.netIncome)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-green-200">
                      <span className="text-xs text-green-700">% of Total:</span>
                      <span className="font-semibold text-green-900">
                        {totalIncome > 0 ? Math.round((strStats.netIncome / totalIncome) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Total */}
              <div className="bg-neutral-100 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-700">Total Net Income</span>
                  <span className="text-2xl font-bold text-neutral-900">{formatCurrency(totalIncome)}</span>
                </div>
              </div>
              
              {/* Detailed Table */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">Booking Details</h3>
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 border-b border-neutral-200">
                      <tr>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-700">Unit</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-700">Type</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-700">Dates</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-neutral-700">Days</th>
                        <th className="text-right px-3 py-2 text-xs font-semibold text-neutral-700">Net Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking, index) => (
                        <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="px-3 py-2.5 text-neutral-900">
                            {booking.unitId === 'robins-roost' ? "Robin's Roost" : 
                             booking.unitId === 'doves-den' ? "Dove's Den" : 
                             'Stadium District'}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              booking.type === 'MTR' 
                                ? 'bg-blue-100 text-blue-900' 
                                : 'bg-green-100 text-green-900'
                            }`}>
                              {booking.type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-neutral-700 text-xs">
                            {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-neutral-900 font-medium">{booking.nights}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-neutral-900">
                            {formatCurrency(booking.netIncome)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
        </div>
        
        {/* ============================================================ */}
        {/* Footer                                                       */}
        {/* ============================================================ */}
        <div className="sticky bottom-0 border-t border-neutral-200 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default BreakdownModal;
