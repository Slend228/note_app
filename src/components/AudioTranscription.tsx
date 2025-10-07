import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

interface AudioTranscriptionProps {
  audioUrl?: string;
  onTranscriptionComplete?: (text: string) => void;
}

const AudioTranscription = ({
  audioUrl,
  onTranscriptionComplete,
}: AudioTranscriptionProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState<string>("");

  const handleTranscribe = async () => {
    if (!audioUrl) return;

    setIsTranscribing(true);

    try {
      // In a real app, you would send the audio to a transcription service like OpenAI Whisper API
      // For this demo, we'll simulate a transcription with a timeout
      // Simulate real transcription by using the Web Speech API
      try {
        // @ts-ignore - TypeScript doesn't have types for the Web Speech API
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          throw new Error("Браузер не підтримує розпізнавання мови");
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "uk-UA";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setTranscriptionText(transcript);
          if (onTranscriptionComplete) {
            onTranscriptionComplete(transcript);
          }
          setIsTranscribing(false);
        };

        recognition.onerror = () => {
          setTranscriptionText("Помилка розпізнавання мови. Спробуйте ще раз.");
          setIsTranscribing(false);
        };

        recognition.start();
      } catch (error) {
        console.error("Speech recognition error:", error);
        setTranscriptionText("Помилка розпізнавання мови. Спробуйте ще раз.");
        setIsTranscribing(false);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      setIsTranscribing(false);
    }
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="mt-4">
      <Button
        onClick={handleTranscribe}
        disabled={isTranscribing || !audioUrl}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isTranscribing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Транскрибування...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            Транскрибувати аудіо
          </>
        )}
      </Button>

      {transcriptionText && (
        <div className="mt-4 p-3 bg-muted/30 rounded-md">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Транскрипція
          </h4>
          <p className="text-sm">{transcriptionText}</p>
        </div>
      )}
    </div>
  );
};

export default AudioTranscription;
