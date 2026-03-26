import { Search, Bell, Video, User, LogOut, Sun, Moon, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  groupId: string;
  groupName: string;
  count: number;
  lastMessage: string;
  time: number;
}

interface Props {
  onJoinClass: () => void;
  onSelectGroup?: (groupId: string) => void;
}

const Navbar = ({ onJoinClass, onSelectGroup }: Props) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const handleNewNotification = (event: any) => {
      const { groupId, groupName, content } = event.detail;
      
      setNotifications(prev => {
        const existingIndex = prev.findIndex(n => n.groupId === groupId);
        const newNotification: Notification = {
          groupId,
          groupName,
          count: existingIndex !== -1 ? prev[existingIndex].count + 1 : 1,
          lastMessage: content,
          time: Date.now()
        };

        const otherNotifications = prev.filter(n => n.groupId !== groupId);
        return [newNotification, ...otherNotifications];
      });
    };

    window.addEventListener('new_notification', handleNewNotification);
    return () => window.removeEventListener('new_notification', handleNewNotification);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (groupId: string) => {
    onSelectGroup?.(groupId);
    setNotifications(prev => prev.filter(n => n.groupId !== groupId));
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 shrink-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <h1 className="font-display font-bold text-lg text-foreground tracking-tight">MedAI</h1>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search doubts, cases, UKMLA content…"
          className="w-full bg-muted text-sm text-foreground placeholder:text-muted-foreground rounded-lg pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-ring/30 transition-all"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onJoinClass}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:shadow-md"
        >
          <Video size={16} />
          Join Live Mentoring
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 bg-card border-border shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h4 className="font-bold text-sm">Notifications</h4>
              {notifications.length > 0 && (
                <button onClick={clearNotifications} className="text-[10px] text-primary font-bold hover:underline">Clear All</button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
              <AnimatePresence initial={false}>
                {notifications.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="p-10 text-center"
                  >
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-muted-foreground/40" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">All caught up!</p>
                  </motion.div>
                ) : (
                  notifications.map((n) => (
                    <motion.div 
                      key={n.groupId} 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleNotificationClick(n.groupId)}
                      className="p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group relative"
                    >
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <MessageSquare size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate pr-2">{n.groupName}</p>
                            {n.count > 1 && (
                              <span className="bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                                {n.count} NEW
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1 italic">"{n.lastMessage}"</p>
                          <p className="text-[9px] text-slate-400 mt-1 font-medium uppercase tracking-tighter">Just now</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shadow-inner">
                {user.name?.substring(0, 2).toUpperCase() || <User size={16} />}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-xl">
            <DropdownMenuLabel className="p-3">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground font-normal truncate">{user.email}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-2 w-fit uppercase font-black tracking-widest">{user.role}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer py-2.5 font-medium text-xs"
              onClick={() => {
                navigator.clipboard.writeText(user.id);
              }}
            >
              Copy My ID
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2.5 font-medium text-xs">Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2.5 text-rose-500 focus:text-rose-500 font-medium text-xs" onClick={handleLogout}>
              <LogOut size={14} className="mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
