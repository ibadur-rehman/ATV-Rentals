import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation2, LOCATIONS } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LayoutDashboard, 
  History, 
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const { selectedLocation, setSelectedLocation } = useLocation2();
  const [location, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : true; // Default to collapsed
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isDesktopCollapsed));
  }, [isDesktopCollapsed]);

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/call-history", icon: History, label: "Call History" }
  ];

  const isActive = (path: string) => location === path;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="bg-charcoal border-b border-gray-800 sticky top-0 z-40 bg-black">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="lg:hidden text-white hover:text-primary transition-colors"
                data-testid="button-menu-toggle"
              >
                {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-20 rounded-lg bg-accent flex items-center justify-center p-2">
                  <img 
                    src={selectedLocation.logo} 
                    alt={`${selectedLocation.name} Logo`} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white" data-testid="text-brand-name">{selectedLocation.name}</h1>
                  <p className="text-xs text-gray-400 hidden sm:block">AI Receptionist</p>
                </div>
              </div>
            </div>

            {/* Location Selector & User Info & Logout */}
            <div className="flex items-center gap-4">
              <Select
                value={String(selectedLocation.id)}
                onValueChange={(value) => {
                  const loc = LOCATIONS.find((l) => l.id === Number(value));
                  if (loc) setSelectedLocation(loc);
                }}
              >
                <SelectTrigger
                  className="w-[220px] bg-gray-900 border-gray-700 text-white focus:ring-primary"
                  data-testid="select-location"
                >
                  <MapPin className="w-4 h-4 mr-1 text-primary shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {LOCATIONS.map((loc) => (
                    <SelectItem
                      key={loc.id}
                      value={String(loc.id)}
                      className="text-white focus:bg-gray-800 focus:text-white"
                      data-testid={`option-location-${loc.id}`}
                    >
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <NotificationBell />
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="text-white hover:text-primary hover:bg-primary/10 transition-colors"
                data-testid="button-logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Desktop Sidebar - Collapsible */}
          <aside
            className={`hidden lg:block sticky top-[57px] h-[calc(100vh-57px)] bg-black border-r border-gray-800 transition-all duration-300 ${
              isDesktopCollapsed ? "w-[72px]" : "w-64"
            }`}
            data-testid="sidebar-desktop"
          >
            <nav className="p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                if (isDesktopCollapsed) {
                  return (
                    <Tooltip key={item.path}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.path}
                          className={`flex items-center justify-center w-full h-12 rounded-lg transition-all ${
                            active
                              ? "bg-accent text-white shadow-lg"
                              : "text-gray-400 hover:text-white hover:bg-gray-800"
                          }`}
                          data-testid={`nav-${item.path.slice(1)}`}
                          aria-label={item.label}
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                          <span className="sr-only">{item.label}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? "bg-accent text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                    data-testid={`nav-${item.path.slice(1)}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Collapse/Expand Toggle */}
            <div className="absolute bottom-4 left-0 right-0 px-2">
              <button
                onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                className="flex items-center justify-center w-full h-10 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                data-testid="button-toggle-sidebar"
              >
                {isDesktopCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <>
                    <ChevronLeft className="w-5 h-5" />
                    <span className="ml-2 font-medium text-sm">Collapse</span>
                  </>
                )}
              </button>
            </div>
          </aside>

          {/* Mobile Sidebar */}
          <aside
            className={`${
              isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } lg:hidden fixed top-[57px] left-0 h-[calc(100vh-57px)] w-64 bg-black border-r border-gray-800 transition-transform duration-300 z-40`}
            data-testid="sidebar-mobile"
          >
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      active
                        ? "bg-accent text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    }`}
                    data-testid={`nav-mobile-${item.path.slice(1)}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Mobile Overlay */}
          {isMobileSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/80 z-30 top-[57px]"
              onClick={() => setIsMobileSidebarOpen(false)}
              data-testid="overlay-mobile"
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-h-[calc(100vh-57px)]">
            <div className="p-4 md:p-6 lg:p-8">{children}</div>

            {/* Footer - No Border */}
            <footer className="bg-charcoal mt-auto">
              <div className="px-4 md:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-center md:text-left">
                    <p className="text-sm font-medium text-white" data-testid="text-footer-brand">
                      {selectedLocation.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      AI-Powered Receptionist Dashboard
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-xs text-gray-400">
                      © {new Date().getFullYear()} {selectedLocation.name}. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
