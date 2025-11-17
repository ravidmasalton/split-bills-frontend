import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import './ExpenseDetails.css';

const ExpenseDetails = ({ expense, event, onClose }) => {
  const [allUsers, setAllUsers] = useState([]);

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
    let user = allUsers.find(u => u.id === userId);
    
    if (!user) {
      const member = event?.members?.find(m => m.user_id === userId);
      if (member) {
        user = allUsers.find(u => u.email === member.email);
      }
    }
    
    return user?.name || userId;
  };

  // Get detailed participant info from the raw expense data
  const getParticipantDetails = () => {
    // The expense.participants we see in the UI only has user_id and share
    // But we need to reconstruct the responsible_for and paid amounts
    
    // For now, we'll work with what we have
    // In a real scenario, we'd want the backend to return this info
    
    return expense.participants?.filter(p => p.share >= 0).map(p => ({
      name: getUserName(p.user_id),
      share: p.share,
      // These would ideally come from the backend
      responsible_for: p.responsible_for || p.share,
      paid: p.paid || 0
    })) || [];
  };

  const participants = getParticipantDetails();
  const totalPaid = participants.reduce((sum, p) => sum + (p.paid || 0), 0);
  const totalResponsible = participants.reduce((sum, p) => sum + p.responsible_for, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Expense Details</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="expense-details-content">
          {/* Expense Summary */}
          <div className="detail-section">
            <h3>{expense.note || 'Expense'}</h3>
            <div className="detail-row">
              <span className="detail-label">Total Amount:</span>
              <span className="detail-value highlight">{expense.currency} {expense.amount.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{new Date(expense.created_at).toLocaleDateString()}</span>
            </div>
            {expense.exchange_rate && (
              <div className="detail-row">
                <span className="detail-label">Exchange Rate:</span>
                <span className="detail-value">{expense.exchange_rate}</span>
              </div>
            )}
          </div>

          {/* Participants Breakdown */}
          <div className="detail-section">
            <h3>Participants Breakdown</h3>
            
            <table className="details-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Responsible For</th>
                  <th>Paid</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, index) => {
                  const balance = (p.paid || 0) - p.responsible_for;
                  return (
                    <tr key={index}>
                      <td className="name-col">{p.name}</td>
                      <td className="amount-col">
                        {expense.currency} {p.responsible_for.toFixed(2)}
                      </td>
                      <td className="amount-col paid-col">
                        {expense.currency} {(p.paid || 0).toFixed(2)}
                      </td>
                      <td className={`amount-col ${balance >= 0 ? 'positive' : 'negative'}`}>
                        {balance >= 0 ? '+' : ''}{expense.currency} {balance.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total:</strong></td>
                  <td><strong>{expense.currency} {totalResponsible.toFixed(2)}</strong></td>
                  <td><strong>{expense.currency} {totalPaid.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Summary */}
          <div className="detail-section summary-section">
            <h4>Summary</h4>
            <div className="summary-cards">
              {participants.map((p, index) => {
                const balance = (p.paid || 0) - p.responsible_for;
                if (Math.abs(balance) < 0.01) return null;
                
                return (
                  <div key={index} className={`summary-card ${balance >= 0 ? 'positive' : 'negative'}`}>
                    <strong>{p.name}</strong>
                    <span>
                      {balance >= 0 
                        ? `is owed ${expense.currency} ${balance.toFixed(2)}`
                        : `owes ${expense.currency} ${Math.abs(balance).toFixed(2)}`
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button onClick={onClose} className="close-details-btn">
          Close
        </button>
      </div>
    </div>
  );
};

export default ExpenseDetails;