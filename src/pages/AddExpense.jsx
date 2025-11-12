import { useState, useEffect } from 'react';
import { X, Receipt, DollarSign } from 'lucide-react';
import { eventsAPI, authAPI } from '../services/api';
import './AddExpense.css';

const AddExpense = ({ event, expense, expenseIndex, onClose, onExpenseAdded }) => {
  const isEditing = expense !== null && expenseIndex !== null;
  
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [note, setNote] = useState('');
  const [participants, setParticipants] = useState(
    event.members.map(member => ({
      email: member.email,
      responsible_for: 0,
      paid: 0
    }))
  );
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

// If editing, populate the form with existing data
useEffect(() => {
  if (isEditing && expense) {
    setAmount(expense.amount.toString());
    setCurrency(expense.currency);
    setNote(expense.note || '');
    
    // Populate participants from expense
    console.log('Editing expense:', expense); // Debug log
    const expenseParticipants = expense.participants || [];
    const updatedParticipants = event.members.map(member => {
      const existingParticipant = expenseParticipants.find(
        p => p.user_id === member.user_id
      );
      
      if (existingParticipant) {
        console.log('Found participant:', existingParticipant); // Debug log
        
        // Get the actual values from the participant
        const responsibleFor = existingParticipant.responsible_for !== undefined 
          ? existingParticipant.responsible_for 
          : (existingParticipant.share || 0);
        
        const paid = existingParticipant.paid !== undefined 
          ? existingParticipant.paid 
          : 0;
        
        return {
          email: member.email,
          responsible_for: responsibleFor,
          paid: paid
        };
      }
      
      return {
        email: member.email,
        responsible_for: 0,
        paid: 0
      };
    });
    
    console.log('Updated participants:', updatedParticipants); // Debug log
    setParticipants(updatedParticipants);
  }
}, [isEditing, expense, event.members]);

  // Get user name from email
  const getUserName = (email) => {
    const user = allUsers.find(u => u.email === email);
    return user?.name || email;
  };

  // Update participant's responsible amount
  const updateResponsible = (email, value) => {
    setParticipants(participants.map(p => 
      p.email === email ? { ...p, responsible_for: parseFloat(value) || 0 } : p
    ));
  };

  // Update participant's paid amount
  const updatePaid = (email, value) => {
    setParticipants(participants.map(p => 
      p.email === email ? { ...p, paid: parseFloat(value) || 0 } : p
    ));
  };

  // Split equally among all participants
  const splitEqually = () => {
    const totalAmount = parseFloat(amount) || 0;
    const perPerson = totalAmount / participants.length;
    
    setParticipants(participants.map(p => ({
      ...p,
      responsible_for: perPerson
    })));
  };

  // Set one person as payer
  const setAsPayer = (email) => {
    const totalAmount = parseFloat(amount) || 0;
    
    setParticipants(participants.map(p => ({
      ...p,
      paid: p.email === email ? totalAmount : 0
    })));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const totalResponsible = participants.reduce((sum, p) => sum + p.responsible_for, 0);
    const totalPaid = participants.reduce((sum, p) => sum + p.paid, 0);

    if (Math.abs(totalResponsible - parseFloat(amount)) > 0.01) {
      setError(`Total responsible (${totalResponsible.toFixed(2)}) must equal amount (${amount})`);
      return;
    }

    if (Math.abs(totalPaid - parseFloat(amount)) > 0.01) {
      setError(`Total paid (${totalPaid.toFixed(2)}) must equal amount (${amount})`);
      return;
    }

    setLoading(true);

    const expenseData = {
      amount: parseFloat(amount),
      currency,
      participants: participants.filter(p => p.responsible_for > 0 || p.paid > 0),
      note
    };

    try {
      if (isEditing) {
        await eventsAPI.updateExpense(event.id, expenseIndex, expenseData);
      } else {
        await eventsAPI.addExpense(event.id, expenseData);
      }

      onExpenseAdded();
      onClose();
    } catch (err) {
      console.error('Error saving expense:', err);
      setError(err.response?.data?.detail || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const totalResponsible = participants.reduce((sum, p) => sum + p.responsible_for, 0);
  const totalPaid = participants.reduce((sum, p) => sum + p.paid, 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="close-btn"><X size={24} /></button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Amount and Currency */}
          <div className="form-row">
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="ILS">ILS</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Note */}
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Dinner at restaurant"
            />
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <button type="button" onClick={splitEqually} className="quick-btn">
              Split Equally
            </button>
          </div>

          {/* Participants Table */}
          <div className="participants-section">
            <h3>Participants</h3>
            <table className="participants-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Responsible For</th>
                  <th>Paid</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.email}>
                    <td>{getUserName(p.email)}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={p.responsible_for}
                        onChange={(e) => updateResponsible(p.email, e.target.value)}
                        className="small-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        value={p.paid}
                        onChange={(e) => updatePaid(p.email, e.target.value)}
                        className="small-input"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => setAsPayer(p.email)}
                        className="small-btn"
                      >
                        Set as Payer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total:</strong></td>
                  <td><strong>{totalResponsible.toFixed(2)}</strong></td>
                  <td><strong>{totalPaid.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Expense' : 'Add Expense')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;