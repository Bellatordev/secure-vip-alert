import { useConversation } from '@elevenlabs/react';
import { useState, useCallback } from 'react';

const AGENT_ID = 'NUS9FibgZiq7z8SN2kAB';

export function useElevenLabsAgent() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
    },
    onMessage: (payload) => {
      console.log('Message from agent:', payload);
      
      setTranscripts(prev => [...prev, {
        role: payload.role === 'user' ? 'user' : 'agent',
        text: payload.message
      }]);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log('Starting conversation with agent:', AGENT_ID);

      // Connect directly with agent ID (for public agents without auth requirement)
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'websocket',
      });

      setTranscripts([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const setVolume = useCallback(async (volume: number) => {
    conversation.setVolume({ volume: volume / 100 });
  }, [conversation]);

  return {
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    isConnecting,
    transcripts,
    startConversation,
    stopConversation,
    setVolume,
  };
}
