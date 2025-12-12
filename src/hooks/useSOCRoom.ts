import { useState, useCallback, useRef, useEffect } from "react";
import { 
  SOCState, 
  Message, 
  TeamMember, 
  ConnectionStatus, 
  VoiceState, 
  VoiceMode,
  Speaker 
} from "@/types";
import { v4 as uuidv4 } from "@/lib/uuid";
import { useElevenLabsAgent } from "./useElevenLabsAgent";

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
  
  // ElevenLabs Conversational AI
  const elevenLabs = useElevenLabsAgent();
  
  // Sync ElevenLabs state with our state
  useEffect(() => {
    if (elevenLabs.isSpeaking) {
      setVoiceState('speaking');
      setActiveSpeaker('clientOfficer');
      updateTeamMemberStatus('clientOfficer', 'speaking');
    } else if (elevenLabs.status === 'connected') {
      setVoiceState('idle');
      setActiveSpeaker(null);
      updateTeamMemberStatus('clientOfficer', 'active');
    }
  }, [elevenLabs.isSpeaking, elevenLabs.status]);
  
  // Sync transcripts to messages
  useEffect(() => {
    if (elevenLabs.transcripts.length > 0) {
      const latestTranscript = elevenLabs.transcripts[elevenLabs.transcripts.length - 1];
      const existingIds = messages.map(m => m.content);
      
      if (!existingIds.includes(latestTranscript.text)) {
        const message: Message = {
          id: uuidv4(),
          threadId: threadId.current,
          timestamp: new Date(),
          speaker: latestTranscript.role === 'user' ? 'user' : 'clientOfficer',
          content: latestTranscript.text,
        };
        setMessages(prev => [...prev, message]);
      }
    }
  }, [elevenLabs.transcripts]);
  
  // Set volume when it changes
  useEffect(() => {
    if (elevenLabs.status === 'connected') {
      elevenLabs.setVolume(volume);
    }
  }, [volume, elevenLabs.status]);
  
  const updateTeamMemberStatus = useCallback((id: Speaker, status: TeamMember['status']) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === id ? { ...member, status } : member
    ));
  }, []);
  
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
  
  const connect = useCallback(async () => {
    setConnectionStatus('connecting');
    
    try {
      await elevenLabs.startConversation();
      setConnectionStatus('connected');
      updateTeamMemberStatus('clientOfficer', 'active');
      setActiveSpeaker('clientOfficer');
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionStatus('disconnected');
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
  }, [elevenLabs]);
  
  const activateSOS = useCallback(async () => {
    setIsPanicMode(true);
    await connect();
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
  }, [connectionStatus, addMessage]);
  
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
    
    // Actions
    connect,
    disconnect,
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
