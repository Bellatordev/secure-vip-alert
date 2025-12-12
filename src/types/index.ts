export type Speaker = 
  | 'user' 
  | 'clientOfficer' 
  | 'security' 
  | 'travel' 
  | 'researcher' 
  | 'contacts'
  | 'medical';

export type TeamMemberStatus = 'idle' | 'tasked' | 'active' | 'speaking';

export interface TeamMember {
  id: Speaker;
  name: string;
  role: string;
  icon: string;
  status: TeamMemberStatus;
  color: string;
}

export interface Attachment {
  id: string;
  type: 'image';
  filename: string;
  mimeType: 'image/jpeg' | 'image/png';
  url: string;
  thumbnailUrl: string;
}

export interface Message {
  id: string;
  threadId: string;
  timestamp: Date;
  speaker: Speaker;
  content: string;
  attachments?: Attachment[];
  audioUrl?: string;
}

export interface Thread {
  id: string;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'closed';
  messages: Message[];
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'thinking' | 'speaking';

export type VoiceMode = 'push-to-talk' | 'vad';

export interface SOCState {
  connectionStatus: ConnectionStatus;
  voiceState: VoiceState;
  voiceMode: VoiceMode;
  isPanicMode: boolean;
  currentThread: Thread | null;
  teamMembers: TeamMember[];
  activeSpeaker: Speaker | null;
}
