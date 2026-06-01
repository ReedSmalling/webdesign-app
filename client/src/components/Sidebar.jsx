import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/leads', label: 'Leads', icon: '🎯' },
  { to: '/outreach', label: 'Outreach', icon: '📤' },
  { to: '/inbox', label: 'Inbox', icon: '📥', badge: true },
  { to: '/website-builder', label: 'Website Builder', icon: '🌐' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/payments', label: 'Payments', icon: '💳' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ unreadCount = 0 }) {
  return (
    <aside className="fixed left-0 top-0 flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
      <div className="border-b border-slate-700 px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight">WebDesign Pro</h1>
        <p className="mt-1 text-xs text-slate-400">Business Automation</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="text-lg">{icon}</span>
            <span className="flex-1">{label}</span>
            {badge && unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-700 px-6 py-4">
        <p className="text-xs text-slate-500">API: localhost:5000</p>
      </div>
    </aside>
  );
}
