import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useRef } from 'react';
import { Speaker } from '@/types';

// Map team roles to ElevenLabs agent IDs
export const AGENT_IDS: Record<string, string> = {
  clientOfficer: 'NUS9FibgZiq7z8SN2kAB',  // Terry
  security: '8ZkqihGoJB7jFfKGItmC',
  travel: 'tOHPvScM78PdUdowBosh',
  researcher: '4ymemKuuugML4MTq91jt',
  contacts: 'sfaMjWKoJwWVh87EqeLn',
};

export function useElevenLabsAgent() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{ role: 'user' | 'agent'; text: string; speaker?: Speaker }>>([]);
  const [currentAgent, setCurrentAgent] = useState<Speaker>('clientOfficer');
  const currentAgentRef = useRef<Speaker>('clientOfficer');

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Connected to ElevenLabs agent:', currentAgentRef.current);
    },
    onDisconnect: () => {
      console.log('❌ Disconnected from ElevenLabs agent');
    },
    onMessage: (payload) => {
      console.log('💬 Message from agent:', payload);
      
      setTranscripts(prev => [...prev, {
        role: payload.role === 'user' ? 'user' : 'agent',
        text: payload.message,
        speaker: payload.role === 'user' ? 'user' : currentAgentRef.current
      }]);
    },
    onError: (error) => {
      console.error('🚨 ElevenLabs error:', error);
    },
    onStatusChange: ({ status }) => {
      console.log('📊 Status changed:', status);
    },
    onModeChange: ({ mode }) => {
      console.log('🎤 Mode changed:', mode);
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
      // Request microphone permission
      console.log('🎙️ Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');

      console.log('🚀 Starting conversation with agent:', agentRole, '- ID:', agentId);
      console.log('📍 Current conversation status:', conversation.status);

      // Connect directly with agent ID
      const conversationId = await conversation.startSession({
        agentId: agentId,
        connectionType: 'websocket',
      });
      
      console.log('✅ Conversation started with ID:', conversationId);

      setTranscripts([]);
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const switchAgent = useCallback(async (agentRole: Speaker) => {
    const agentId = AGENT_IDS[agentRole];
    
    if (!agentId) {
      console.error(`No agent ID configured for role: ${agentRole}`);
      return;
    }

    // End current session if connected
    if (conversation.status === 'connected') {
      console.log('🔄 Switching agent from', currentAgentRef.current, 'to', agentRole);
      await conversation.endSession();
    }

    // Start new session with different agent
    await startConversation(agentRole);
  }, [conversation, startConversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const setVolume = useCallback((volume: number) => {
    conversation.setVolume({ volume: volume / 100 });
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
  };
}
