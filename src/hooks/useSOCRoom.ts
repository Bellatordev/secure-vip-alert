import { useState, useCallback, useRef, useEffect } from "react";
import { 
  Message, 
  TeamMember, 
  ConnectionStatus, 
  VoiceState, 
  VoiceMode,
  Speaker 
} from "@/types";
import { v4 as uuidv4 } from "@/lib/uuid";
import { useElevenLabsAgent, AGENT_IDS, ConversationTranscript } from "./useElevenLabsAgent";

const initialTeamMembers: TeamMember[] = [
  { id: 'clientOfficer', name: 'Client Officer', role: 'Primary Contact', icon: '👤', status: 'idle', color: 'officer' },
  { id: 'security', name: 'Security', role: 'Threat Assessment', icon: '🛡️', status: 'idle', color: 'security' },
  { id: 'travel', name: 'Travel Expert', role: 'Location Intel', icon: '🌍', status: 'idle', color: 'travel' },
  { id: 'researcher', name: 'Researcher', role: 'Real-time Info', icon: '🔎', status: 'idle', color: 'researcher' },
  { id: 'contacts', name: 'Contact Agent', role: 'Local Resources', icon: '📞', status: 'idle', color: 'contacts' },
];

export function useSOCRoom() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('push-to-talk');
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [activeSpeaker, setActiveSpeaker] = useState<Speaker | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  
  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState('JBFqnCBsd6RMkjVDRZzb');
  const [volume, setVolume] = useState(80);
  
  const threadId = useRef(uuidv4());
  const processedTranscripts = useRef<Set<string>>(new Set());
  
  const updateTeamMemberStatus = useCallback((id: Speaker, status: TeamMember['status']) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === id ? { ...member, status } : member
    ));
  }, []);
  
  // Handle transcript updates from the agent
  const handleTranscript = useCallback((transcript: ConversationTranscript) => {
    const transcriptKey = `${transcript.speaker}-${transcript.text}`;
    
    if (processedTranscripts.current.has(transcriptKey)) {
      return;
    }
    processedTranscripts.current.add(transcriptKey);
    
    const message: Message = {
      id: uuidv4(),
      threadId: threadId.current,
      timestamp: new Date(),
      speaker: transcript.speaker || (transcript.role === 'user' ? 'user' : 'clientOfficer'),
      content: transcript.text,
    };
    setMessages(prev => [...prev, message]);
  }, []);
  
  // Handle speaking state changes
  const handleSpeakingChange = useCallback((isSpeaking: boolean, agent: Speaker) => {
    if (isSpeaking) {
      setVoiceState('speaking');
      setActiveSpeaker(agent);
      updateTeamMemberStatus(agent, 'speaking');
    } else {
      setVoiceState('idle');
      updateTeamMemberStatus(agent, 'active');
    }
  }, [updateTeamMemberStatus]);
  
  // Handle agent changes
  const handleAgentChange = useCallback((agent: Speaker) => {
    // Reset all team members to idle except the new active one
    setTeamMembers(prev => prev.map(member => ({
      ...member,
      status: member.id === agent ? 'active' : (AGENT_IDS[member.id] ? 'idle' : member.status)
    })));
    setActiveSpeaker(agent);
  }, []);
  
  // ElevenLabs Conversational AI with callbacks
  const elevenLabs = useElevenLabsAgent({
    onTranscript: handleTranscript,
    onSpeakingChange: handleSpeakingChange,
    onAgentChange: handleAgentChange,
  });
  
  // Sync connection status
  useEffect(() => {
    if (elevenLabs.status === 'connected' && connectionStatus !== 'connected') {
      setConnectionStatus('connected');
    } else if (elevenLabs.status === 'disconnected' && connectionStatus === 'connected') {
      // Only set to disconnected if we were previously connected
      // This prevents premature disconnection during agent switching
    }
  }, [elevenLabs.status, connectionStatus]);
  
  // Set volume when it changes
  useEffect(() => {
    if (elevenLabs.status === 'connected') {
      elevenLabs.setVolume(volume);
    }
  }, [volume, elevenLabs.status, elevenLabs.setVolume]);
  
  const addMessage = useCallback((speaker: Speaker, content: string) => {
    const message: Message = {
      id: uuidv4(),
      threadId: threadId.current,
      timestamp: new Date(),
      speaker,
      content,
    };
    setMessages(prev => [...prev, message]);
    return message;
  }, []);
  
  const connect = useCallback(async (agentRole?: Speaker | React.MouseEvent) => {
    const role: Speaker = (typeof agentRole === 'string') ? agentRole : 'clientOfficer';
    
    setConnectionStatus('connecting');
    processedTranscripts.current.clear();
    
    try {
      await elevenLabs.startConversation(role);
      setConnectionStatus('connected');
      updateTeamMemberStatus(role, 'active');
      setActiveSpeaker(role);
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionStatus('disconnected');
    }
  }, [elevenLabs, updateTeamMemberStatus]);
  
  const switchAgent = useCallback(async (agentRole: Speaker) => {
    if (!AGENT_IDS[agentRole]) {
      console.warn(`No agent configured for role: ${agentRole}`);
      return;
    }
    
    // Show visual feedback during switch
    setIsThinking(true);
    updateTeamMemberStatus(elevenLabs.currentAgent, 'idle');
    updateTeamMemberStatus(agentRole, 'tasked');
    
    try {
      await elevenLabs.switchAgent(agentRole);
      updateTeamMemberStatus(agentRole, 'active');
      setActiveSpeaker(agentRole);
    } catch (error) {
      console.error('Failed to switch agent:', error);
    } finally {
      setIsThinking(false);
    }
  }, [elevenLabs, updateTeamMemberStatus]);
  
  const disconnect = useCallback(async () => {
    await elevenLabs.stopConversation();
    setConnectionStatus('disconnected');
    setVoiceState('idle');
    setIsPanicMode(false);
    setTeamMembers(initialTeamMembers);
    setActiveSpeaker(null);
    setMessages([]);
    processedTranscripts.current.clear();
  }, [elevenLabs]);
  
  const activateSOS = useCallback(async () => {
    setIsPanicMode(true);
    await connect('security');
  }, [connect]);
  
  const startVoice = useCallback(() => {
    if (connectionStatus !== 'connected') return;
    setVoiceState('recording');
  }, [connectionStatus]);
  
  const stopVoice = useCallback(() => {
    if (voiceState !== 'recording') return;
    setVoiceState('idle');
  }, [voiceState]);
  
  const toggleVoiceMode = useCallback(() => {
    setVoiceMode(prev => prev === 'push-to-talk' ? 'vad' : 'push-to-talk');
  }, []);
  
  const uploadImage = useCallback(async (file: File) => {
    console.log('Uploading image:', file.name);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const message: Message = {
      id: uuidv4(),
      threadId: threadId.current,
      timestamp: new Date(),
      speaker: 'user',
      content: `[Image: ${file.name}]`,
      attachments: [{
        id: uuidv4(),
        type: 'image',
        filename: file.name,
        mimeType: file.type as 'image/jpeg' | 'image/png',
        url: URL.createObjectURL(file),
        thumbnailUrl: URL.createObjectURL(file),
      }],
    };
    setMessages(prev => [...prev, message]);
  }, []);
  
  const sendTextMessage = useCallback((text: string) => {
    if (connectionStatus !== 'connected') return;
    addMessage('user', text);
    // Also send to the current agent
    elevenLabs.sendMessage(text);
  }, [connectionStatus, addMessage, elevenLabs]);
  
  // Get available agents (those with configured IDs)
  const availableAgents = teamMembers.filter(member => 
    AGENT_IDS[member.id] && AGENT_IDS[member.id].length > 0
  );
  
  return {
    // State
    connectionStatus,
    voiceState,
    voiceMode,
    isPanicMode,
    messages,
    teamMembers,
    activeSpeaker,
    isThinking,
    selectedVoice,
    volume,
    currentAgent: elevenLabs.currentAgent,
    availableAgents,
    
    // Actions
    connect,
    disconnect,
    switchAgent,
    activateSOS,
    startVoice,
    stopVoice,
    toggleVoiceMode,
    uploadImage,
    sendTextMessage,
    setSelectedVoice,
    setVolume,
  };
}
