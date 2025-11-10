import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsAPI, authAPI } from '../services/api';
import AddExpense from './AddExpense';
import FinalizeEvent from './FinalizeEvent';
import './EventDetails.css';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showFinalize, setShowFinalize] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(null);

  // Fetch all users for displaying names
  const fetchUsers = async () => {
    try {
      const response = await authAPI.getAllUsers();
      setAllUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Fetch event details
  const fetchEvent = async () => {
    setLoading(true);
    try {
      const response = await eventsAPI.getEvent(eventId);
      console.log('Event data:', response.data);
      setEvent(response.data);
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEvent();
  }, [eventId]);

  // Get user name from user_id or email
  const getUserName = (userId) => {
    let user = allUsers.find(u => u.id === userId);
    
    if (!user) {
      user = allUsers.find(u => u.email === userId);
    }
    
    if (!user) {
      const member = event?.members?.find(m => m.user_id === userId || m.email === userId);
      if (member) {
        user = allUsers.find(u => u.email === member.email);
      }
    }
    
    return user?.name || userId;
  };

  // Handle expense added
  const handleExpenseAdded = () => {
    fetchEvent();
    setEditingExpense(null);
    setEditingExpenseIndex(null);
  };

  // Handle delete expense
  const handleDeleteExpense = async (index) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await eventsAPI.deleteExpense(eventId, index);
      fetchEvent();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense');
    }
  };

  // Handle edit expense
  const handleEditExpense = (expense, index) => {
    setEditingExpense(expense);
    setEditingExpenseIndex(index);
    setShowAddExpense(true);
  };

  if (loading) {
    return <div className="loading">Loading event...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate('/events')}>Back to Events</button>
      </div>
    );
  }

  if (!event) {
    return <div className="loading">Event not found</div>;
  }

  return (
    <div className="event-details-container">
      {/* Header */}
      <div className="event-header">
        <button onClick={() => navigate('/events')} className="back-btn">
          ← Back to Events
        </button>
        <h1>{event.name}</h1>
      </div>

      {/* Event Info */}
      <div className="event-info-section">
        <div className="info-card">
          <h3>Event Information</h3>
          <p><strong>Base Currency:</strong> {event.base_currency}</p>
          <p><strong>Total Expenses:</strong> {event.base_currency} {event.total_expenses?.toFixed(2) || '0.00'}</p>
          <p><strong>Created:</strong> {new Date(event.created_at).toLocaleDateString()}</p>
        </div>

        <div className="info-card">
          <h3>Members ({event.members?.length || 0})</h3>
          <ul className="members-list">
            {event.members?.map(member => (
              <li key={member.user_id}>
                {getUserName(member.user_id)} - Balance: {event.base_currency} {member.balance?.toFixed(2) || '0.00'}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-section">
        <button onClick={() => {
          setEditingExpense(null);
          setEditingExpenseIndex(null);
          setShowAddExpense(true);
        }} className="add-expense-btn">
          + Add Expense
        </button>
        <button onClick={() => setShowFinalize(true)} className="finalize-btn">
          Finalize Event
        </button>
      </div>

      {/* Expenses List */}
      <div className="expenses-section">
        <h2>Expenses ({event.expenses?.length || 0})</h2>
        
        {(!event.expenses || event.expenses.length === 0) ? (
          <div className="empty-state">
            <p>No expenses yet. Add your first expense!</p>
          </div>
        ) : (
          <div className="expenses-list">
            {event.expenses.map((expense, index) => (
              <div key={index} className="expense-card">
                <div className="expense-header">
                  <h4>{expense.note || 'Expense'}</h4>
                  <div className="expense-actions">
                    <span className="expense-amount">
                      {expense.currency} {expense.amount.toFixed(2)}
                    </span>
                    <button 
                      onClick={() => handleEditExpense(expense, index)}
                      className="edit-btn"
                      title="Edit expense"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteExpense(index)}
                      className="delete-btn"
                      title="Delete expense"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="expense-details">
                  <p><strong>Date:</strong> {new Date(expense.created_at).toLocaleDateString()}</p>
                  {expense.exchange_rate && (
                    <p><strong>Exchange Rate:</strong> {expense.exchange_rate}</p>
                  )}
                  <div className="participants">
                    <strong>Split:</strong>
                    <ul>
                      {expense.participants
                        ?.filter(p => p.share > 0)
                        .map((p, i) => (
                          <li key={i}>
                            {getUserName(p.user_id)}: {expense.currency} {p.share.toFixed(2)}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      {showAddExpense && (
        <AddExpense
          event={event}
          expense={editingExpense}
          expenseIndex={editingExpenseIndex}
          onClose={() => {
            setShowAddExpense(false);
            setEditingExpense(null);
            setEditingExpenseIndex(null);
          }}
          onExpenseAdded={handleExpenseAdded}
        />
      )}

      {/* Finalize Event Modal */}
      {showFinalize && (
        <FinalizeEvent
          event={event}
          onClose={() => setShowFinalize(false)}
        />
      )}
    </div>
  );
};

export default EventDetails;