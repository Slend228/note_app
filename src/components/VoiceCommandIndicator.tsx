import React from "react";
import { Mic, MicOff } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface VoiceCommandIndicatorProps {
  isListening: boolean;
  toggleListening: () => void;
  transcript: string;
  error: string | null;
  availableCommands?: string[];
}

const VoiceCommandIndicator = ({
  isListening,
  toggleListening,
  transcript,
  error,
  availableCommands = [],
}: VoiceCommandIndicatorProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleListening}
                variant={isListening ? "default" : "outline"}
                size="sm"
                className={`relative ${isListening ? "bg-primary text-primary-foreground" : ""}`}
              >
                {isListening ? (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    <span>Listening</span>
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  </>
                ) : (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    <span>Voice Commands</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isListening
                  ? "Click to stop voice commands"
                  : "Click to enable voice commands"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {isListening && transcript && (
          <Badge variant="outline" className="animate-pulse">
            {transcript}
          </Badge>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isListening && availableCommands.length > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          <p className="font-medium">Available commands:</p>
          <ul className="list-disc list-inside max-h-40 overflow-y-auto">
            {availableCommands.map((command, index) => (
              <li key={index}>{command}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandIndicator;
