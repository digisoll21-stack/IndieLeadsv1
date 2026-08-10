import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import GhostStatus from './components/GhostStatus';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import CampaignEditorPage from './pages/CampaignEditorPage';
import LeadsPage from './pages/LeadsPage';
import CrmPage from './pages/CrmPage';
import InboxesPage from './pages/InboxesPage';
import WarmupPage from './pages/WarmupPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import RepliesPage from './pages/RepliesPage';
import DeliverabilityLabPage from './pages/DeliverabilityLabPage';
import NotificationsPage from './pages/NotificationsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UnsubscribePage from './pages/UnsubscribePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import LandingPage from './pages/LandingPage';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCampaignsPage } from './pages/admin/AdminCampaignsPage';
import { wakeUpServer } from './utils/api-client';

// Support Integration
import { SupportPage } from './pages/SupportPage';
import { CrispChat } from './components/CrispChat';
import AcceptInvitePage from './pages/AcceptInvitePage';
import PageTransition from './components/PageTransition';
import { Toaster } from 'react-hot-toast';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [currentWorkspace, setCurrentWorkspace] = useState({ id: 'w1', name: 'Indie Launch' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showGhostMode, setShowGhostMode] = useState(true);
  const [theme, setTheme] = useState<'ethereal' | 'glass'>('ethereal');
  const [serverReady, setServerReady] = useState(false);
  const location = useLocation();

  // Warm up the Render server as soon as the app loads
  useEffect(() => {
    wakeUpServer().finally(() => setServerReady(true));
  }, []);

  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'ethereal' ? 'glass' : 'ethereal');

  const handleLogin = () => setIsAuthenticated(true);

  // Check if we are in the Admin section
  const isAdminRoute = location.pathname.startsWith('/admin');

  // If authenticated and in admin route, show Admin Layout
  if (isAuthenticated && isAdminRoute) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<PageTransition><AdminDashboardPage /></PageTransition>} />
            <Route path="users" element={<PageTransition><AdminUsersPage /></PageTransition>} />
            <Route path="campaigns" element={<PageTransition><AdminCampaignsPage /></PageTransition>} />
          </Route>
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* Server wake-up banner — shown until first ping completes */}
      {!serverReady && (
        <div className="fixed top-0 inset-x-0 z-[200] bg-amber-500 text-white text-center text-xs font-semibold py-1.5 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
          Connecting to server — please wait a moment...
        </div>
      )}
      {/* Global Helper Components */}
      <GhostStatus isVisible={showGhostMode} />
      <Toaster position="top-right" />
      {isAuthenticated && <CrispChat />}

      {isAuthenticated && (
        <>
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <div className={`fixed inset-y-0 left-0 z-50 lg:static lg:block transition-transform duration-500 ease-out transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar
              theme={theme}
              workspace={currentWorkspace}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </>
      )}

      <div className="flex flex-col flex-1 overflow-hidden w-full relative">
        {isAuthenticated && (
          <Navbar
            theme={theme}
            onToggleTheme={toggleTheme}
            workspace={currentWorkspace}
            onWorkspaceChange={setCurrentWorkspace}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth relative">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              {/* Public Entrance Routes */}
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <PageTransition><LandingPage /></PageTransition>
                  )
                }
              />
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <PageTransition><LoginPage onLogin={handleLogin} /></PageTransition>
                  )
                }
              />
              <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />

              <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
              <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
              <Route path="/accept-invite/:token" element={<PageTransition><AcceptInvitePage /></PageTransition>} />
              <Route path="/unsub/:leadId" element={<PageTransition><UnsubscribePage /></PageTransition>} />
              <Route path="/verify-email" element={<PageTransition><VerifyEmailPage /></PageTransition>} />
              <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
              <Route path="/reset-password" element={<PageTransition><ResetPasswordPage /></PageTransition>} />

              {!isAuthenticated ? (
                <Route path="*" element={<Navigate to="/login" replace />} />
              ) : (
                <>
                  <Route path="/dashboard" element={<PageTransition><DashboardPage theme={theme} /></PageTransition>} />
                  <Route path="/campaigns" element={<PageTransition><CampaignsPage theme={theme} /></PageTransition>} />
                  <Route path="/campaigns/:id" element={<PageTransition><CampaignEditorPage theme={theme} /></PageTransition>} />
                  <Route path="/leads" element={<PageTransition><LeadsPage theme={theme} /></PageTransition>} />
                  <Route path="/crm" element={<PageTransition><CrmPage theme={theme} /></PageTransition>} />
                  <Route path="/replies" element={<PageTransition><RepliesPage theme={theme} /></PageTransition>} />
                  <Route path="/inboxes" element={<PageTransition><InboxesPage theme={theme} /></PageTransition>} />
                  <Route path="/warmup" element={<PageTransition><WarmupPage theme={theme} /></PageTransition>} />
                  <Route path="/lab" element={<PageTransition><DeliverabilityLabPage theme={theme} /></PageTransition>} />
                  <Route path="/analytics" element={<PageTransition><AnalyticsPage theme={theme} /></PageTransition>} />
                  <Route path="/notifications" element={<PageTransition><NotificationsPage theme={theme} /></PageTransition>} />
                  <Route path="/audit-logs" element={<PageTransition><AuditLogsPage theme={theme} workspace={currentWorkspace} /></PageTransition>} />
                  <Route path="/settings" element={<PageTransition><SettingsPage theme={theme} workspace={currentWorkspace} /></PageTransition>} />
                  <Route path="/support" element={<PageTransition><SupportPage /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </HashRouter>
  );
};

export default App;
