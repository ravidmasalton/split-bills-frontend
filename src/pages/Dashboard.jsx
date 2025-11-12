import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="info-card">
          <h3>Your Profile</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>

        <div className="info-card">
          <h3>Getting Started</h3>
          <p>This is your dashboard. Here you'll be able to:</p>
          <ul>
            <li>Create new events</li>
            <li>View your events</li>
            <li>Add expenses</li>
            <li>Split bills with friends</li>
          </ul>
          <p className="coming-soon">More features coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;