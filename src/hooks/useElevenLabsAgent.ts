import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useRef } from 'react';
import { Speaker } from '@/types';
import { queryResearch } from '@/lib/api/research';

// Map team roles to ElevenLabs agent IDs
export const AGENT_IDS: Record<string, string> = {
  clientOfficer: 'NUS9FibgZiq7z8SN2kAB',
  security: '8ZkqihGoJB7jFfKGItmC',
  travel: 'tOHPvScM78PdUdowBosh',
  researcher: '4ymemKuuugML4MTq91jt',
  contacts: 'sfaMjWKoJwWVh87EqeLn',
};

// Keywords that trigger agent switches
const AGENT_TRIGGERS: Record<string, string[]> = {
  security: ['security', 'threat', 'danger', 'risk', 'attack', 'breach', 'cyber', 'safe'],
  travel: ['travel', 'evacuation', 'transport', 'route', 'flight', 'location', 'embassy', 'leave'],
  researcher: ['research', 'background', 'intel', 'intelligence', 'history', 'analyze', 'information'],
  contacts: ['contact', 'embassy', 'authorities', 'emergency', 'call', 'reach', 'help'],
};

// Phrases that indicate uncertainty - trigger multi-agent consultation
const UNCERTAINTY_PHRASES = [
  "i'm not sure",
  "i don't know",
  "let me find out",
  "unclear",
  "need more information",
  "complex situation",
  "difficult to say",
  "let me consult",
  "get the team's input",
];

export type ConversationTranscript = {
  role: 'user' | 'agent';
  text: string;
  speaker?: Speaker;
};

export type AgentCallbacks = {
  onAgentChange?: (agent: Speaker) => void;
  onTranscript?: (transcript: ConversationTranscript) => void;
  onSpeakingChange?: (isSpeaking: boolean, agent: Speaker) => void;
  onResearchStarted?: () => void;
  onResearchComplete?: (research: string) => void;
};

export function useElevenLabsAgent(callbacks?: AgentCallbacks) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Speaker>('clientOfficer');
  const [userContext, setUserContext] = useState<string>('');
  const [isResearching, setIsResearching] = useState(false);
  const currentAgentRef = useRef<Speaker>('clientOfficer');
  const callbacksRef = useRef(callbacks);
  const switchAgentRef = useRef<((agent: Speaker, context?: string) => Promise<string | undefined>) | null>(null);
  const pendingConsultRef = useRef<Speaker | null>(null);
  const isConsultingRef = useRef(false);
  const consultQueueRef = useRef<Speaker[]>([]);
  callbacksRef.current = callbacks;

  // Detect uncertainty and need for multi-agent consultation
  const detectUncertainty = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();
    return UNCERTAINTY_PHRASES.some(phrase => lowerText.includes(phrase));
  }, []);

  // Detect if agent response suggests consulting another specialist
  const detectAgentSwitch = useCallback((text: string, fromAgent: Speaker): Speaker | null => {
    const lowerText = text.toLowerCase();
    
    // Only Client Officer can initiate consults
    if (fromAgent !== 'clientOfficer') return null;
    
    // Check for explicit handoff phrases
    if (lowerText.includes('let me check with') || 
        lowerText.includes('consult') || 
        lowerText.includes("i'll ask") ||
        lowerText.includes('transfer you to') ||
        lowerText.includes('speak with our')) {
      
      for (const [agent, keywords] of Object.entries(AGENT_TRIGGERS)) {
        if (keywords.some(kw => lowerText.includes(kw))) {
          return agent as Speaker;
        }
      }
    }
    
    return null;
  }, []);

  // Perform web research for the researcher agent
  const performResearch = useCallback(async (query: string): Promise<string> => {
    setIsResearching(true);
    callbacksRef.current?.onResearchStarted?.();
    
    try {
      const research = await queryResearch(query, userContext);
      callbacksRef.current?.onResearchComplete?.(research);
      return research;
    } finally {
      setIsResearching(false);
    }
  }, [userContext]);

  // Queue multiple agents for consultation (researcher + security when uncertain)
  const queueMultiAgentConsult = useCallback((agents: Speaker[]) => {
    consultQueueRef.current = [...agents];
    if (consultQueueRef.current.length > 0 && !isConsultingRef.current) {
      const nextAgent = consultQueueRef.current.shift()!;
      pendingConsultRef.current = nextAgent;
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log('✅ Connected to ElevenLabs agent:', currentAgentRef.current);
      callbacksRef.current?.onAgentChange?.(currentAgentRef.current);
      
      // If we're consulting and have context, send it to the new agent
      if (isConsultingRef.current && userContext) {
        setTimeout(() => {
          conversation.sendUserMessage(`Context from client officer: ${userContext}. Please provide your specialist assessment.`);
        }, 500);
      }
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
      
      // Store user context for passing to specialists
      if (payload.role === 'user') {
        setUserContext(payload.message);
      }
      
      setTranscripts(prev => [...prev, transcript]);
      callbacksRef.current?.onTranscript?.(transcript);
      
      // Check if Client Officer wants to consult another agent or is uncertain
      if (payload.role !== 'user' && currentAgentRef.current === 'clientOfficer') {
        const isUncertain = detectUncertainty(payload.message);
        
        if (isUncertain && !isConsultingRef.current) {
          // When uncertain, consult both researcher and security
          console.log('🤔 Client Officer uncertain - consulting researcher and security');
          queueMultiAgentConsult(['researcher', 'security']);
          
          // First, do web research
          performResearch(userContext).then(research => {
            console.log('📚 Research completed:', research.substring(0, 100) + '...');
          });
        } else {
          const targetAgent = detectAgentSwitch(payload.message, currentAgentRef.current);
          if (targetAgent && !isConsultingRef.current) {
            console.log('🎯 Detected handoff to:', targetAgent);
            pendingConsultRef.current = targetAgent;
          }
        }
      }
      
      // If a specialist finishes and there are more in queue, continue
      if (payload.role !== 'user' && currentAgentRef.current !== 'clientOfficer' && isConsultingRef.current) {
        if (consultQueueRef.current.length > 0) {
          const nextAgent = consultQueueRef.current.shift()!;
          console.log('➡️ Moving to next specialist:', nextAgent);
          pendingConsultRef.current = nextAgent;
        } else {
          // All specialists done, return to client officer
          console.log('✅ All specialists consulted, returning to Client Officer');
          pendingConsultRef.current = 'clientOfficer';
        }
      }
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
      
      // When agent stops speaking and we have a pending consult, switch
      if (mode === 'listening' && pendingConsultRef.current) {
        const targetAgent = pendingConsultRef.current;
        pendingConsultRef.current = null;
        
        // Reset consulting flag if returning to client officer
        if (targetAgent === 'clientOfficer') {
          isConsultingRef.current = false;
        } else {
          isConsultingRef.current = true;
        }
        
        setTimeout(() => {
          switchAgentRef.current?.(targetAgent);
        }, 1000);
      }
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

  // Store switchAgent ref for client tools to use
  switchAgentRef.current = switchAgent;

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
