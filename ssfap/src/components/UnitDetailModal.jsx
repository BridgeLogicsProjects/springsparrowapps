/**
 * ============================================================================
 * SPRING SPARROW FINANCIAL ADVISOR (SSFAP)
 * ============================================================================
 * 
 * Component: UnitDetailModal
 * Version: 1.0.0
 * Last Updated: 2026-02-27
 * 
 * PURPOSE:
 * Shows detailed breakdown of a single unit's performance including:
 * - STR vs MTR revenue breakdown
 * - All bookings for the unit
 * - Occupancy rate
 * - Fee breakdowns
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

function UnitDetailModal({ unit, bookings, onClose, currentMonth }) {
  const [activeTab, setActiveTab] = useState('summary'); // summary, str, mtr, bookings
  
  // Filter bookings for this unit
  const unitBookings = bookings.filter(b => b.unitId === unit.id);
  
  // Separate STR and MTR bookings
  const strBookings = unitBookings.filter(b => b.type === 'STR');
  const mtrBookings = unitBookings.filter(b => b.type === 'MTR');
  
  // Calculate STR totals
  const strStats = {
    count: strBookings.length,
    nights: strBookings.reduce((sum, b) => sum + b.nights, 0),
    grossRevenue: strBookings.reduce((sum, b) => sum + b.grossPayout, 0),
    platformFees: strBookings.reduce((sum, b) => sum + b.platformFee, 0),
    cleaningCosts: strBookings.reduce((sum, b) => sum + b.cleaningCost, 0),
    netIncome: strBookings.reduce((sum, b) => sum + b.netIncome, 0),
  };
  
  // Calculate MTR totals
  const mtrStats = {
    count: mtrBookings.length,
    days: mtrBookings.reduce((sum, b) => sum + b.nights, 0),
    baseRent: mtrBookings.reduce((sum, b) => sum + (b.baseMonthlyRent || 0) * (b.nights / 30), 0),
    damageProtection: mtrBookings.reduce((sum, b) => sum + (b.damageProtection || 0) * (b.nights / 30), 0),
    petFees: mtrBookings.reduce((sum, b) => {
      const monthlyPetFees = (b.petFeePerMonth || 0) * (b.petCount || 0) * (b.nights / 30);
      const petDeposit = b.petDeposit || 0;
      return sum + monthlyPetFees + petDeposit;
    }, 0),
    platformFees: mtrBookings.reduce((sum, b) => sum + b.platformFee, 0),
    cleaningCosts: mtrBookings.reduce((sum, b) => sum + b.cleaningCost, 0),
    netIncome: mtrBookings.reduce((sum, b) => sum + b.netIncome, 0),
  };
  
  // Overall stats
  const totalNights = strStats.nights + mtrStats.days;
  const totalNetIncome = strStats.netIncome + mtrStats.netIncome;
  const daysInMonth = new Date(2026, 2, 0).getDate(); // February 2026 = 28 days
  const occupancyRate = Math.round((totalNights / daysInMonth) * 100);
  
  // Calculate ACTUAL vs POTENTIAL for MTR bookings
  const mtrActualVsPotential = mtrBookings.map(booking => {
    const startDate = new Date(booking.checkIn);
    const endDate = new Date(booking.checkOut);
    const today = new Date();
    
    // Calculate months elapsed (actual revenue received)
    const monthsElapsed = Math.max(0, Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 30)));
    const totalMonths = Math.floor(booking.nights / 30);
    const monthsRemaining = Math.max(0, totalMonths - monthsElapsed);
    
    // Monthly revenue breakdown
    const monthlyRevenue = booking.netIncome / totalMonths;
    const actualRevenue = monthlyRevenue * Math.min(monthsElapsed, totalMonths);
    const potentialRevenue = monthlyRevenue * monthsRemaining;
    
    return {
      booking,
      monthsElapsed,
      monthsRemaining,
      totalMonths,
      monthlyRevenue,
      actualRevenue,
      potentialRevenue
    };
  });
  
  // Aggregate actual vs potential
  const actualMtrRevenue = mtrActualVsPotential.reduce((sum, item) => sum + item.actualRevenue, 0);
  const potentialMtrRevenue = mtrActualVsPotential.reduce((sum, item) => sum + item.potentialRevenue, 0);
  
  // STR is always "actual" (paid upfront)
  const totalActualRevenue = strStats.netIncome + actualMtrRevenue;
  const totalPotentialRevenue = potentialMtrRevenue;
  const totalContractValue = totalActualRevenue + totalPotentialRevenue;
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {unit.name}
            </h2>
            <p className="text-sm text-neutral-600">
              {currentMonth || 'February 2026'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Summary Cards */}
        <div className="p-6 border-b border-neutral-200">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-success-700" />
                <p className="text-xs font-semibold text-success-700">Actual Revenue</p>
              </div>
              <p className="text-2xl font-bold text-success-900">{formatCurrency(totalActualRevenue)}</p>
              <p className="text-xs text-success-700 mt-1">✅ Received this month</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <p className="text-xs font-semibold text-blue-700">Potential Revenue</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalPotentialRevenue)}</p>
              <p className="text-xs text-blue-700 mt-1">⏳ Future contracted</p>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-700" />
                <p className="text-xs font-semibold text-purple-700">Total Contract</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalContractValue)}</p>
              <p className="text-xs text-purple-700 mt-1">Actual + Potential</p>
            </div>
          </div>
          
          {/* Secondary Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <p className="text-xs text-neutral-600 mb-1">Occupancy Rate</p>
              <p className="text-lg font-bold text-neutral-900">{occupancyRate}%</p>
              <p className="text-xs text-neutral-600">{totalNights}/{daysInMonth} days</p>
            </div>
            
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
              <p className="text-xs text-neutral-600 mb-1">Total Bookings</p>
              <p className="text-lg font-bold text-neutral-900">{unitBookings.length}</p>
              <p className="text-xs text-neutral-600">
                {strBookings.length} STR, {mtrBookings.length} MTR
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-neutral-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Summary
            </button>
            {strBookings.length > 0 && (
              <button
                onClick={() => setActiveTab('str')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'str'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                STR Breakdown
              </button>
            )}
            {mtrBookings.length > 0 && (
              <button
                onClick={() => setActiveTab('mtr')}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'mtr'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                MTR Breakdown
              </button>
            )}
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'bookings'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Bookings ({unitBookings.length})
            </button>
          </div>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {strBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">STR Revenue</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-green-700">Bookings</p>
                        <p className="text-lg font-semibold text-green-900">{strStats.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">Nights</p>
                        <p className="text-lg font-semibold text-green-900">{strStats.nights}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">Net Income</p>
                        <p className="text-lg font-semibold text-green-900">{formatCurrency(strStats.netIncome)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-green-700">% of Total</p>
                        <p className="text-lg font-semibold text-green-900">
                          {Math.round((strStats.netIncome / totalNetIncome) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {mtrBookings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3">MTR Revenue</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-700">Bookings</p>
                        <p className="text-lg font-semibold text-blue-900">{mtrStats.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">Days</p>
                        <p className="text-lg font-semibold text-blue-900">{mtrStats.days}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">Net Income</p>
                        <p className="text-lg font-semibold text-blue-900">{formatCurrency(mtrStats.netIncome)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-700">% of Total</p>
                        <p className="text-lg font-semibold text-blue-900">
                          {Math.round((mtrStats.netIncome / totalNetIncome) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* STR Breakdown Tab */}
          {activeTab === 'str' && (
            <div className="space-y-4">
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Bookings</span>
                  <span className="font-semibold text-neutral-900">{strStats.count} bookings</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Total Nights</span>
                  <span className="font-semibold text-neutral-900">{strStats.nights} nights</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200">
                  <span className="text-sm text-neutral-600">Gross Revenue</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(strStats.grossRevenue)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">Platform Fees</span>
                  <span className="font-semibold">-{formatCurrency(strStats.platformFees)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span className="text-sm">Cleaning Costs</span>
                  <span className="font-semibold">-{formatCurrency(strStats.cleaningCosts)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-neutral-300">
                  <span className="font-semibold text-neutral-900">Net Income</span>
                  <span className="text-xl font-bold text-success-600">{formatCurrency(strStats.netIncome)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* MTR Breakdown Tab */}
          {activeTab === 'mtr' && (
            <div className="space-y-4">
              {mtrActualVsPotential.map((item, index) => (
                <div key={index} className="border border-neutral-200 rounded-lg overflow-hidden">
                  <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatDate(item.booking.checkIn)} - {formatDate(item.booking.checkOut)}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {item.totalMonths} month contract ({item.monthsElapsed} elapsed, {item.monthsRemaining} remaining)
                    </p>
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {/* Actual Revenue */}
                    <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-success-700 mb-2">✅ ACTUAL (Received)</p>
                      <div className="flex justify-between">
                        <span className="text-sm text-success-700">
                          {item.monthsElapsed} month{item.monthsElapsed !== 1 ? 's' : ''} @ {formatCurrency(item.monthlyRevenue)}/mo
                        </span>
                        <span className="text-lg font-bold text-success-900">
                          {formatCurrency(item.actualRevenue)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Potential Revenue */}
                    {item.potentialRevenue > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-2">⏳ POTENTIAL (Future Payments)</p>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">
                            {item.monthsRemaining} month{item.monthsRemaining !== 1 ? 's' : ''} @ {formatCurrency(item.monthlyRevenue)}/mo
                          </span>
                          <span className="text-lg font-bold text-blue-900">
                            {formatCurrency(item.potentialRevenue)}
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          💡 This assumes tenant continues paying through end of lease
                        </p>
                      </div>
                    )}
                    
                    {/* Total Contract Value */}
                    <div className="flex justify-between pt-2 border-t-2 border-neutral-300">
                      <span className="font-semibold text-neutral-900">Total Contract Value</span>
                      <span className="text-xl font-bold text-purple-600">
                        {formatCurrency(item.actualRevenue + item.potentialRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Summary Totals */}
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3 mt-4">
                <h4 className="font-semibold text-neutral-900 mb-3">MTR Totals</h4>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Actual Revenue Received</span>
                  <span className="font-semibold text-success-600">{formatCurrency(actualMtrRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-600">Potential Future Revenue</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(potentialMtrRevenue)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-neutral-300">
                  <span className="font-semibold text-neutral-900">Total MTR Contract Value</span>
                  <span className="text-xl font-bold text-purple-600">{formatCurrency(mtrStats.netIncome)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* All Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-700">Type</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-neutral-700">Dates</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-neutral-700">Nights</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-neutral-700">Net Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitBookings.map((booking, index) => (
                      <tr key={index} className="border-b border-neutral-100">
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            booking.type === 'MTR' 
                              ? 'bg-blue-100 text-blue-900' 
                              : 'bg-green-100 text-green-900'
                          }`}>
                            {booking.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-neutral-700 text-xs">
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </td>
                        <td className="px-3 py-2 text-right text-neutral-900">
                          {booking.nights}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-neutral-900">
                          {formatCurrency(booking.netIncome)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        <div className="border-t border-neutral-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnitDetailModal;