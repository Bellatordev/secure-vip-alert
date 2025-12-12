import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useRef } from 'react';
import { Speaker } from '@/types';

// Map team roles to ElevenLabs agent IDs
export const AGENT_IDS: Record<string, string> = {
  clientOfficer: 'NUS9FibgZiq7z8SN2kAB',
  security: '8ZkqihGoJB7jFfKGItmC',
  travel: 'tOHPvScM78PdUdowBosh',
  researcher: '4ymemKuuugML4MTq91jt',
  contacts: 'sfaMjWKoJwWVh87EqeLn',
};

export type ConversationTranscript = {
  role: 'user' | 'agent';
  text: string;
  speaker?: Speaker;
};

export type AgentCallbacks = {
  onAgentChange?: (agent: Speaker) => void;
  onTranscript?: (transcript: ConversationTranscript) => void;
  onSpeakingChange?: (isSpeaking: boolean, agent: Speaker) => void;
};

export function useElevenLabsAgent(callbacks?: AgentCallbacks) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Speaker>('clientOfficer');
  const currentAgentRef = useRef<Speaker>('clientOfficer');
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Connected to ElevenLabs agent:', currentAgentRef.current);
      callbacksRef.current?.onAgentChange?.(currentAgentRef.current);
    },
    onDisconnect: () => {
      console.log('❌ Disconnected from ElevenLabs agent');
    },
    onMessage: (payload) => {
      console.log('💬 Message from agent:', payload);
      
      const transcript: ConversationTranscript = {
        role: payload.role === 'user' ? 'user' : 'agent',
        text: payload.message,
        speaker: payload.role === 'user' ? 'user' : currentAgentRef.current
      };
      
      setTranscripts(prev => [...prev, transcript]);
      callbacksRef.current?.onTranscript?.(transcript);
    },
    onError: (error) => {
      console.error('🚨 ElevenLabs error:', error);
    },
    onStatusChange: ({ status }) => {
      console.log('📊 Status changed:', status);
    },
    onModeChange: ({ mode }) => {
      console.log('🎤 Mode changed:', mode);
      const isSpeaking = mode === 'speaking';
      callbacksRef.current?.onSpeakingChange?.(isSpeaking, currentAgentRef.current);
    },
  });

  const startConversation = useCallback(async (agentRole: Speaker = 'clientOfficer') => {
    const agentId = AGENT_IDS[agentRole];
    
    if (!agentId) {
      console.error(`No agent ID configured for role: ${agentRole}`);
      throw new Error(`No agent ID configured for role: ${agentRole}`);
    }

    setIsConnecting(true);
    setCurrentAgent(agentRole);
    currentAgentRef.current = agentRole;
    
    try {
      console.log('🎙️ Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');

      console.log('🚀 Starting conversation with agent:', agentRole, '- ID:', agentId);

      const conversationId = await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
      });
      
      console.log('✅ Conversation started with ID:', conversationId);

      setTranscripts([]);
      return conversationId;
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const switchAgent = useCallback(async (agentRole: Speaker): Promise<string | undefined> => {
    const agentId = AGENT_IDS[agentRole];
    
    if (!agentId) {
      console.error(`No agent ID configured for role: ${agentRole}`);
      return;
    }

    console.log('🔄 Switching agent from', currentAgentRef.current, 'to', agentRole);
    
    // End current session if connected
    if (conversation.status === 'connected') {
      await conversation.endSession();
      // Small delay to ensure clean disconnect
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setCurrentAgent(agentRole);
    currentAgentRef.current = agentRole;

    // Start new session with different agent
    try {
      const conversationId = await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
      });
      
      console.log('✅ Switched to agent:', agentRole, 'ID:', conversationId);
      callbacksRef.current?.onAgentChange?.(agentRole);
      return conversationId;
    } catch (error) {
      console.error('❌ Failed to switch agent:', error);
      throw error;
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const setVolume = useCallback((volume: number) => {
    conversation.setVolume({ volume: volume / 100 });
  }, [conversation]);

  // Send a text message to the current agent (useful for context)
  const sendMessage = useCallback((text: string) => {
    if (conversation.status === 'connected') {
      conversation.sendUserMessage(text);
    }
  }, [conversation]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnecting,
    transcripts,
    currentAgent,
    startConversation,
    switchAgent,
    stopConversation,
    setVolume,
    sendMessage,
  };
}
