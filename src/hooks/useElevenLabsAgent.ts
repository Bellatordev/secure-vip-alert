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
  medical: 'kxrAePUgdKTckPMBgdQX',
};

// Keywords that trigger agent switches
const AGENT_TRIGGERS: Record<string, string[]> = {
  security: ['security', 'threat', 'danger', 'risk', 'attack', 'breach', 'cyber', 'safe'],
  travel: ['travel', 'evacuation', 'transport', 'route', 'flight', 'location', 'embassy', 'leave'],
  researcher: ['research', 'background', 'intel', 'intelligence', 'history', 'analyze', 'information'],
  contacts: ['contact', 'embassy', 'authorities', 'emergency', 'call', 'reach', 'help'],
  medical: ['medical', 'health', 'doctor', 'hospital', 'injury', 'sick', 'medicine', 'first aid', 'ambulance', 'treatment'],
};

// Topic keywords to determine which specialist to consult
const TOPIC_KEYWORDS: Record<string, string[]> = {
  security: ['threat', 'danger', 'risk', 'attack', 'breach', 'cyber', 'safe', 'protect', 'weapon', 'hostile', 'suspicious', 'criminal', 'violence'],
  travel: ['travel', 'evacuation', 'transport', 'route', 'flight', 'location', 'embassy', 'leave', 'border', 'visa', 'airport', 'hotel', 'destination'],
  researcher: ['research', 'background', 'intel', 'intelligence', 'history', 'analyze', 'information', 'data', 'report', 'news', 'situation'],
  contacts: ['contact', 'authorities', 'emergency', 'call', 'reach', 'police', 'fire', 'rescue', 'local', 'government', 'agency'],
  medical: ['medical', 'health', 'doctor', 'hospital', 'injury', 'sick', 'medicine', 'first aid', 'ambulance', 'treatment', 'illness', 'pain', 'wound', 'blood'],
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
  onResearchStarted?: () => void;
  onResearchComplete?: (research: string) => void;
};

export function useElevenLabsAgent(callbacks?: AgentCallbacks) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Speaker>('clientOfficer');
  const [isResearching, setIsResearching] = useState(false);
  const currentAgentRef = useRef<Speaker>('clientOfficer');
  const callbacksRef = useRef(callbacks);
  const switchAgentRef = useRef<((agent: Speaker) => Promise<string | undefined>) | null>(null);
  const pendingConsultRef = useRef<Speaker | null>(null);
  const isConsultingRef = useRef(false);
  const consultQueueRef = useRef<Speaker[]>([]);
  const conversationHistoryRef = useRef<string[]>([]); // Full thread for all agents
  const userQueryRef = useRef<string>(''); // Original user query
  callbacksRef.current = callbacks;

  // Build full conversation context for agents
  const getFullContext = useCallback((): string => {
    const history = conversationHistoryRef.current;
    if (history.length === 0) return '';
    return `CONVERSATION THREAD:\n${history.join('\n')}\n\nOriginal query: ${userQueryRef.current}`;
  }, []);

  // Detect which specialists should be consulted based on conversation content
  const detectRelevantSpecialists = useCallback((text: string): Speaker[] => {
    const lowerText = text.toLowerCase();
    const relevant: Speaker[] = [];
    
    for (const [agent, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      const matchCount = keywords.filter(kw => lowerText.includes(kw)).length;
      if (matchCount >= 2) { // At least 2 keyword matches
        relevant.push(agent as Speaker);
      }
    }
    
    return relevant;
  }, []);

  // Detect if agent response suggests consulting another specialist
  const detectAgentSwitch = useCallback((text: string, fromAgent: Speaker): Speaker | null => {
    const lowerText = text.toLowerCase();
    
    // Only Client Officer can initiate consults
    if (fromAgent !== 'clientOfficer') return null;
    
    // Check for explicit handoff phrases
    const handoffPhrases = [
      'let me check with',
      'consult',
      "i'll ask",
      'transfer you to',
      'speak with our',
      'get our',
      'bring in',
      'defer to',
      'let me get',
      'connecting you with',
      'our specialist',
    ];
    
    const hasHandoffIntent = handoffPhrases.some(phrase => lowerText.includes(phrase));
    
    if (hasHandoffIntent) {
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
      const research = await queryResearch(query, getFullContext());
      callbacksRef.current?.onResearchComplete?.(research);
      return research;
    } finally {
      setIsResearching(false);
    }
  }, [getFullContext]);

  // Queue multiple agents for consultation
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
      
      // Send full conversation context to ALL agents so they can track the thread
      const fullContext = getFullContext();
      if (fullContext && currentAgentRef.current !== 'clientOfficer') {
        setTimeout(() => {
          const contextMessage = `You are joining an ongoing DANGER ROOM consultation. Here is the full conversation thread:\n\n${fullContext}\n\nPlease provide your specialist perspective. If you notice something critical, speak up. After your assessment, the team will continue discussing.`;
          conversation.sendUserMessage(contextMessage);
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
      
      // Add to conversation history so all agents have context
      const speakerName = payload.role === 'user' ? 'USER' : currentAgentRef.current.toUpperCase();
      conversationHistoryRef.current.push(`[${speakerName}]: ${payload.message}`);
      
      // Store original user query
      if (payload.role === 'user' && currentAgentRef.current === 'clientOfficer') {
        userQueryRef.current = payload.message;
      }
      
      setTranscripts(prev => [...prev, transcript]);
      callbacksRef.current?.onTranscript?.(transcript);
      
      // Client Officer ALWAYS consults the team - never solves alone
      if (payload.role !== 'user' && currentAgentRef.current === 'clientOfficer' && !isConsultingRef.current) {
        // Detect which specialists are relevant to this conversation
        const relevantSpecialists = detectRelevantSpecialists(getFullContext());
        
        // Check for explicit handoff
        const targetAgent = detectAgentSwitch(payload.message, currentAgentRef.current);
        
        if (targetAgent) {
          console.log('🎯 Client Interface routing to:', targetAgent);
          pendingConsultRef.current = targetAgent;
        } else if (relevantSpecialists.length > 0) {
          // Consult all relevant specialists
          console.log('👥 Consulting relevant specialists:', relevantSpecialists);
          queueMultiAgentConsult(relevantSpecialists);
        } else {
          // Default: always consult at least researcher and security
          console.log('👥 Default consultation: researcher and security');
          queueMultiAgentConsult(['researcher', 'security']);
        }
        
        // Start research in background
        performResearch(userQueryRef.current).then(research => {
          console.log('📚 Research completed:', research.substring(0, 100) + '...');
        });
      }
      
      // Check if other specialists should chime in based on new information
      if (payload.role !== 'user' && currentAgentRef.current !== 'clientOfficer') {
        const newRelevantSpecialists = detectRelevantSpecialists(payload.message);
        const specialistsNotYetConsulted = newRelevantSpecialists.filter(
          s => s !== currentAgentRef.current && !consultQueueRef.current.includes(s)
        );
        
        if (specialistsNotYetConsulted.length > 0) {
          console.log('💡 New specialists should chime in:', specialistsNotYetConsulted);
          consultQueueRef.current.push(...specialistsNotYetConsulted);
        }
      }
      
      // If a specialist finishes, continue with queue or return to Client Interface
      if (payload.role !== 'user' && currentAgentRef.current !== 'clientOfficer' && isConsultingRef.current) {
        if (consultQueueRef.current.length > 0) {
          const nextAgent = consultQueueRef.current.shift()!;
          console.log('➡️ Next specialist:', nextAgent);
          pendingConsultRef.current = nextAgent;
        } else {
          // All specialists done, return to Client Interface to summarize
          console.log('✅ All specialists consulted, returning to Client Interface');
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

    // Clear conversation history for new session
    conversationHistoryRef.current = [];
    userQueryRef.current = '';
    
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

  // Store switchAgent ref for internal use
  switchAgentRef.current = switchAgent;

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    conversationHistoryRef.current = [];
    userQueryRef.current = '';
  }, [conversation]);

  const setVolume = useCallback((volume: number) => {
    conversation.setVolume({ volume: volume / 100 });
  }, [conversation]);

  // Send a text message to the current agent
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
