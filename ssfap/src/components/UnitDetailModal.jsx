/**
 * ============================================================================
 * SPRING SPARROW FINANCIAL ADVISOR (SSFAP)
 * ============================================================================
 * 
 * Component: UnitDetailModal
 * Version: 2.0.0 - ACTUAL VS POTENTIAL REVENUE
 * Last Updated: 2026-03-10
 * 
 * PURPOSE:
 * Detailed view of individual unit performance showing actual received
 * revenue vs potential future payments for MTR bookings.
 * 
 * BUSINESS CONTEXT:
 * Critical distinction: STR bookings are paid upfront (100% actual).
 * MTR bookings are paid monthly, so we need to track:
 * - Actual: Days elapsed × daily rate (already received)
 * - Potential: Days remaining × daily rate (future payments)
 * 
 * This prevents overspending based on uncommitted MTR income.
 * 
 * ============================================================================
 */

import { useMemo } from 'react';
import { X, TrendingUp, Calendar, DollarSign, CheckCircle, Clock } from 'lucide-react';

function UnitDetailModal({ unit, bookings, onClose, currentMonth }) {
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
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const formatMonthDisplay = (monthString) => {
    const [year, month] = monthString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };
  
  // ========================================================================
  // CALCULATE ACTUAL VS POTENTIAL REVENUE
  // ========================================================================
  
  const revenueBreakdown = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    let totalActual = 0;
    let totalPotential = 0;
    
    const bookingDetails = bookings.map(booking => {
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      
      if (booking.type === 'STR') {
        // STR: Always 100% actual (paid upfront)
        totalActual += booking.netIncome;
        
        return {
          ...booking,
          actual: booking.netIncome,
          potential: 0,
          percentageActual: 100,
          status: 'received',
        };
      } else {
        // MTR: Calculate based on elapsed days
        const totalDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const elapsedDays = today > checkIn 
          ? Math.min(Math.ceil((today - checkIn) / (1000 * 60 * 60 * 24)), totalDays)
          : 0;
        const remainingDays = Math.max(totalDays - elapsedDays, 0);
        
        const dailyRate = booking.netIncome / totalDays;
        const actual = dailyRate * elapsedDays;
        const potential = dailyRate * remainingDays;
        
        totalActual += actual;
        totalPotential += potential;
        
        return {
          ...booking,
          actual,
          potential,
          elapsedDays,
          remainingDays,
          totalDays,
          dailyRate,
          percentageActual: Math.round((elapsedDays / totalDays) * 100),
          status: remainingDays > 0 ? 'ongoing' : 'received',
        };
      }
    });
    
    return {
      bookingDetails,
      totalActual,
      totalPotential,
      totalRevenue: totalActual + totalPotential,
      percentageActual: totalActual + totalPotential > 0 
        ? Math.round((totalActual / (totalActual + totalPotential)) * 100)
        : 100,
    };
  }, [bookings]);
  
  // ========================================================================
  // STATISTICS
  // ========================================================================
  
  const stats = useMemo(() => {
    const strBookings = bookings.filter(b => b.type === 'STR');
    const mtrBookings = bookings.filter(b => b.type === 'MTR');
    
    return {
      totalBookings: bookings.length,
      strCount: strBookings.length,
      mtrCount: mtrBookings.length,
      strNights: strBookings.reduce((sum, b) => sum + b.nights, 0),
      mtrDays: mtrBookings.reduce((sum, b) => sum + b.nights, 0),
      occupancyRate: Math.round((unit.nights / unit.target) * 100),
    };
  }, [bookings, unit]);
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* ============================================================ */}
        {/* Header                                                       */}
        {/* ============================================================ */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-neutral-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                {unit.name}
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Performance Details • {formatMonthDisplay(currentMonth)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* ============================================================ */}
        {/* Content                                                      */}
        {/* ============================================================ */}
        <div className="p-6 space-y-6">
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-neutral-600" />
                <p className="text-xs font-medium text-neutral-600">Occupancy</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {unit.nights} / {unit.target}
              </p>
              <p className={`text-sm font-medium mt-1 ${
                stats.occupancyRate >= 100 ? 'text-success-600' : 
                stats.occupancyRate >= 80 ? 'text-warning-600' : 
                'text-neutral-600'
              }`}>
                {stats.occupancyRate}% {stats.occupancyRate >= 100 && '🔥'}
              </p>
            </div>
            
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-neutral-600" />
                <p className="text-xs font-medium text-neutral-600">Bookings</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats.totalBookings}
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                {stats.strCount} STR • {stats.mtrCount} MTR
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-700">Actual</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(revenueBreakdown.totalActual)}
              </p>
              <p className="text-sm text-green-700 mt-1">
                {revenueBreakdown.percentageActual}% received
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-700">Potential</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(revenueBreakdown.totalPotential)}
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Future payments
              </p>
            </div>
          </div>
          
          {/* No Bookings State */}
          {bookings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-neutral-600 font-medium">No bookings for this period</p>
              <p className="text-sm text-neutral-500 mt-1">Add a booking to see revenue breakdown</p>
            </div>
          )}
          
          {/* Booking Details Table */}
          {bookings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-600" />
                Revenue Breakdown
              </h3>
              
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-700">Dates</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-700">Days</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-700">Actual</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-700">Potential</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-700">Total</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueBreakdown.bookingDetails.map((booking, index) => (
                      <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            booking.type === 'MTR' 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'bg-green-100 text-green-900'
                          }`}>
                            {booking.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-700 text-xs">
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-neutral-900">
                          {booking.nights}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-700">
                          {formatCurrency(booking.actual)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">
                          {booking.potential > 0 ? formatCurrency(booking.potential) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-neutral-900">
                          {formatCurrency(booking.netIncome)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {booking.status === 'received' ? (
                            <div className="flex items-center justify-center gap-1 text-green-700">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">Paid</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1 text-blue-700">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">Ongoing</span>
                              </div>
                              <div className="text-xs text-neutral-500">
                                {booking.percentageActual}% received
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 border-t-2 border-neutral-300">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-semibold text-neutral-900">
                        TOTAL
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">
                        {formatCurrency(revenueBreakdown.totalActual)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-700">
                        {revenueBreakdown.totalPotential > 0 ? formatCurrency(revenueBreakdown.totalPotential) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-900 text-lg">
                        {formatCurrency(revenueBreakdown.totalRevenue)}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {/* Revenue Summary */}
              <div className="mt-4 bg-primary-50 border-2 border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-primary-900">Net Income</p>
                    <p className="text-xs text-primary-700 mt-1">
                      {revenueBreakdown.percentageActual}% received • 
                      {revenueBreakdown.totalPotential > 0 
                        ? ` ${formatCurrency(revenueBreakdown.totalPotential)} pending`
                        : ' All payments received'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary-900">
                      {formatCurrency(unit.netIncome)}
                    </p>
                    {revenueBreakdown.totalPotential > 0 && (
                      <p className="text-xs text-primary-700 mt-1">
                        + {formatCurrency(revenueBreakdown.totalPotential)} potential
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </div>
        
        {/* ============================================================ */}
        {/* Footer                                                       */}
        {/* ============================================================ */}
        <div className="sticky bottom-0 border-t border-neutral-200 bg-white/90 backdrop-blur-md px-6 py-4">
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

export default UnitDetailModal;
