import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, Plane, Settings, Shirt, Sparkles, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Navigation grouped by workflow
const navGroups = [
  {
    label: 'Wardrobe',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Outfits', href: '/outfits', icon: Shirt },
    ],
  },
  {
    label: 'Travel',
    items: [
      { name: 'Pack for Trip', href: '/packing', icon: Plane },
    ],
  },
  {
    label: 'Share',
    items: [
      { name: 'Showcase', href: '/showcase', icon: Sparkles },
    ],
  },
  {
    label: 'Manage',
    items: [
      { name: 'Phase Out', href: '/phase-out', icon: Trash2 },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen sticky top-0 border-r bg-card/50 backdrop-blur-xl flex flex-col">
      {/* Logo */}
      <div className="p-6 shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Package className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Nomad</h1>
            <p className="text-xs text-muted-foreground">Wardrobe Manager</p>
          </div>
        </Link>
      </div>

      <div className="h-px bg-border shrink-0" />

      {/* Navigation with groups */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label}>
            {/* Section label */}
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>

            {/* Section items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Divider after each group except the last */}
            {groupIndex < navGroups.length - 1 && (
              <div className="h-px bg-border/50 mt-4" />
            )}
          </div>
        ))}
      </nav>

      <div className="h-px bg-border shrink-0" />

      {/* Settings - Always at bottom */}
      <div className="p-4 shrink-0">
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            location.pathname === '/settings'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
