import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Images,
  FlaskConical,
  Cpu,
  Sliders,
  Users,
  ShieldCheck,
} from 'lucide-react';

export default function AdminSidebar({ activeTab, setActiveTab, pendingReviewsCount = 0 }) {
  const menuItems = [
    { id: 'dashboard', label: 'Overview & Regional', icon: LayoutDashboard },
    { id: 'review-queue', label: 'Review Queue', icon: Clock, badge: pendingReviewsCount },
    { id: 'submissions', label: 'All Submissions', icon: Images },
    { id: 'pesticides', label: 'Pesticide Reference', icon: FlaskConical },
    { id: 'models', label: 'Model Registry', icon: Cpu },
    { id: 'settings', label: 'System Configuration', icon: Sliders },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'audit-logs', label: 'Audit & Governance', icon: ShieldCheck },
  ];

  return (
    <aside className="w-full lg:w-64 bg-pine text-paper flex-shrink-0 border-r border-pine-dark p-4 space-y-6">
      <div className="px-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-moss-light font-bold">
          Admin Shell
        </span>
        <h2 className="font-heading font-bold text-xl text-paper mt-0.5">
          Platform Operations
        </h2>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-moss text-paper shadow-sm'
                  : 'text-paper/75 hover:bg-pine-light hover:text-paper'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-paper' : 'text-moss-light'}`} />
                <span className="font-heading">{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber text-ink">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-pine-light px-2 text-[11px] font-mono text-paper/50">
        Leafline Agronomics v1.0.0
      </div>
    </aside>
  );
}
