import { useState } from "react";
import Navbar from "@/components/Navbar";
import GroupsPanel from "@/components/GroupsPanel";
import SectionsPanel from "@/components/SectionsPanel";
import ChatArea from "@/components/ChatArea";
import ParticipantsSidebar from "@/components/ParticipantsSidebar";
import CreateClassModal from "@/components/CreateClassModal";
import CreateChannelModal from "@/components/CreateChannelModal";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const {
    groups,
    channels,
    messages,
    members,
    typingUsers,
    onlineUserIds,
    activeGroupId,
    setActiveGroupId,
    activeChannelId,
    setActiveChannelId,
    dmFeed,
    activeDmUserId,
    setActiveDmUserId,
    loading,
    sendMessage,
    sendFile,
    leaveGroup,
    verifyMessage,
    flagMessage,
    setTypingStatus,
    refreshGroups,
    refreshChannels
  } = useChat();

  const [showParticipants, setShowParticipants] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [isSectionsCollapsed, setIsSectionsCollapsed] = useState(false);

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const activeDmUser = dmFeed.find((u) => u.id === activeDmUserId);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const currentUserMembership = members.find(m => m.id === user.id);
  const canCreateChannel = currentUserMembership?.role === 'owner' || currentUserMembership?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="rounded-full h-12 w-12 border-b-2 border-primary"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      <Navbar 
        onJoinClass={() => window.open("https://meet.google.com", "_blank")} 
        onSelectGroup={setActiveGroupId}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Groups */}
        <GroupsPanel
          groups={groups.map(g => ({ 
            ...g, 
            shortName: g.short_name || g.name.substring(0, 2).toUpperCase(),
            memberCount: g.memberCount || 0 
          }))}
          dmFeed={dmFeed}
          activeGroupId={activeGroupId || ""}
          activeDmUserId={activeDmUserId}
          onSelectGroup={setActiveGroupId}
          onSelectDm={setActiveDmUserId}
          onCreateGroup={() => setShowCreateGroup(true)}
          onLeaveGroup={leaveGroup}
        />

        {/* Middle Column: Categories/Sections */}
        <AnimatePresence mode="wait">
          {!isSectionsCollapsed && !activeDmUserId && (
            <SectionsPanel
              group={activeGroup}
              sections={channels}
              activeSectionId={activeChannelId || ""}
              onSelectSection={setActiveChannelId}
              onCreateSection={canCreateChannel ? () => setShowCreateChannel(true) : undefined}
            />
          )}
        </AnimatePresence>

        {/* Right Column: Discussions/Chat */}
        <div className="flex flex-1 min-w-0 relative bg-chat-custom border-l border-border/50">
          {/* Collapse Toggle Button */}
          {!activeDmUserId && (
            <button
              onClick={() => setIsSectionsCollapsed(!isSectionsCollapsed)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-5 h-10 bg-background border border-border rounded-full flex items-center justify-center shadow-md hover:text-primary transition-all group"
              title={isSectionsCollapsed ? "Open Sections" : "Close Sections"}
            >
              {isSectionsCollapsed ? <ChevronRight size={12} className="group-hover:scale-125 transition-transform" /> : <ChevronLeft size={12} className="group-hover:scale-125 transition-transform" />}
            </button>
          )}

          <ChatArea
            messages={messages}
            typingUsers={typingUsers}
            channelName={activeDmUserId ? (activeDmUser?.name || "Direct Message") : (activeChannel?.name ?? "Discussions")}
            onSendMessage={sendMessage}
            onSendFile={sendFile}
            onVerify={verifyMessage}
            onFlag={flagMessage}
            onTyping={setTypingStatus}
            onSelectUser={setActiveDmUserId}
            userRole={user.role}
          />

          {/* Participants toggle */}
          {!activeDmUserId && (
            <div className="absolute top-2.5 right-4 flex items-center gap-2 z-20">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowParticipants(!showParticipants)}
                className={`p-2 rounded-lg transition-all shadow-sm border ${
                  showParticipants 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-muted-foreground hover:text-foreground border-border"
                }`}
                title="Community Members"
              >
                <Users size={18} />
              </motion.button>
            </div>
          )}

          <AnimatePresence>
            {showParticipants && !activeDmUserId && (
              <ParticipantsSidebar
                participants={members}
                onlineUserIds={onlineUserIds}
                onSelectUser={(id) => {
                  if (id !== user.id) {
                    setActiveDmUserId(id);
                    setShowParticipants(false);
                  }
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <CreateClassModal 
        open={showCreateGroup} 
        onClose={() => setShowCreateGroup(false)} 
        onSuccess={refreshGroups}
      />
      <CreateChannelModal
        open={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onSuccess={refreshChannels}
        groupId={activeGroupId}
      />
    </div>
  );
};

export default Index;
