import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

function AllBookingsModal({ bookings, onClose, onDelete }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
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
  
  const handleDelete = (bookingId) => {
    setDeleteConfirm(bookingId);
  };
  
  const confirmDelete = async () => {
    await onDelete(deleteConfirm);
    setDeleteConfirm(null);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900">
            📋 All Bookings - February 2026
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <p className="text-sm text-neutral-600 mb-4">
            Showing {bookings.length} bookings
          </p>
          
          {/* Table */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700">Unit</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-neutral-700">Dates</th>
                  <th className="text-right px-4 py-3 font-semibold text-neutral-700">Nights</th>
                  <th className="text-right px-4 py-3 font-semibold text-neutral-700">Net Income</th>
                  <th className="text-center px-4 py-3 font-semibold text-neutral-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={booking.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="px-4 py-3 text-neutral-900">
                      {booking.unitId === 'robins-roost' ? "Robin's Roost" :
                       booking.unitId === 'doves-den' ? "Dove's Den" :
                       'Stadium District'}
                    </td>
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
                    <td className="px-4 py-3 text-right text-neutral-900">
                      {booking.nights}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                      {formatCurrency(booking.netIncome)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-neutral-200 px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-neutral-900">Delete Booking?</h3>
            </div>
            
            <p className="text-neutral-600 mb-6">
              This will permanently delete this booking. This action cannot be undone.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllBookingsModal;