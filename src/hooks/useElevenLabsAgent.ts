import { useConversation } from '@elevenlabs/react';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-token', {
        body: { agentId: AGENT_ID },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.signed_url) {
        throw new Error('Failed to get signed URL');
      }

      console.log('Starting conversation with signed URL');

      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
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
