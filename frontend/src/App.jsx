import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { api } from './services/api';
import Navbar from './components/Navbar';
import StatusStrip from './components/StatusStrip';
import AdminSidebar from './components/AdminSidebar';
import ForceChangePasswordModal from './components/ForceChangePasswordModal';

// Pages
import Login from './pages/Login';
import UserPipeline from './pages/UserPipeline';
import UserHistory from './pages/UserHistory';
import UserProfile from './pages/UserProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ReviewQueue from './pages/admin/ReviewQueue';
import Submissions from './pages/admin/Submissions';
import PesticideTable from './pages/admin/PesticideTable';
import ModelRegistry from './pages/admin/ModelRegistry';
import SystemSettings from './pages/admin/SystemSettings';
import UserManagement from './pages/admin/UserManagement';
import AuditLogs from './pages/admin/AuditLogs';

function MainApp() {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState('pipeline');
  const [adminTab, setAdminTab] = useState('dashboard');

  // Admin system status & pending review queue count
  const [systemStatus, setSystemStatus] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      async function pollStatus() {
        try {
          const status = await api.admin.getSystemStatus();
          setSystemStatus(status);
        } catch (err) {
          console.warn('Could not fetch admin status:', err);
        }
      }
      pollStatus();
      const interval = setInterval(pollStatus, 15000); // 15s heartbeat
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  // Set default view on login
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin && activeView === 'pipeline') {
        setActiveView('admin-dashboard');
      }
    }
  }, [isAuthenticated, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-mono text-sm text-pine">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-pine border-t-transparent rounded-full animate-spin"></div>
          <span className="font-heading font-semibold">Initializing Leafline Agronomics...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated screen: strictly Login only (zero self-signup anywhere in app)
  if (!isAuthenticated) {
    return <Login />;
  }

  const isAdminView = activeView.startsWith('admin-');

  return (
    <div className="min-h-screen bg-paper flex flex-col font-body selection:bg-pine selection:text-paper">
      {/* Forced Password Change Modal for provisioned accounts */}
      <ForceChangePasswordModal />

      {/* Navigation Header */}
      <Navbar activeView={activeView} setActiveView={setActiveView} />

      {/* Admin Experience: Top Status Strip + Sidebar Dashboard Shell */}
      {isAdmin && isAdminView ? (
        <div className="flex-1 flex flex-col">
          {/* Real-time System Status Strip */}
          <StatusStrip systemStatus={systemStatus} />

          <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto">
            {/* Sidebar Navigation Shell */}
            <AdminSidebar
              activeTab={adminTab}
              setActiveTab={setAdminTab}
              pendingReviewsCount={systemStatus?.pending_reviews || 0}
            />

            {/* Admin Content Area */}
            <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
              {adminTab === 'dashboard' && (
                <AdminDashboard onNavigateToQueue={() => setAdminTab('review-queue')} />
              )}
              {adminTab === 'review-queue' && <ReviewQueue />}
              {adminTab === 'submissions' && <Submissions />}
              {adminTab === 'pesticides' && <PesticideTable />}
              {adminTab === 'models' && <ModelRegistry />}
              {adminTab === 'settings' && <SystemSettings />}
              {adminTab === 'users' && <UserManagement />}
              {adminTab === 'audit-logs' && <AuditLogs />}
            </main>
          </div>
        </div>
      ) : (
        /* Grower Experience: Pipeline, History & Farm Profile */
        <main className="flex-1">
          {activeView === 'pipeline' && <UserPipeline />}
          {activeView === 'history' && <UserHistory />}
          {activeView === 'profile' && <UserProfile />}
        </main>
      )}

      {/* Persistent Agricultural Footer */}
      <footer className="bg-paper border-t border-pine/15 py-4 text-center text-xs font-mono text-ink/50 no-print">
        Leafline Sunflower Foliar Diagnosis Platform • Dual Role Enterprise Edition
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
