import { useState, useCallback, useEffect } from "react";
import { Mic, Loader2, Volume2, RotateCcw, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageFlags } from "./LanguageFlags";
import { ChatMessages } from "./ChatMessages";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useCareerChat } from "@/hooks/useCareerChat";
import { getLanguageName } from "@/lib/languages";
import { cn } from "@/lib/utils";

export function VoiceCareerChat() {
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState<string>("Tap to speak");

  const {
    isRecording,
    startRecording,
    stopRecording,
    error: recorderError,
  } = useVoiceRecorder();
  const { isTranscribing, isSpeaking, transcribe, speak, stopSpeaking } =
    useVoiceAssistant();
  const { messages, isLoading, sendMessage, clearMessages } = useCareerChat();

  const isActive = isRecording || isTranscribing || isSpeaking || isLoading;

  // Update status message
  useEffect(() => {
    if (isRecording) {
      setStatus("Listening...");
    } else if (isTranscribing) {
      setStatus("Processing your voice...");
    } else if (isLoading) {
      setStatus("Thinking...");
    } else if (isSpeaking) {
      setStatus("Speaking...");
    } else {
      setStatus("Tap to speak");
    }
  }, [isRecording, isTranscribing, isLoading, isSpeaking]);

  // Display recorder errors
  useEffect(() => {
    if (recorderError) {
      setStatus(recorderError);
    }
  }, [recorderError]);

  const handleButtonClick = useCallback(async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    if (isRecording) {
      // Stop recording and process
      const audioBlob = await stopRecording();
      if (!audioBlob) return;

      // Transcribe
      const transcribedText = await transcribe(audioBlob, language);
      if (!transcribedText) return;

      // Send to AI
      const response = await sendMessage(
        transcribedText,
        getLanguageName(language)
      );
      if (response) {
        // Speak the response
        await speak(response);
      }
    } else {
      // Start recording
      await startRecording();
    }
  }, [
    isRecording,
    isSpeaking,
    stopRecording,
    transcribe,
    language,
    sendMessage,
    speak,
    startRecording,
    stopSpeaking,
  ]);

  const handleReset = useCallback(() => {
    clearMessages();
    stopSpeaking();
    setStatus("Tap to speak");
  }, [clearMessages, stopSpeaking]);

  const getButtonText = () => {
    if (isRecording) return "Stop Recording";
    if (isTranscribing) return "Processing...";
    if (isLoading) return "Thinking...";
    if (isSpeaking) return "Stop Speaking";
    return "Tap to speak";
  };

  const getButtonIcon = () => {
    if (isTranscribing || isLoading) {
      return <Loader2 className="w-5 h-5 animate-spin" />;
    }
    if (isSpeaking) {
      return <Volume2 className="w-5 h-5" />;
    }
    return <Mic className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-[#f0f0f0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">V</span>
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">
            VoiceCareer
          </h1>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          /* Empty state - centered landing */
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
            {/* Language flags */}
            <LanguageFlags value={language} onChange={setLanguage} />

            {/* Logo and Title */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-3xl">V</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                VoiceCareer
              </h2>
            </div>

            {/* Greeting and Description */}
            <div className="text-center max-w-md">
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                Hello! I'm your career assistant.
              </h3>
              <p className="text-muted-foreground">
                Tell me about your skills, experience, or what kind of job you're looking for. You can even read your resume aloud!
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl w-full mt-2">
              <div className="bg-background rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl mb-2">🎤</div>
                <h4 className="font-semibold text-foreground mb-1">Speak your skills</h4>
                <p className="text-sm text-muted-foreground">Describe your experience or read your resume</p>
              </div>
              <div className="bg-background rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-semibold text-foreground mb-1">Find matches</h4>
                <p className="text-sm text-muted-foreground">I'll find jobs that match your profile</p>
              </div>
            </div>

            {/* Start button */}
            <Button
              onClick={handleButtonClick}
              disabled={isTranscribing || isLoading}
              size="lg"
              className={cn(
                "px-8 py-4 text-base rounded-xl gap-3 transition-all mt-4",
                isRecording
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {getButtonIcon()}
              {getButtonText()}
            </Button>

            {/* Status indicator when active */}
            {isActive && (
              <p className="text-muted-foreground text-sm animate-pulse">
                {status}
              </p>
            )}
          </div>
        ) : (
          /* Chat view */
          <div className="flex-1 flex flex-col">
            {/* Language flags in chat view */}
            <div className="py-4 flex justify-center border-b border-border/30">
              <LanguageFlags value={language} onChange={setLanguage} />
            </div>

            {/* Chat messages */}
            <ChatMessages messages={messages} isLoading={isLoading} />

            {/* Bottom action bar */}
            <div className="p-4 border-t border-border/50 bg-background flex justify-center">
              <Button
                onClick={handleButtonClick}
                disabled={isTranscribing || isLoading}
                size="lg"
                className={cn(
                  "px-6 py-5 rounded-full gap-2 transition-all",
                  isRecording
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {getButtonIcon()}
                {getButtonText()}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground border-t border-border/30 bg-[#f0f0f0]">
        <p>© 2026 VoiceCareer. All rights reserved.</p>
      </footer>
    </div>
  );
}
