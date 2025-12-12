import { useState, useCallback, useRef } from "react";
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
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [volume, setVolume] = useState(80);
  
  const threadId = useRef(uuidv4());
  
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
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setConnectionStatus('connected');
    updateTeamMemberStatus('clientOfficer', 'active');
    setActiveSpeaker('clientOfficer');
    
    // Client Officer greeting
    setTimeout(() => {
      addMessage('clientOfficer', "Good day. I'm your Client Officer. How may I assist you today? I have my team standing by — Security, Travel, Research, and Contacts — ready to support whatever you need.");
      setActiveSpeaker(null);
    }, 500);
  }, [addMessage, updateTeamMemberStatus]);
  
  const disconnect = useCallback(() => {
    setConnectionStatus('disconnected');
    setVoiceState('idle');
    setIsPanicMode(false);
    setTeamMembers(initialTeamMembers);
    setActiveSpeaker(null);
  }, []);
  
  const activateSOS = useCallback(async () => {
    setIsPanicMode(true);
    await connect();
    
    // Immediate SOS response
    setTimeout(() => {
      updateTeamMemberStatus('security', 'active');
      setActiveSpeaker('security');
      addMessage('security', "SOS ACTIVATED. Security Specialist here. I'm assessing your situation immediately. Please share your location and any immediate threats you're aware of. Stay calm — we're here to help.");
      
      setTimeout(() => {
        updateTeamMemberStatus('contacts', 'active');
        addMessage('contacts', "Contact Agent standing by. I'm pulling up local emergency services, hospitals, and safe locations in your area. Ready to coordinate on your command.");
        setActiveSpeaker(null);
      }, 1000);
    }, 500);
  }, [connect, addMessage, updateTeamMemberStatus]);
  
  const startVoice = useCallback(() => {
    if (connectionStatus !== 'connected') return;
    setVoiceState('recording');
  }, [connectionStatus]);
  
  const stopVoice = useCallback(() => {
    if (voiceState !== 'recording') return;
    setVoiceState('transcribing');
    
    // Simulate transcription
    setTimeout(() => {
      setVoiceState('thinking');
      setIsThinking(true);
      
      // Simulate AI response
      setTimeout(() => {
        setIsThinking(false);
        setVoiceState('speaking');
        // Add demo response
        addMessage('user', "I've just arrived at my hotel in São Paulo and something feels off about this location.");
        
        setTimeout(() => {
          updateTeamMemberStatus('security', 'active');
          setActiveSpeaker('security');
          addMessage('security', "Understood. Can you describe what's making you uneasy? Any suspicious individuals, unusual activity around the entrance, or concerning features of the building itself?");
          
          setTimeout(() => {
            updateTeamMemberStatus('travel', 'active');
            addMessage('travel', "I'm pulling up intel on your area now. What's the hotel name and address? I can cross-reference with recent security reports.");
            setActiveSpeaker(null);
            setVoiceState('idle');
          }, 1500);
        }, 1000);
      }, 2000);
    }, 1000);
  }, [voiceState, addMessage, updateTeamMemberStatus]);
  
  const toggleVoiceMode = useCallback(() => {
    setVoiceMode(prev => prev === 'push-to-talk' ? 'vad' : 'push-to-talk');
  }, []);
  
  const uploadImage = useCallback(async (file: File) => {
    // In real implementation, upload to storage and send to AI
    console.log('Uploading image:', file.name);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Add message with image
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
    
    // AI response to image
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      updateTeamMemberStatus('security', 'active');
      setActiveSpeaker('security');
      addMessage('security', "I'm analyzing the image you've shared. Give me a moment to assess any potential security concerns...");
      setActiveSpeaker(null);
    }, 2000);
  }, [addMessage, updateTeamMemberStatus]);
  
  const sendTextMessage = useCallback((text: string) => {
    if (connectionStatus !== 'connected') return;
    
    addMessage('user', text);
    setIsThinking(true);
    
    // Simulate AI response
    setTimeout(() => {
      setIsThinking(false);
      setActiveSpeaker('clientOfficer');
      updateTeamMemberStatus('clientOfficer', 'speaking');
      addMessage('clientOfficer', "I've noted your concern. Let me coordinate with the appropriate specialist to address this for you.");
      
      setTimeout(() => {
        updateTeamMemberStatus('clientOfficer', 'active');
        setActiveSpeaker(null);
      }, 500);
    }, 1500);
  }, [connectionStatus, addMessage, updateTeamMemberStatus]);
  
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
