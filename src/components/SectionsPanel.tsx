import { MessageSquare, FileText, FolderOpen, Megaphone, Code, Upload, BookOpen, Lightbulb, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap: Record<string, React.ElementType> = {
  "message-square": MessageSquare,
  "file-text": FileText,
  "folder-open": FolderOpen,
  megaphone: Megaphone,
  code: Code,
  upload: Upload,
  "book-open": BookOpen,
  lightbulb: Lightbulb,
};

interface Props {
  group: any;
  sections: any[];
  activeSectionId: string;
  onSelectSection: (id: string) => void;
  onCreateSection?: () => void;
}

const SectionsPanel = ({ group, sections, activeSectionId, onSelectSection, onCreateSection }: Props) => {
  return (
    <motion.div 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 224, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-middle border-r border-border flex flex-col shrink-0 overflow-hidden shadow-sm z-10"
    >
      {/* Group header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-background/30">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-foreground truncate uppercase tracking-tight">{group?.name || "Select Group"}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-medium">{group?.description || "Discussions"}</p>
        </div>
        {onCreateSection && (
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCreateSection}
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors ml-2 shrink-0 bg-background/50 rounded-md border border-border/50"
            title="Create Channel"
          >
            <Plus size={14} />
          </motion.button>
        )}
      </div>

      {/* Sections list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
        <AnimatePresence>
          {sections.map((section, index) => {
            const Icon = iconMap[section.icon] || MessageSquare;
            const isActive = section.id === activeSectionId;
            return (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelectSection(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 group relative ${
                  isActive
                    ? "bg-background text-foreground font-semibold shadow-sm border border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-4 bg-primary rounded-r-full" 
                  />
                )}
                <Icon size={16} className={`transition-colors ${isActive ? "text-primary" : "group-hover:text-primary/70"}`} />
                <span className="truncate">{section.name}</span>
                {section.unread && (
                  <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-4.5 flex items-center justify-center px-1.5 shadow-sm">
                    {section.unread}
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SectionsPanel;
