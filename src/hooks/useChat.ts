import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { socket } from "@/lib/socket";
import { useToast } from "@/components/ui/use-toast";

export const useChat = () => {
  const [groups, setGroups] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [dmFeed, setDmFeed] = useState<any[]>([]);
  const [activeDmUserId, setActiveDmUserId] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const socketConnectedRef = useRef(false);

  const fetchGroups = async () => {
    try {
      const { data } = await api.get("/groups");
      setGroups(data.map((g: any) => ({ ...g, unreadCount: 0 })));
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchDMFeed = async () => {
    try {
      const { data } = await api.get("/dms/feed");
      setDmFeed(data);
    } catch (error) {
      console.error("Error fetching DM feed:", error);
    }
  };

  const fetchChannels = async (groupId: string) => {
    try {
      const { data } = await api.get(`/channels/${groupId}`);
      setChannels(data);
      if (data.length > 0 && !activeChannelId) {
        setActiveChannelId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    }
  };

  const fetchMessages = async (channelId: string) => {
    try {
      const { data } = await api.get(`/messages/${channelId}`);
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchDMMessages = async (otherUserId: string) => {
    try {
      const { data } = await api.get(`/dms/${otherUserId}`);
      setMessages(data);
    } catch (error) {
      console.error("Error fetching DM messages:", error);
    }
  };

  const fetchMembers = async (groupId: string) => {
    try {
      const { data } = await api.get(`/groups/${groupId}/members`);
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchGroups(), fetchDMFeed()]).finally(() => setLoading(false));

    // Global socket connection (once)
    if (!socketConnectedRef.current) {
      socket.connect();
      socketConnectedRef.current = true;
    }

    const handleConnect = () => {
      socket.emit("join_user", user.id);
    };

    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUserIds(userIds);
    };

    const handleGroupNotification = (data: any) => {
      // Logic handled in separate group listener if needed, 
      // but keeping it here for consistency if required.
    };
    
    const handleReceiveDM = (data: any) => {
      setMessages((prev) => {
        const isRelevant = 
          (data.sender_id === user.id && data.receiver_id === activeDmUserId) ||
          (data.sender_id === activeDmUserId && data.receiver_id === user.id);

        if (isRelevant) {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, data];
        }
        return prev;
      });
      
      fetchDMFeed();
    };

    const handleDMTypingStart = (data: { userId: string, userName: string }) => {
      if (data.userId === activeDmUserId) {
        setTypingUsers(prev => {
          if (prev.some(u => u.id === data.userId)) return prev;
          return [...prev, { id: data.userId, userName: data.userName }];
        });
      }
    };

    const handleDMTypingStop = (data: { userId: string }) => {
      if (data.userId === activeDmUserId) {
        setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
      }
    };

    socket.on("connect", handleConnect);
    socket.on("online_users", handleOnlineUsers);
    socket.on("group_notification", handleGroupNotification);
    socket.on("receive_dm", handleReceiveDM);
    socket.on("dm_typing_start", handleDMTypingStart);
    socket.on("dm_typing_stop", handleDMTypingStop);

    if (socket.connected) {
      socket.emit("join_user", user.id);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("online_users", handleOnlineUsers);
      socket.off("group_notification", handleGroupNotification);
      socket.off("receive_dm", handleReceiveDM);
      socket.off("dm_typing_start", handleDMTypingStart);
      socket.off("dm_typing_stop", handleDMTypingStop);
    };
  }, [activeDmUserId, user.id, groups.length, activeGroupId]);

  useEffect(() => {
    if (activeGroupId) {
      setActiveDmUserId(null); // Clear DM when group selected
      setChannels([]);
      setMembers([]);
      setMessages([]);
      setActiveChannelId(null);

      fetchChannels(activeGroupId);
      fetchMembers(activeGroupId);
      socket.emit("join_group", activeGroupId);
      
      setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, unreadCount: 0 } : g));
    }
  }, [activeGroupId]);

  useEffect(() => {
    if (activeDmUserId) {
      setActiveGroupId(null);
      setActiveChannelId(null);
      setMessages([]);
      setTypingUsers([]); // Clear typing when switching
      fetchDMMessages(activeDmUserId);
    }
  }, [activeDmUserId]);

  useEffect(() => {
    if (activeChannelId) {
      setMessages([]);
      setTypingUsers([]); // Clear typing when switching
      fetchMessages(activeChannelId);
      socket.emit("join_channel", activeChannelId);

      const handleReceiveMessage = (message: any) => {
        if (message.channel_id === activeChannelId) {
          setMessages((prev) => [...prev, message]);
        }
        
        const msgGroupId = message.group_id;
        if (msgGroupId && msgGroupId !== activeGroupId && message.sender_id !== user.id) {
          setGroups(prev => {
            const index = prev.findIndex(g => g.id === msgGroupId);
            if (index === -1) return prev;
            
            const newGroups = [...prev];
            const group = { ...newGroups[index] };
            group.unreadCount = (group.unreadCount || 0) + 1;
            
            newGroups.splice(index, 1);
            const result = [group, ...newGroups];

            window.dispatchEvent(new CustomEvent('new_notification', { 
              detail: { 
                groupId: msgGroupId,
                groupName: group.name,
                content: message.content || "Sent an attachment"
              }
            }));

            return result;
          });
        }
      };

      const handleUpdateMessage = (updatedMessage: any) => {
        setMessages((prev) => prev.map(m => m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m));
      };

      const handleTypingUsers = (users: any[]) => {
        setTypingUsers(users.filter(u => u.id !== user.id));
      };

      socket.on("receive_message", handleReceiveMessage);
      socket.on("update_message", handleUpdateMessage);
      socket.on("typing_users", handleTypingUsers);

      return () => {
        socket.off("receive_message", handleReceiveMessage);
        socket.off("update_message", handleUpdateMessage);
        socket.off("typing_users", handleTypingUsers);
      };
    }
  }, [activeChannelId]);

  const sendMessage = async (content: string, isDoubt: boolean = false, attachment?: any) => {
    if (activeDmUserId) {
      try {
        const { data } = await api.post("/dms", {
          receiverId: activeDmUserId,
          content,
          ...attachment
        });
        socket.emit("send_dm", data);
        // Refresh DM feed to ensure user is there
        fetchDMFeed();
      } catch (error) {
        console.error("Error sending DM:", error);
      }
      return;
    }

    if (!activeChannelId) return;
    try {
      const { data } = await api.post("/messages", {
        channelId: activeChannelId,
        content,
        isDoubt,
        ...attachment
      });
      socket.emit("send_message", { ...data, channelId: activeChannelId, group_id: activeGroupId });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const sendFile = async (file: File, content: string = "", isDoubt: boolean = false) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("content", content);
    formData.append("isDoubt", String(isDoubt));

    if (activeDmUserId) {
      formData.append("receiverId", activeDmUserId);
      try {
        const { data } = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        socket.emit("send_dm", data);
        fetchDMFeed();
        return data;
      } catch (error: any) {
        const errorMsg = error.response?.data?.message || "File upload failed.";
        toast({ variant: "destructive", title: "Upload Failed", description: errorMsg });
        throw error;
      }
    }

    if (!activeChannelId) return;
    formData.append("channelId", activeChannelId);
    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      socket.emit("send_message", { ...data, channelId: activeChannelId, group_id: activeGroupId });
      return data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "File upload failed.";
      toast({ variant: "destructive", title: "Upload Failed", description: errorMsg });
      throw error;
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      await api.delete(`/groups/${groupId}/leave`);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
        setActiveChannelId(null);
        setChannels([]);
        setMessages([]);
        setMembers([]);
      }
      toast({ title: "Success", description: "You have left the group." });
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const verifyMessage = async (messageId: string, status: 'verified' | 'incorrect') => {
    try {
      const { data } = await api.post(`/messages/${messageId}/verify`, { status });
      socket.emit("update_message", { ...data, channelId: activeChannelId });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to verify message" });
    }
  };

  const flagMessage = async (messageId: string) => {
    try {
      const { data } = await api.post(`/messages/${messageId}/flag`);
      socket.emit("update_message", { ...data, channelId: activeChannelId });
    } catch (error) {
      console.error("Error flagging message:", error);
    }
  };

  const setTypingStatus = (isTyping: boolean) => {
    if (!activeChannelId && !activeDmUserId) return;
    
    if (activeChannelId) {
      if (isTyping) {
        socket.emit("typing_start", { channelId: activeChannelId, userId: user.id, userName: user.name });
      } else {
        socket.emit("typing_stop", { channelId: activeChannelId, userId: user.id });
      }
    } else if (activeDmUserId) {
      if (isTyping) {
        socket.emit("dm_typing_start", { receiverId: activeDmUserId, userId: user.id, userName: user.name });
      } else {
        socket.emit("dm_typing_stop", { receiverId: activeDmUserId, userId: user.id });
      }
    }
  };

  return {
    groups, channels, messages, members, typingUsers, onlineUserIds, activeGroupId, setActiveGroupId,
    activeChannelId, setActiveChannelId, dmFeed, activeDmUserId, setActiveDmUserId,
    loading, sendMessage, sendFile, leaveGroup,
    verifyMessage, flagMessage, setTypingStatus, refreshGroups: fetchGroups,
    refreshChannels: () => activeGroupId && fetchChannels(activeGroupId)
  };
};
