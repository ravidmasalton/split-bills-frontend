import { useState, useEffect } from 'react';
import { eventsAPI, authAPI } from '../services/api';
import './FinalizeEvent.css';

const FinalizeEvent = ({ event, onClose }) => {
  const [currency, setCurrency] = useState(event.base_currency || 'USD');
  const [summary, setSummary] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all users for displaying names
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authAPI.getAllUsers();
        setAllUsers(response.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  // Get user name from user_id
  const getUserName = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    if (user) return user.name;
    
    // If not found by ID, try to find by email in event members
    const member = event.members?.find(m => m.user_id === userId);
    if (member) {
      const userByEmail = allUsers.find(u => u.email === member.email);
      return userByEmail?.name || member.email;
    }
    
    return userId;
  };

  // Handle finalize
  const handleFinalize = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await eventsAPI.finalizeEvent(event.id, currency);
      console.log('Finalize response:', response.data);
      setSummary(response.data);
    } catch (err) {
      console.error('Error finalizing event:', err);
      setError(err.response?.data?.detail || 'Failed to finalize event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Finalize Event: {event.name}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!summary ? (
          // Before finalization
          <div className="finalize-form">
            <p>This will calculate the final balances and determine who owes whom.</p>
            
            <div className="form-group">
              <label>Final Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="ILS">ILS</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <button 
              onClick={handleFinalize} 
              disabled={loading}
              className="finalize-btn-action"
            >
              {loading ? 'Calculating...' : 'Calculate Final Balances'}
            </button>
          </div>
        ) : (
          // After finalization - show summary
          <div className="summary-content">
            <div className="summary-header">
              <h3>Event Summary</h3>
              <p className="total-amount">
                Total Expenses: {summary.base_currency} {summary.total_expenses?.toFixed(2)}
              </p>
            </div>

            {/* Member Balances */}
            <div className="balances-section">
              <h4>Final Balances</h4>
              <div className="balances-list">
                {Object.entries(summary.member_balances || {}).map(([userId, balance]) => (
                  <div key={userId} className={`balance-item ${balance >= 0 ? 'positive' : 'negative'}`}>
                    <span className="member-name">{getUserName(userId)}</span>
                    <span className="balance-amount">
                      {balance >= 0 ? '+' : ''}{summary.base_currency} {balance.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments Needed */}
            <div className="payments-section">
              <h4>Payments Needed</h4>
              {(!summary.payments_needed || summary.payments_needed.length === 0) ? (
                <p className="all-settled">All settled! No payments needed. 🎉</p>
              ) : (
                <div className="payments-list">
                  {summary.payments_needed.map((payment, index) => (
                    <div key={index} className="payment-card">
                      <div className="payment-info">
                        <span className="from-user">{getUserName(payment.from_user_id)}</span>
                        <span className="arrow">→</span>
                        <span className="to-user">{getUserName(payment.to_user_id)}</span>
                      </div>
                      <div className="payment-amount">
                        {payment.currency} {payment.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={onClose} className="close-summary-btn">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalizeEvent;