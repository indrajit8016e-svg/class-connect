import { GraduationCap, ShieldCheck, Crown, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { getFileUrl } from "@/lib/utils";

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  role: "owner" | "admin" | "mentor" | "student";
  online: boolean;
}

interface Props {
  participants: Participant[];
  onlineUserIds: string[];
  onSelectUser?: (id: string) => void;
}

const ParticipantsSidebar = ({ participants, onlineUserIds, onSelectUser }: Props) => {
  const staff = participants.filter((p) => ["owner", "admin", "mentor"].includes(p.role));
  const students = participants.filter((p) => p.role === "student");
  
  const isOnline = (id: string) => onlineUserIds.includes(id);

  const renderUser = (p: Participant, isStaff: boolean = false) => {
    const online = isOnline(p.id);
    return (
      <motion.div 
        key={p.id} 
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => onSelectUser?.(p.id)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors group cursor-pointer"
      >
        <div className="relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ${
            isStaff ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {p.avatar && (p.avatar.startsWith('http') || p.avatar.startsWith('/uploads')) ? (
              <img src={getFileUrl(p.avatar)} alt="" className="w-full h-full object-cover" />
            ) : (
              p.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
            online ? "bg-emerald-500" : "bg-slate-500"
          }`} />
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-sm truncate transition-colors ${
            online ? "text-foreground" : "text-muted-foreground"
          } ${isStaff ? "font-semibold" : ""}`}>
            {p.name}
          </span>
          {p.role === "owner" && <Crown size={12} className="text-amber-500 shrink-0" />}
          {p.role === "admin" && <ShieldCheck size={12} className="text-rose-500 shrink-0" />}
          {p.role === "mentor" && <GraduationCap size={12} className="text-indigo-500 shrink-0" />}
        </div>
      </motion.div>
    );
  };

  const onlineStaff = staff.filter(p => isOnline(p.id));
  const offlineStaff = staff.filter(p => !isOnline(p.id));
  const onlineStudents = students.filter(p => isOnline(p.id));
  const offlineStudents = students.filter(p => !isOnline(p.id));

  return (
    <motion.div 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 240, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="bg-sidebar-custom border-l border-border flex flex-col shrink-0 overflow-hidden shadow-2xl z-10"
    >
      <div className="h-12 flex items-center px-4 border-b border-border bg-background/50 backdrop-blur-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Community</h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-6">
        {(onlineStaff.length > 0 || offlineStaff.length > 0) && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 mb-2">Staff</p>
            <div className="space-y-0.5">
              {onlineStaff.map((p) => renderUser(p, true))}
              {offlineStaff.map((p) => renderUser(p, true))}
            </div>
          </div>
        )}

        {onlineStudents.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 mb-2">Online — {onlineStudents.length}</p>
            <div className="space-y-0.5">
              {onlineStudents.map((p) => renderUser(p))}
            </div>
          </div>
        )}

        {offlineStudents.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2 mb-2">Offline — {offlineStudents.length}</p>
            <div className="space-y-0.5">
              {offlineStudents.map((p) => renderUser(p))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ParticipantsSidebar;
