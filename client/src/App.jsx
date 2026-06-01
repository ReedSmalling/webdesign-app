import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Outreach from './pages/Outreach';
import Inbox from './pages/Inbox';
import WebsiteBuilder from './pages/WebsiteBuilder';
import Clients from './pages/Clients';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import { api } from './api';

function Layout({ children, unreadCount, onUnreadChange }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Sidebar unreadCount={unreadCount} />
      <main className="ml-64 min-h-screen p-8">{children}</main>
    </div>
  );
}

function AppRoutes({ unreadCount, setUnreadCount }) {
  return (
    <Routes>
      <Route path="/" element={<Layout unreadCount={unreadCount}><Dashboard /></Layout>} />
      <Route path="/leads" element={<Layout unreadCount={unreadCount}><Leads /></Layout>} />
      <Route path="/outreach" element={<Layout unreadCount={unreadCount}><Outreach /></Layout>} />
      <Route
        path="/inbox"
        element={
          <Layout unreadCount={unreadCount}>
            <Inbox onUnreadChange={setUnreadCount} />
          </Layout>
        }
      />
      <Route path="/website-builder" element={<Layout unreadCount={unreadCount}><WebsiteBuilder /></Layout>} />
      <Route path="/clients" element={<Layout unreadCount={unreadCount}><Clients /></Layout>} />
      <Route path="/payments" element={<Layout unreadCount={unreadCount}><Payments /></Layout>} />
      <Route path="/settings" element={<Layout unreadCount={unreadCount}><Settings /></Layout>} />
    </Routes>
  );
}

export default function App() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.inbox.list('unread')
      .then((data) => setUnreadCount(data.length))
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes unreadCount={unreadCount} setUnreadCount={setUnreadCount} />
    </BrowserRouter>
  );
}
