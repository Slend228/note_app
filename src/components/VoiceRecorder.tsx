import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Play, Square } from "lucide-react";
import AudioWaveform from "./AudioWaveform";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, url: string) => void;
}

const VoiceRecorder = ({ onRecordingComplete }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start recording function
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        onRecordingComplete(audioBlob, url);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(
        "Не вдалося отримати доступ до мікрофона. Перевірте дозволи браузера.",
      );
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      } catch (err) {
        console.error("Error pausing recording:", err);
      }
    } else if (mediaRecorderRef.current && isRecording && isPaused) {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } catch (err) {
        console.error("Error resuming recording:", err);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream
          ?.getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [isRecording]);

  return (
    <div className="space-y-4">
      <AudioWaveform isRecording={isRecording} />

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mic size={16} />
            Запис
          </Button>
        ) : (
          <>
            <Button
              onClick={pauseRecording}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              {isPaused ? "Продовжити" : "Пауза"}
            </Button>
            <Button
              onClick={stopRecording}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square size={16} />
              Стоп
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
