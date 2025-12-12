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

// Phrases that indicate uncertainty or need for help - trigger specialist consultation
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
  "beyond my expertise",
  "specialist",
  "need help with",
  "require assistance",
  "not my area",
  "better equipped",
  "expert opinion",
  "let me get",
  "bring in",
  "defer to",
];

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
  const [userContext, setUserContext] = useState<string>('');
  const [isResearching, setIsResearching] = useState(false);
  const currentAgentRef = useRef<Speaker>('clientOfficer');
  const callbacksRef = useRef(callbacks);
  const switchAgentRef = useRef<((agent: Speaker, context?: string) => Promise<string | undefined>) | null>(null);
  const pendingConsultRef = useRef<Speaker | null>(null);
  const isConsultingRef = useRef(false);
  const consultQueueRef = useRef<Speaker[]>([]);
  callbacksRef.current = callbacks;

  // Detect uncertainty and need for specialist help
  const detectUncertainty = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();
    return UNCERTAINTY_PHRASES.some(phrase => lowerText.includes(phrase));
  }, []);

  // Determine the best specialist based on topic keywords in conversation
  const detectBestSpecialist = useCallback((text: string, context: string): Speaker | null => {
    const combinedText = `${text} ${context}`.toLowerCase();
    
    // Score each specialist based on keyword matches
    const scores: Record<string, number> = {};
    
    for (const [agent, keywords] of Object.entries(TOPIC_KEYWORDS)) {
      scores[agent] = keywords.filter(kw => combinedText.includes(kw)).length;
    }
    
    // Find the specialist with the highest score
    const bestAgent = Object.entries(scores).reduce((best, [agent, score]) => {
      if (score > best.score) return { agent, score };
      return best;
    }, { agent: '', score: 0 });
    
    // Return the best match if score > 0, otherwise default to researcher
    if (bestAgent.score > 0) {
      return bestAgent.agent as Speaker;
    }
    
    return null;
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
        const targetAgent = detectAgentSwitch(payload.message, currentAgentRef.current);
        
        if (targetAgent && !isConsultingRef.current) {
          // Explicit handoff detected
          console.log('🎯 Detected explicit handoff to:', targetAgent);
          pendingConsultRef.current = targetAgent;
        } else if (isUncertain && !isConsultingRef.current) {
          // Client Officer is uncertain - find the best specialist based on topic
          const bestSpecialist = detectBestSpecialist(payload.message, userContext);
          
          if (bestSpecialist) {
            console.log('🤔 Client Officer needs help - consulting:', bestSpecialist);
            pendingConsultRef.current = bestSpecialist;
            
            // If it's the researcher, also do web research
            if (bestSpecialist === 'researcher') {
              performResearch(userContext).then(research => {
                console.log('📚 Research completed:', research.substring(0, 100) + '...');
              });
            }
          } else {
            // No clear topic match - consult researcher first, then security
            console.log('🤔 Client Officer uncertain - consulting researcher and security');
            queueMultiAgentConsult(['researcher', 'security']);
            
            performResearch(userContext).then(research => {
              console.log('📚 Research completed:', research.substring(0, 100) + '...');
            });
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
