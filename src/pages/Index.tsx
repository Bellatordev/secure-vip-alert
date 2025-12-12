import { Header } from "@/components/Header";
import { TeamPanel } from "@/components/TeamPanel";
import { ChatArea } from "@/components/ChatArea";
import { InputBar } from "@/components/InputBar";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ConnectButton } from "@/components/ConnectButton";
import { SOSButton } from "@/components/SOSButton";
import { useSOCRoom } from "@/hooks/useSOCRoom";

const Index = () => {
  const {
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
    currentAgent,
    connect,
    disconnect,
    switchAgent,
    activateSOS,
    startVoice,
    stopVoice,
    toggleVoiceMode,
    uploadImage,
    sendTextMessage,
    setSelectedVoice,
    setVolume,
  } = useSOCRoom();
  
  const isConnected = connectionStatus === 'connected';
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        connectionStatus={connectionStatus}
        selectedVoice={selectedVoice}
        onVoiceChange={setSelectedVoice}
        volume={volume}
        onVolumeChange={setVolume}
      />
      
      {/* Main content area with padding for fixed header/footer */}
      <main className="flex-1 pt-14 pb-36">
        {!isConnected ? (
          <WelcomeScreen
            connectionStatus={connectionStatus}
            onConnect={connect}
            onSOS={activateSOS}
          />
        ) : (
          <div className="h-full flex flex-col lg:flex-row">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-72 p-4 border-r border-border shrink-0">
              <TeamPanel 
                teamMembers={teamMembers} 
                activeSpeaker={activeSpeaker}
                currentAgent={currentAgent}
                onSwitchAgent={switchAgent}
                isConnected={isConnected}
              />
              
              <div className="mt-4 space-y-3">
                {isPanicMode && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="w-2 h-2 rounded-full bg-destructive pulse-live" />
                    <span className="text-xs font-medium text-destructive uppercase tracking-wider">
                      SOS Active
                    </span>
                  </div>
                )}
                
                <ConnectButton
                  status={connectionStatus}
                  onConnect={connect}
                  onDisconnect={disconnect}
                />
              </div>
            </aside>
            
            {/* Chat area */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Mobile team panel - collapsed */}
              <div className="lg:hidden px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {teamMembers.map((member) => {
                    const isActive = member.status === 'active' || member.status === 'speaking';
                    return (
                      <div
                        key={member.id}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0 text-xs
                          ${isActive 
                            ? 'bg-background-tertiary text-foreground' 
                            : 'bg-background-secondary text-muted-foreground opacity-60'
                          }
                        `}
                      >
                        <span>{member.icon}</span>
                        <span className="font-medium">{member.name.split(' ')[0]}</span>
                        {activeSpeaker === member.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-live" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <ChatArea messages={messages} isThinking={isThinking} />
            </div>
          </div>
        )}
      </main>
      
      {/* Input bar - only show when connected */}
      {isConnected && (
        <InputBar
          voiceState={voiceState}
          voiceMode={voiceMode}
          onVoiceStart={startVoice}
          onVoiceStop={stopVoice}
          onVoiceModeToggle={toggleVoiceMode}
          onImageUpload={uploadImage}
          onTextSubmit={sendTextMessage}
          disabled={voiceState === 'transcribing' || voiceState === 'thinking'}
        />
      )}
    </div>
  );
};

export default Index;
