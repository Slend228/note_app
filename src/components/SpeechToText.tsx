import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface SpeechToTextProps {
  onTranscript: (text: string) => void;
}

const SpeechToText = ({ onTranscript }: SpeechToTextProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);

  const formatText = (text: string): string => {
    if (!text || text.length === 0) return text;

    text = text.toLowerCase();

    text = text.charAt(0).toUpperCase() + text.slice(1);

    const lastChar = text.slice(-1);
    if (lastChar !== "." && lastChar !== "?" && lastChar !== "!") {
      text = text + ".";
    }

    return text;
  };

  // Initialize speech recognition
  useEffect(() => {
    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError("Ваш браузер не підтримує розпізнавання мови");
        return;
      }

      // Create recognition instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.lang = "uk-UA";

      recognition.onresult = (event: any) => {
        try {
          const current = event.resultIndex;
          const result = event.results[current];
          let transcriptText = result[0].transcript;

          transcriptText = transcriptText.trim();

          // Format the text
          if (result.isFinal) {
            transcriptText = formatText(transcriptText);

            // Additional processing for better quality
            // Replace common misrecognitions
            const replacements = {
              зробіть: "зробити",
              "зроби ти": "зробити",
              "зроби те": "зробити",
              зробіт: "зробити",
              "жирним текстом": "жирний текст",
              ариал: "аріал",
              arial: "аріал",
              times: "таймс",
              courier: "кур'єр",
              georgia: "джорджія",
            };

            Object.entries(replacements).forEach(([incorrect, correct]) => {
              const regex = new RegExp(`\\b${incorrect}\\b`, "gi");
              transcriptText = transcriptText.replace(regex, correct);
            });
          }

          console.log("Speech recognized:", transcriptText);
          setTranscript(transcriptText);

          if (result.isFinal) {
            onTranscript(transcriptText);
            setTranscript("");
          }
        } catch (err) {
          console.error("Error processing speech result:", err);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (
          event.error !== "no-speech" &&
          event.error !== "aborted" &&
          event.error !== "network"
        ) {
          setError(`Помилка розпізнавання: ${event.error}`);
        }

        // Never stop listening automatically, only when user clicks the button
        // Keep the recognition active even on errors
        if (isListeningRef.current) {
          try {
            setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                try {
                  // Check if recognition is already running before starting
                  if (recognitionRef.current.state !== "active") {
                    recognitionRef.current.start();
                    console.log("Restarted speech recognition after error");
                  }
                } catch (startErr) {
                  console.error("Error restarting recognition:", startErr);
                }
              }
            }, 100);
          } catch (err) {
            console.error("Failed to restart after error:", err);
          }
        }
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        // If still supposed to be listening, restart recognition
        if (isListeningRef.current) {
          try {
            setTimeout(() => {
              if (isListeningRef.current && recognitionRef.current) {
                recognitionRef.current.start();
                console.log("Restarted speech recognition");
              }
            }, 100);
          } catch (err) {
            console.error("Failed to restart speech recognition:", err);
            setIsListening(false);
            isListeningRef.current = false;
            setError("Не вдалося перезапустити розпізнавання мови");
          }
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Error initializing speech recognition:", err);
      setError("Помилка ініціалізації розпізнавання мови");
    }

    return () => {
      if (recognitionRef.current) {
        try {
          isListeningRef.current = false;
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping recognition:", err);
        }
      }
    };
  }, [onTranscript]);

  useEffect(() => {
    if (!recognitionRef.current) return;

    isListeningRef.current = isListening;

    if (isListening) {
      try {
        recognitionRef.current.lang = "uk-UA";
        recognitionRef.current.start();
        console.log("Started speech recognition with Ukrainian");
      } catch (err) {
        console.error(
          "Failed to start speech recognition with Ukrainian:",
          err,
        );
        setError("Помилка запуску розпізнавання мови");
        setIsListening(false);
        isListeningRef.current = false;
      }
    } else {
      try {
        recognitionRef.current.stop();
        console.log("Stopped speech recognition");
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }
  }, [isListening]);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (error) setError(null);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        onClick={toggleListening}
        variant={isListening ? "default" : "outline"}
        className={`flex items-center gap-2 ${isListening ? "bg-red-500 hover:bg-red-600" : ""}`}
        style={{ height: "36px" }} /* Fixed height to prevent stretching */
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            Зупинити диктування
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Почати диктування
          </>
        )}
      </Button>

      {isListening && transcript && (
        <div className="p-2 bg-muted/30 rounded-md w-full">
          <p className="text-sm italic">{transcript}...</p>
        </div>
      )}

      {error && (
        <div className="p-2 bg-destructive/10 text-destructive rounded-md w-full">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SpeechToText;
