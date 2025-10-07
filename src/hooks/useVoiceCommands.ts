import { useEffect, useState, useCallback } from "react";

type CommandHandler = (args?: string) => void;

interface VoiceCommand {
  phrases: string[];
  handler: CommandHandler;
  description: string;
  extractArgs?: (transcript: string) => string | undefined;
}

interface UseVoiceCommandsProps {
  commands: VoiceCommand[];
  isListening?: boolean;
}

const useVoiceCommands = ({
  commands,
  isListening = false,
}: UseVoiceCommandsProps) => {
  const [listening, setListening] = useState(isListening);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null,
  );

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Check if browser supports speech recognition
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
          setError("Speech recognition not supported in this browser");
          return;
        }

        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "uk-UA"; // Ukrainian language

        setRecognition(recognitionInstance);
      } catch (err) {
        setError("Error initializing speech recognition");
        console.error("Speech recognition error:", err);
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Set up event listeners for speech recognition
  useEffect(() => {
    if (!recognition) return;

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join("");

      setTranscript(transcript);

      // Check if any command matches
      // Use a debounce mechanism to prevent multiple executions
      const now = Date.now();
      const lastCommandTime = (window as any).lastVoiceCommandTime || 0;
      const commandDelay = 1500;

      if (now - lastCommandTime > commandDelay) {
        // Find the first matching command
        const matchedCommand = commands.find((command) => {
          // More strict command matching - match exact phrases or with word boundaries
          return command.phrases.some((phrase) => {
            const lowerTranscript = transcript.toLowerCase();
            const lowerPhrase = phrase.toLowerCase();

            if (lowerTranscript === lowerPhrase) {
              return true;
            }

            // Check for phrase with word boundaries
            const regex = new RegExp(`\\b${lowerPhrase}\\b`, "i");
            return regex.test(lowerTranscript);
          });
        });

        if (matchedCommand) {
          let args;
          if (matchedCommand.extractArgs) {
            args = matchedCommand.extractArgs(transcript);
          }

          // Set the last command time
          (window as any).lastVoiceCommandTime = now;

          setTimeout(() => {
            matchedCommand.handler(args);
            // Clear transcript after command execution
            setTranscript("");
          }, 100);
        }
      }
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      setError(`Speech recognition error: ${event.error}`);
      setListening(false);
    };

    const handleEnd = () => {
      // Restart if we're supposed to be listening
      if (listening) {
        try {
          setTimeout(() => {
            if (listening) {
              recognition.start();
              console.log("Restarted voice commands recognition");
            }
          }, 100);
        } catch (err) {
          console.error("Failed to restart voice commands recognition:", err);
        }
      }
    };

    recognition.addEventListener("result", handleResult);
    recognition.addEventListener("error", handleError);
    recognition.addEventListener("end", handleEnd);

    return () => {
      recognition.removeEventListener("result", handleResult);
      recognition.removeEventListener("error", handleError);
      recognition.removeEventListener("end", handleEnd);
    };
  }, [recognition, commands, listening]);

  // Start/stop listening based on isListening prop
  useEffect(() => {
    if (!recognition) return;

    if (isListening && !listening) {
      try {
        recognition.start();
        setListening(true);
        setError(null);
      } catch (err) {
        setError("Error starting speech recognition");
        console.error("Speech recognition start error:", err);
      }
    } else if (!isListening && listening) {
      try {
        recognition.stop();
        setListening(false);
      } catch (err) {
        console.error("Speech recognition stop error:", err);
      }
    }
  }, [isListening, listening, recognition]);

  const toggleListening = useCallback(() => {
    setListening((prev) => !prev);
  }, []);

  return {
    isListening: listening,
    transcript,
    error,
    toggleListening,
  };
};

export default useVoiceCommands;

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
