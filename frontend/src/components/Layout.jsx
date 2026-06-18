import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Compass, Users, Clock, LogOut, User as UserIcon, FileText, Mic, Briefcase } from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = React.useState(null);
  const [gender, setGender] = React.useState(null);

  React.useEffect(() => {
    if (user?.username) {
      api.get(`/profiles/${user.username}`)
        .then(res => {
          if (res.data.profile_pic) setProfilePic(res.data.profile_pic);
          if (res.data.gender) setGender(res.data.gender);
        })
        .catch(err => console.error("Could not load profile pic", err));
    }

    const handleAvatarUpdate = (e) => {
      // The event can now pass both profile_pic and gender if we want, or just trigger a refetch.
      // For simplicity, we just refetch the profile on update.
      api.get(`/profiles/${user.username}`).then(res => {
        setProfilePic(res.data.profile_pic);
        setGender(res.data.gender);
      });
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [user, api]);

  const getDefaultAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&rounded=true&size=120`;
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/advisor', label: 'AI Career Advisor', icon: <Compass size={20} /> },
    { path: '/resume', label: 'Resume Reviewer', icon: <FileText size={20} /> },
    { path: '/interview', label: 'Mock Interview', icon: <Mic size={20} /> },
    { path: '/peers', label: 'Peer Matching', icon: <Users size={20} /> },
    { path: '/jobs', label: 'Job Matches', icon: <Briefcase size={20} /> },
    { path: '/history', label: 'History', icon: <Clock size={20} /> }
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo-icon small">
            <Compass size={24} color="white" />
          </div>
          <h2 className="text-gradient">CareerCrafter</h2>
        </div>

        <div className="user-profile-widget">
          <div className="avatar" style={{ overflow: 'hidden' }}>
            <img 
              src={profilePic && profilePic !== 'default_photo.png' ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${profilePic}` : getDefaultAvatar(user?.username)} 
              alt="Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div className="user-details">
            <span className="user-name">{user?.username}</span>
            <span className="user-role">Explorer</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="top-decoration shape-1"></div>
        <div className="top-decoration shape-2"></div>
        
        <div className="content-wrapper animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
