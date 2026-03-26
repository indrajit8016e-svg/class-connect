import { Plus, Users, Hash, MoreVertical, LogOut, Copy, MessageSquarePlus, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface Props {
  groups: any[];
  dmFeed: any[];
  activeGroupId: string;
  activeDmUserId: string | null;
  onSelectGroup: (id: string) => void;
  onSelectDm: (id: string) => void;
  onCreateGroup: () => void;
  onLeaveGroup?: (id: string) => void;
}

const GroupsPanel = ({ groups, dmFeed, activeGroupId, activeDmUserId, onSelectGroup, onSelectDm, onCreateGroup, onLeaveGroup }: Props) => {
  const [newDmId, setNewDmId] = useState("");
  const [showNewDm, setShowNewDm] = useState(false);

  const handleCopyGroupId = (id: string) => {
    navigator.clipboard.writeText(id);
    // Could add a toast here
  };

  const handleStartDm = () => {
    if (newDmId.trim()) {
      onSelectDm(newDmId.trim());
      setNewDmId("");
      setShowNewDm(false);
    }
  };

  return (
    <div className="w-64 bg-sidebar-custom border-r border-border flex flex-col shrink-0">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">My Groups</h2>
          <button
            onClick={onCreateGroup}
            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
            title="Create or Join Group"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 space-y-4">
        <div className="space-y-1.5">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Hash size={20} className="text-muted-foreground/60" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">No groups yet</p>
              <button 
                onClick={onCreateGroup}
                className="text-[11px] text-primary hover:text-primary/80 mt-2 font-semibold"
              >
                Create your first one
              </button>
            </div>
          ) : (
            groups.map((group) => {
              const isActive = group.id === activeGroupId;
              const hasUnread = group.unreadCount > 0;

              return (
                <div key={group.id} className="relative group">
                  <button
                    onClick={() => onSelectGroup(group.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 border relative ${
                      isActive
                        ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5"
                        : "hover:bg-muted/50 border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-transform ${isActive ? "scale-105" : "group-hover:scale-105"}`}
                        style={{
                          backgroundColor: `hsl(${group.color || '220 72% 50%'} / 0.15)`,
                          color: `hsl(${group.color || '220 72% 50%'})`,
                        }}
                      >
                        {group.shortName}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-sm font-semibold truncate transition-colors ${isActive ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"}`}>
                          {group.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1 opacity-60">
                          <Users size={10} className="text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-medium">{group.memberCount || 0} members</span>
                        </div>
                      </div>
                    </div>
                    
                    {hasUnread && !isActive && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-4.5 flex items-center justify-center px-1 shadow-sm border-2 border-background"
                      >
                        {group.unreadCount}
                      </motion.div>
                    )}
                  </button>
                  
                  <div className={`absolute top-3 right-2 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors">
                          <MoreVertical size={14} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => handleCopyGroupId(group.id)}
                        >
                          <Copy size={14} className="mr-2" />
                          Copy Group ID
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-rose-500 focus:text-rose-500 cursor-pointer"
                          onClick={() => onLeaveGroup?.(group.id)}
                        >
                          <LogOut size={14} className="mr-2" />
                          Leave Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Direct Messages Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Direct Messages</h2>
            <button
              onClick={() => setShowNewDm(!showNewDm)}
              className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
              title="Start New Chat"
            >
              <MessageSquarePlus size={16} />
            </button>
          </div>

          <AnimatePresence>
            {showNewDm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-border">
                  <input
                    type="text"
                    placeholder="Enter User ID..."
                    value={newDmId}
                    onChange={(e) => setNewDmId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStartDm()}
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none px-1"
                  />
                  <button
                    onClick={handleStartDm}
                    className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-medium hover:bg-primary/90"
                  >
                    Chat
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            {dmFeed.map((dmUser) => {
              const isActive = dmUser.id === activeDmUserId;
              return (
                <button
                  key={dmUser.id}
                  onClick={() => onSelectDm(dmUser.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {dmUser.avatar ? (
                      <img src={dmUser.avatar} alt={dmUser.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{dmUser.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium truncate">{dmUser.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupsPanel;
