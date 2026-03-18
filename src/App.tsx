import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/Layout/AuthGuard';
import TopNav from './components/Layout/TopNav';

import LoginPage from './routes/LoginPage';
import RegisterPage from './routes/RegisterPage';
import HomePage from './routes/HomePage';
import BeersPage from './routes/BeersPage';
import MyStatsPage from './routes/MyStatsPage';
import DebugPage from './routes/DebugPage';
import SettingsPage from './routes/SettingsPage';
import FeatureRequestsPage from './routes/FeatureRequestsPage';
import DashboardPage from './routes/DashboardPage';
import NotFoundPage from './routes/NotFoundPage';

/**
 * We use HashRouter (URL hash-based routing) so GitHub Pages can serve
 * the app without any server-side redirect rules. All routes appear as
 * https://user.github.io/repo/#/route instead of /route.
 */
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — wrapped in AuthGuard */}
          <Route
            element={
              <>
                <TopNav />
                <main className="main-content">
                  <AuthGuard />
                </main>
              </>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/beers" element={<BeersPage />} />
            <Route path="/stats" element={<MyStatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/requests" element={<FeatureRequestsPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/debug" element={<DebugPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
