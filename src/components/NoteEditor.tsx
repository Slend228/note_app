import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Pause,
  Play,
  Square,
  Save,
  Tag,
  Bold,
  Italic,
  Underline,
  Type,
  Palette,
} from "lucide-react";
import AudioWaveform from "./AudioWaveform";
import AudioTranscription from "./AudioTranscription";
import SpeechToText from "./SpeechToText";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useVoiceCommands from "../hooks/useVoiceCommands";
import VoiceCommandIndicator from "./VoiceCommandIndicator";

interface NoteEditorProps {
  note?: {
    id: string;
    title: string;
    content: string;
    audioUrl?: string;
    hasAudio: boolean;
    tags: string[];
    updatedAt: Date;
    isFavorite: boolean;
  };
  onUpdateNote?: (note: {
    id: string;
    title: string;
    content: string;
    audioUrl?: string;
    hasAudio: boolean;
    tags: string[];
    updatedAt: Date;
    isFavorite: boolean;
  }) => void;
  onClose?: () => void;
}

const NoteEditor = ({
  note = {
    id: Date.now().toString(),
    title: "",
    content: "",
    hasAudio: false,
    tags: [],
    updatedAt: new Date(),
    isFavorite: false,
  },
  onUpdateNote,
  onClose,
}: NoteEditorProps) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(note.audioUrl);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [newTag, setNewTag] = useState("");
  const [isFavorite, setIsFavorite] = useState(note.isFavorite);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState<Float32Array | undefined>();

  // Text formatting states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontFamily, setFontFamily] = useState("sans-serif");
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // Audio recording references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Update component state when note prop changes (for note switching)
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setAudioUrl(note.audioUrl);
    setTags(note.tags);
    setIsFavorite(note.isFavorite);
    // Reset audio playback state
    setIsPlaying(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  }, [note]);

  // Start recording function
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrl);
          setAudioBlob(audioBlob);

          // Generate audio visualization data
          const sampleCount = 100;
          const mockAudioData = new Float32Array(sampleCount);
          for (let i = 0; i < sampleCount; i++) {
            mockAudioData[i] = Math.random() * 0.5 + 0.1;
          }
          setAudioData(mockAudioData);
        } catch (error) {
          console.error("Error processing audio:", error);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms for more responsive visualization
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert(
        "Не вдалося отримати доступ до мікрофона. Перевірте дозволи браузера.",
      );
    }
  };

  // Pause recording function
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      } catch (error) {
        console.error("Error pausing recording:", error);
        // Some browsers might not support pause/resume
        // In that case, we'll just stop the recording
        stopRecording();
      }
    } else if (mediaRecorderRef.current && isRecording && isPaused) {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } catch (error) {
        console.error("Error resuming recording:", error);
        // If resume fails, restart recording
        stopRecording();
        startRecording();
      }
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Stop all tracks on the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
  };

  // Play recorded audio
  const playAudio = () => {
    if (audioUrl && !isPlaying) {
      try {
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio(audioUrl);
          audioElementRef.current.onended = () => {
            setIsPlaying(false);
          };
          audioElementRef.current.onerror = (e) => {
            console.error("Audio playback error:", e);
            setIsPlaying(false);
            alert("Помилка відтворення аудіо. Спробуйте записати знову.");
          };
        } else {
          audioElementRef.current.src = audioUrl;
        }

        const playPromise = audioElementRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Audio play error:", error);
              setIsPlaying(false);
              alert("Помилка відтворення аудіо. Спробуйте записати знову.");
            });
        }
      } catch (error) {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      }
    }
  };

  // Pause audio playback
  const pauseAudio = () => {
    if (audioElementRef.current && isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Update audio data for visualization
  useEffect(() => {
    if (audioUrl && audioElementRef.current) {
      try {
        // In a real implementation, we would analyze the audio file
        // and extract the actual waveform data
        // For now, we'll generate random data for visualization
        if (!audioData) {
          const sampleCount = 100;
          const mockAudioData = new Float32Array(sampleCount);
          for (let i = 0; i < sampleCount; i++) {
            mockAudioData[i] = Math.random() * 0.5 + 0.1;
          }
          setAudioData(mockAudioData);
        }

        // Set up time update listener
        const audio = audioElementRef.current;
        const handleTimeUpdate = () => {
          setCurrentTime(audio.currentTime);
          if (audio.duration && !isNaN(audio.duration)) {
            setDuration(audio.duration);
          }
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setDuration(audio.duration);
          }
        });

        return () => {
          audio.removeEventListener("timeupdate", handleTimeUpdate);
        };
      } catch (error) {
        console.error("Error setting up audio visualization:", error);
      }
    }
  }, [audioUrl]);

  // Add tag function
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag("");
    }
  };

  // Remove tag function
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Toggle favorite
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  // Handle transcription complete
  const handleTranscriptionComplete = (text: string) => {
    const updatedContent = content ? `${content}\n\n${text}` : text;
    setContent(updatedContent);
  };

  // Save note function
  const handleSave = () => {
    if (onUpdateNote) {
      const updatedNote = {
        id: note.id,
        title,
        content,
        audioUrl,
        hasAudio: !!audioUrl,
        tags,
        updatedAt: new Date(),
        isFavorite,
      };
      onUpdateNote(updatedNote);
      return updatedNote;
    }
    return note;
  };

  // Apply text formatting with document.execCommand
  const applyFormatting = (
    format: "bold" | "italic" | "underline" | "color",
    color?: string,
  ) => {
    if (!editorRef.current) return;

    // Prevent multiple rapid executions
    const now = Date.now();
    const lastFormatTime = (window as any).lastFormatTime || 0;
    const formatDelay = 300; // 300ms between format operations

    if (now - lastFormatTime < formatDelay) {
      return;
    }
    (window as any).lastFormatTime = now;

    editorRef.current.focus();

    // Get current selection
    const selection = window.getSelection();
    if (!selection) return;

    // Check if text is selected
    const hasSelection = !selection.isCollapsed;

    // Apply formatting based on command
    switch (format) {
      case "bold":
        document.execCommand("bold", false);
        setIsBold(!isBold);
        break;
      case "italic":
        document.execCommand("italic", false);
        setIsItalic(!isItalic);
        break;
      case "underline":
        document.execCommand("underline", false);
        setIsUnderline(!isUnderline);
        break;
      case "color":
        if (color) {
          // Only apply color if text is selected
          if (hasSelection) {
            document.execCommand("foreColor", false, color);
          } else {
            // If no selection, just set the text color for future typing
            setTextColor(color);
            editorRef.current.style.color = color;
          }
        }
        break;
    }

    // Update content state with new HTML
    setContent(editorRef.current.innerHTML);
  };

  // Change font family
  const changeFont = (font: string) => {
    setFontFamily(font);
    if (editorRef.current) {
      // First focus the editor
      editorRef.current.focus();

      // Get current selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        // If text is selected, apply font to selection
        document.execCommand("fontName", false, font);
      } else {
        // If no selection, select all text and apply font
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand("fontName", false, font);
        // Collapse selection to end
        selection?.collapseToEnd();
      }

      // Update style for future typing
      editorRef.current.style.fontFamily = font;

      // Update content state
      setContent(editorRef.current.innerHTML);
    }
  };

  // Apply formatting to all text if nothing is selected
  const applyFormattingToAll = (
    format: "bold" | "italic" | "underline" | "color",
    color?: string,
  ) => {
    if (!editorRef.current) return;

    // Prevent multiple rapid executions
    const now = Date.now();
    const lastFormatAllTime = (window as any).lastFormatAllTime || 0;
    const formatDelay = 500; // 500ms between format operations

    if (now - lastFormatAllTime < formatDelay) {
      return;
    }
    (window as any).lastFormatAllTime = now;

    editorRef.current.focus();

    // Get current selection
    const selection = window.getSelection();
    if (!selection) return;

    // If nothing is selected, select all text
    if (selection.isCollapsed) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Apply formatting
    applyFormatting(format, color);
  };

  // Undo and redo functions
  const undoAction = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("undo", false);
      // Update content state with new HTML after a small delay to ensure changes are applied
      setTimeout(() => {
        if (editorRef.current) {
          setContent(editorRef.current.innerHTML);
        }
      }, 10);
    }
  };

  const redoAction = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("redo", false);
      // Update content state with new HTML after a small delay to ensure changes are applied
      setTimeout(() => {
        if (editorRef.current) {
          setContent(editorRef.current.innerHTML);
        }
      }, 10);
    }
  };

  // Voice commands setup - updated for Ukrainian language with variations
  const voiceCommands = [
    {
      phrases: [
        "зробити жирним",
        "жирний текст",
        "жирний",
        "зроби жирним",
        "жирний шрифт",
        "зробити текст жирним",
        "текст жирним",
        "жирним шрифтом",
      ],
      handler: () => applyFormattingToAll("bold"),
      description: "Зробити текст жирним",
    },
    {
      phrases: [
        "зробити курсивом",
        "курсив",
        "курсивний",
        "зроби курсивом",
        "курсивний шрифт",
        "нахилений текст",
        "зробити текст курсивом",
        "текст курсивом",
        "курсивним шрифтом",
      ],
      handler: () => applyFormattingToAll("italic"),
      description: "Зробити текст курсивом",
    },
    {
      phrases: [
        "підкреслити",
        "підкреслений текст",
        "підкреслений",
        "зроби підкресленим",
        "підкреслити текст",
        "зробити підкресленим",
        "текст підкресленим",
      ],
      handler: () => applyFormattingToAll("underline"),
      description: "Підкреслити текст",
    },
    {
      phrases: [
        "змінити шрифт на аріал",
        "використати аріал",
        "аріал",
        "шрифт аріал",
        "arial",
        "аріель",
        "шрифт arial",
        "шрифт ариал",
        "ариал",
        "поставити аріал",
        "поставити arial",
        "поставити шрифт аріал",
        "шрифт аріаль",
      ],
      handler: () => changeFont("Arial"),
      description: "Змінити шрифт на Arial",
    },
    {
      phrases: [
        "змінити шрифт на таймс",
        "використати таймс",
        "таймс",
        "шрифт таймс",
        "times",
        "таймс нью роман",
        "шрифт times",
        "шрифт таймс нью роман",
        "поставити таймс",
        "поставити times",
        "поставити шрифт таймс",
        "times new roman",
      ],
      handler: () => changeFont("Times New Roman"),
      description: "Змінити шрифт на Times New Roman",
    },
    {
      phrases: [
        "змінити шрифт на кур'єр",
        "використати кур'єр",
        "кур'єр",
        "шрифт кур'єр",
        "courier",
        "курьер",
        "курєр",
        "courier new",
        "шрифт courier",
        "змінити на courier",
        "поміняти на кур'єр",
        "поставити кур'єр",
      ],
      handler: () => changeFont("Courier New"),
      description: "Змінити шрифт на Courier New",
    },
    {
      phrases: [
        "змінити шрифт на джорджія",
        "використати джорджія",
        "джорджія",
        "шрифт джорджія",
        "georgia",
        "джорджия",
        "шрифт georgia",
        "змінити на georgia",
        "поміняти на джорджія",
        "поставити джорджія",
      ],
      handler: () => changeFont("Georgia"),
      description: "Змінити шрифт на Georgia",
    },
    {
      phrases: [
        "почати запис",
        "записати аудіо",
        "запис аудіо",
        "почни запис",
        "запиши аудіо",
      ],
      handler: startRecording,
      description: "Почати запис аудіо",
    },
    {
      phrases: [
        "зупинити запис",
        "стоп запис",
        "зупини запис",
        "припини запис",
      ],
      handler: stopRecording,
      description: "Зупинити запис аудіо",
    },
    {
      phrases: ["зберегти нотатку", "зберегти", "збережи нотатку", "збережи"],
      handler: handleSave,
      description: "Зберегти поточну нотатку",
    },
    {
      phrases: [
        "змінити фон на чорний",
        "темний фон",
        "темний режим",
        "чорний фон",
        "темна тема",
      ],
      handler: () => setBgColor("#1e1e1e"),
      description: "Змінити фон на темний",
    },
    {
      phrases: [
        "змінити фон на білий",
        "світлий фон",
        "світлий режим",
        "білий фон",
        "світла тема",
      ],
      handler: () => setBgColor("#ffffff"),
      description: "Змінити фон на світлий",
    },
    {
      phrases: [
        "змінити текст на білий",
        "білий текст",
        "білим кольором",
        "білим",
      ],
      handler: () => setTextColor("#ffffff"),
      description: "Змінити колір тексту на білий",
    },
    {
      phrases: [
        "змінити текст на чорний",
        "чорний текст",
        "чорним кольором",
        "чорним",
      ],
      handler: () => setTextColor("#000000"),
      description: "Змінити колір тексту на чорний",
    },
    {
      phrases: [
        "змінити колір тексту на червоний",
        "червоний текст",
        "червоним кольором",
        "червоним",
      ],
      handler: () => setTextColor("#FF0000"),
      description: "Змінити колір тексту на червоний",
    },
    {
      phrases: [
        "змінити колір тексту на синій",
        "синій текст",
        "синім кольором",
        "синім",
      ],
      handler: () => setTextColor("#0000FF"),
      description: "Змінити колір тексту на синій",
    },
    {
      phrases: [
        "змінити колір тексту на зелений",
        "зелений текст",
        "зеленим кольором",
        "зеленим",
      ],
      handler: () => setTextColor("#00FF00"),
      description: "Змінити колір тексту на зелений",
    },
    {
      phrases: ["додати тег", "додай тег", "створити тег", "створи тег"],
      handler: () => {
        if (newTag.trim()) {
          addTag();
        }
      },
      description: "Додати поточний тег",
    },
    {
      phrases: ["відмінити", "скасувати", "відміни", "скасувати дію"],
      handler: undoAction,
      description:
        "Відмінити останню дію (Ctrl+Z) - скасовує останню зміну тексту",
    },
    {
      phrases: ["повторити", "повтори", "повторити дію"],
      handler: redoAction,
      description:
        "Повторити скасовану дію (Ctrl+Y) - повертає скасовану зміну",
    },
  ];

  const { isListening, transcript, error, toggleListening } = useVoiceCommands({
    commands: voiceCommands,
    isListening: voiceCommandsEnabled,
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex justify-between items-center mb-4 p-2 bg-muted/10 rounded-md">
        <VoiceCommandIndicator
          isListening={isListening}
          toggleListening={() => setVoiceCommandsEnabled(!voiceCommandsEnabled)}
          transcript={transcript}
          error={error}
          availableCommands={[
            "Зробити жирним",
            "Зробити курсивом",
            "Підкреслити текст",
            "Змінити шрифт на аріал (або просто 'аріал', 'arial')",
            "Змінити шрифт на таймс (або просто 'таймс', 'times')",
            "Змінити шрифт на кур'єр (або просто 'кур'єр', 'courier')",
            "Змінити шрифт на джорджія (або просто 'джорджія', 'georgia')",
            "Почати запис",
            "Зупинити запис",
            "Зберегти нотатку",
            "Змінити колір тексту на червоний",
            "Змінити колір тексту на синій",
            "Змінити колір тексту на зелений",
            "Відмінити (скасувати останню дію)",
            "Повторити (повернути скасовану дію)",
            "Темний режим",
            "Світлий режим",
            "Білий текст",
            "Чорний текст",
          ]}
        />
        <div className="flex items-center gap-2 w-full">
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold border-none focus:outline-none bg-transparent w-full"
          />
          <Button
            onClick={toggleFavorite}
            variant="ghost"
            size="icon"
            className={isFavorite ? "text-yellow-400" : "text-muted-foreground"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              className="w-5 h-5"
              strokeWidth={isFavorite ? "0" : "2"}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Save size={16} />
            Зберегти
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              if (onClose) {
                // First save any changes
                if (onUpdateNote) {
                  const updatedNote = {
                    ...note,
                    title,
                    content,
                    audioUrl,
                    hasAudio: !!audioUrl,
                    tags,
                    updatedAt: new Date(),
                    isFavorite,
                  };
                  onUpdateNote(updatedNote);
                }

                // Use setTimeout to ensure the close happens after the current event loop
                setTimeout(() => {
                  onClose();
                }, 0);
              }
            }}
            variant="ghost"
            className="flex items-center gap-2"
            title="Закрити"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            Закрити
          </Button>
        </div>
      </div>

      <div className="flex-grow mb-4">
        <div className="bg-muted/20 p-2 mb-2 rounded-md flex flex-wrap gap-2">
          {/* Text formatting */}
          <div
            className="flex gap-1 border-r pr-1"
            style={{ alignItems: "center", height: "36px" }}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isBold ? "default" : "outline"}
                    size="icon"
                    onClick={() => applyFormatting("bold")}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Жирний (Ctrl+B)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isItalic ? "default" : "outline"}
                    size="icon"
                    onClick={() => applyFormatting("italic")}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Курсив (Ctrl+I)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isUnderline ? "default" : "outline"}
                    size="icon"
                    onClick={() => applyFormatting("underline")}
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Підкреслений (Ctrl+U)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Removed alignment and list sections as requested */}

          {/* Font and colors */}
          <div
            className="flex gap-1"
            style={{ alignItems: "center", height: "36px" }}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Type className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Шрифт</h4>
                  <ToggleGroup
                    type="single"
                    value={fontFamily}
                    onValueChange={(value) => value && changeFont(value)}
                  >
                    <ToggleGroupItem value="Arial" className="text-xs">
                      Arial
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="Times New Roman"
                      className="text-xs"
                    >
                      Times
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Courier New" className="text-xs">
                      Courier
                    </ToggleGroupItem>
                    <ToggleGroupItem value="Georgia" className="text-xs">
                      Georgia
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-sm">Колір тексту</h4>
                    <div className="flex mt-1 gap-1">
                      {[
                        "#000000",
                        "#FF0000",
                        "#00FF00",
                        "#0000FF",
                        "#FFFF00",
                        "#FF00FF",
                        "#00FFFF",
                      ].map((color) => (
                        <div
                          key={color}
                          className={`w-6 h-6 rounded-full cursor-pointer ${textColor === color ? "ring-2 ring-primary" : ""}`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            // Apply color to selected text or set for future typing
                            if (editorRef.current) {
                              editorRef.current.focus();
                              const selection = window.getSelection();
                              if (selection && !selection.isCollapsed) {
                                // If text is selected, apply color to selection
                                applyFormatting("color", color);
                              } else {
                                // If no selection, just set the color for future typing
                                setTextColor(color);
                                editorRef.current.style.color = color;
                              }
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Колір фону</h4>
                    <div className="flex mt-1 gap-1">
                      {[
                        "#FFFFFF",
                        "#F8F9FA",
                        "#F1F3F5",
                        "#E9ECEF",
                        "#DEE2E6",
                        "#CED4DA",
                        "#ADB5BD",
                      ].map((color) => (
                        <div
                          key={color}
                          className={`w-6 h-6 rounded-full cursor-pointer ${bgColor === color ? "ring-2 ring-primary" : ""}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setBgColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Speech to text */}
          <div className="ml-auto">
            <SpeechToText
              onTranscript={(text) => {
                // Insert the transcribed text at cursor position or append to content
                if (editorRef.current) {
                  const selection = window.getSelection();
                  if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);

                    // Check if we need to add a space before the new text
                    let needsSpace = false;
                    const container = range.startContainer;
                    if (
                      container.nodeType === Node.TEXT_NODE &&
                      range.startOffset > 0
                    ) {
                      const lastChar = container.textContent?.charAt(
                        range.startOffset - 1,
                      );
                      if (
                        lastChar &&
                        lastChar !== " " &&
                        lastChar !== "\n" &&
                        (lastChar === "." ||
                          lastChar === "!" ||
                          lastChar === "?")
                      ) {
                        needsSpace = true;
                      }
                    }

                    // Add space if needed
                    const textToInsert = needsSpace ? " " + text : text;
                    const textNode = document.createTextNode(textToInsert);
                    range.deleteContents();
                    range.insertNode(textNode);

                    // Move cursor after inserted text
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);

                    // Update content state
                    setContent(editorRef.current.innerHTML);
                  } else {
                    // If no selection, append to the end
                    editorRef.current.focus();

                    // Check if we need to add a space
                    const currentContent = editorRef.current.innerHTML;
                    const lastChar = currentContent.trim().slice(-1);
                    let textToInsert = text;

                    if (
                      currentContent &&
                      lastChar &&
                      (lastChar === "." || lastChar === "!" || lastChar === "?")
                    ) {
                      textToInsert = " " + text;
                    }

                    document.execCommand("insertText", false, textToInsert);
                    setContent(editorRef.current.innerHTML);
                  }
                } else {
                  // If no editor ref, just append with space logic
                  const lastChar = content.trim().slice(-1);
                  let textToInsert = text;

                  if (
                    content &&
                    lastChar &&
                    (lastChar === "." || lastChar === "!" || lastChar === "?")
                  ) {
                    textToInsert = " " + text;
                  }

                  setContent(
                    content +
                      (content && !textToInsert.startsWith(" ") ? " " : "") +
                      textToInsert,
                  );
                }
              }}
            />
          </div>
        </div>

        <div className="w-full h-full min-h-[300px] border rounded-md overflow-auto">
          <div
            contentEditable="true"
            ref={editorRef}
            className="w-full h-full min-h-[300px] resize-none p-4 focus:outline-none"
            style={{
              fontFamily,
              color: textColor,
              backgroundColor: bgColor,
              direction: "ltr" /* Ensure text direction is left-to-right */,
            }}
            onInput={(e) => {
              // Update content when div content changes
              setContent((e.target as HTMLDivElement).innerHTML);
            }}
            dangerouslySetInnerHTML={{ __html: content }}
            dir="ltr" /* Explicitly set text direction to left-to-right */
          />
        </div>
      </div>

      {/* Tags section */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Теги</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 h-3 w-3 rounded-full bg-muted-foreground/30 text-muted-foreground flex items-center justify-center hover:bg-muted-foreground/50"
              >
                <span className="sr-only">Remove tag</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Додати тег"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            className="h-8 text-sm"
          />
          <Button onClick={addTag} variant="outline" size="sm">
            Додати
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <AudioWaveform
              isRecording={isRecording}
              isPlaying={isPlaying}
              audioData={audioData}
              duration={duration}
              currentTime={currentTime}
            />

            <div className="flex justify-center gap-2">
              {!isRecording && !audioUrl && (
                <Button
                  onClick={startRecording}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Mic size={16} />
                  Запис
                </Button>
              )}

              {isRecording && (
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

              {audioUrl && !isRecording && (
                <>
                  <Button
                    onClick={isPlaying ? pauseAudio : playAudio}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    {isPlaying ? "Пауза" : "Відтворити"}
                  </Button>
                  <Button
                    onClick={startRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Mic size={16} />
                    Новий запис
                  </Button>
                </>
              )}
            </div>

            {audioUrl && (
              <AudioTranscription
                audioUrl={audioUrl}
                onTranscriptionComplete={handleTranscriptionComplete}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoteEditor;
