import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Settings,
  Loader2,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import NotesList from "./NotesList";
import NoteEditor from "./NoteEditor";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";
import { useAuth } from "../contexts/AuthContext";
import AuthContainer from "./Auth/AuthContainer";
// Import API functions
import {
  initializeDatabase,
  getNotes as getNotesFromDb,
  createNote as createNoteInDb,
  updateNote as updateNoteInDb,
  getFolders as getFoldersFromDb,
  createFolder as createFolderInDb,
  moveNoteToFolder as moveNoteToFolderInDb,
  moveNoteToTrash as moveNoteToTrashInDb,
  restoreNoteFromTrash as restoreNoteFromTrashInDb,
  deleteNotePermanently as deleteNotePermanentlyInDb,
} from "../lib/api";

interface Note {
  id: string;
  title: string;
  content: string;
  audioUrl?: string;
  hasAudio: boolean;
  tags: string[];
  updatedAt: Date;
  isFavorite: boolean;
  folderId?: string | null;
  isDeleted?: boolean;
}

interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
}

export default function Home() {
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    login,
    register,
    logout,
    requestPasswordReset,
  } = useAuth();
  // Force refresh auth state when component mounts
  useEffect(() => {
    // Clear any stale auth data on fresh load
    if (window.location.search.includes("force_logout=true")) {
      localStorage.removeItem("auth_token");
      window.location.href = window.location.pathname;
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    setIsDarkMode(prefersDark);

    if (prefersDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    const setup = async () => {
      try {
        const initialized = await initializeDatabase();
        setDbInitialized(initialized);

        if (initialized) {
          const fetchedNotes = await getNotesFromDb();
          const fetchedFolders = await getFoldersFromDb();

          const formattedNotes: Note[] = fetchedNotes.map((note) => ({
            id: note.id,
            title: note.title,
            content: note.content,
            audioUrl: note.audio_url,
            hasAudio: note.has_audio,
            tags: note.tags || [],
            updatedAt: new Date(note.updated_at),
            isFavorite: note.is_favorite,
            folderId: note.folder_id,
            isDeleted: note.is_deleted,
          }));

          const formattedFolders: Folder[] = fetchedFolders.map((folder) => ({
            id: folder.id,
            name: folder.name,
            color: folder.color,
            createdAt: new Date(folder.created_at),
          }));

          setNotes(formattedNotes);
          setFolders(formattedFolders);
        } else {
          setFolders([
            {
              id: "folder-1",
              name: "Work",
              color: "#4f46e5",
              createdAt: new Date("2023-06-10"),
            },
            {
              id: "folder-2",
              name: "Personal",
              color: "#10b981",
              createdAt: new Date("2023-06-11"),
            },
            {
              id: "folder-3",
              name: "Ideas",
              color: "#f59e0b",
              createdAt: new Date("2023-06-12"),
            },
          ]);

          setNotes([
            {
              id: "1",
              title: "Meeting Notes",
              content: "Discussed project timeline and deliverables",
              hasAudio: true,
              tags: ["work", "project"],
              updatedAt: new Date("2023-06-15"),
              isFavorite: true,
              folderId: "folder-1",
              isDeleted: false,
            },
            {
              id: "2",
              title: "Shopping List",
              content: "Milk, eggs, bread, vegetables",
              hasAudio: false,
              tags: ["personal"],
              updatedAt: new Date("2023-06-14"),
              isFavorite: false,
              folderId: "folder-2",
              isDeleted: false,
            },
            {
              id: "3",
              title: "Book Ideas",
              content: "Character development for protagonist",
              hasAudio: true,
              tags: ["creative", "writing"],
              updatedAt: new Date("2023-06-13"),
              isFavorite: false,
              folderId: "folder-3",
              isDeleted: false,
            },
          ]);
        }
      } catch (error) {
        console.error("Error setting up database:", error);
      } finally {
        setIsLoading(false);
      }
    };

    setup();
  }, []);

  const createNewNote = async () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      hasAudio: false,
      tags: [],
      updatedAt: new Date(),
      isFavorite: false,
      folderId: selectedFolderId,
      isDeleted: false,
    };

    if (dbInitialized) {
      // Save to database
      await createNoteInDb({
        title: newNote.title,
        content: newNote.content,
        has_audio: newNote.hasAudio,
        tags: newNote.tags,
        is_favorite: newNote.isFavorite,
        folder_id: newNote.folderId,
        is_deleted: false,
      });
    }

    setNotes([newNote, ...notes]);
    setSelectedNote(newNote);
    setShowTrash(false); // Ensure we're not in trash view when creating a note
  };

  const createNewFolder = async (name: string, color?: string) => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      name,
      color,
      createdAt: new Date(),
    };

    if (dbInitialized) {
      // Save to database
      await createFolderInDb(name, color);
    }

    setFolders([...folders, newFolder]);
  };

  const updateNote = async (updatedNote: Note) => {
    if (dbInitialized) {
      // Update in database
      await updateNoteInDb({
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        audio_url: updatedNote.audioUrl,
        has_audio: updatedNote.hasAudio,
        tags: updatedNote.tags,
        updated_at: updatedNote.updatedAt,
        is_favorite: updatedNote.isFavorite,
        folder_id: updatedNote.folderId,
        is_deleted: updatedNote.isDeleted,
      });
    }

    // Update the note in the notes array instead of creating a new one
    setNotes(
      notes.map((note) => (note.id === updatedNote.id ? updatedNote : note)),
    );
    // Make sure we update the selected note reference
    setSelectedNote(updatedNote);
  };

  const handleMoveNoteToFolder = async (
    noteId: string,
    folderId: string | null,
  ) => {
    if (dbInitialized) {
      // Update in database
      await moveNoteToFolderInDb(noteId, folderId);
    }

    setNotes(
      notes.map((note) => (note.id === noteId ? { ...note, folderId } : note)),
    );

    // If the currently selected note is being moved, update it
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote({ ...selectedNote, folderId });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (dbInitialized) {
      // Move to trash in database
      await moveNoteToTrashInDb(noteId);
    }

    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, isDeleted: true } : note,
      ),
    );

    // If the currently selected note is being deleted, deselect it
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(null);
    }
  };

  const handleRestoreNote = async (noteId: string) => {
    if (dbInitialized) {
      // Restore from trash in database
      await restoreNoteFromTrashInDb(noteId);
    }

    setNotes(
      notes.map((note) =>
        note.id === noteId ? { ...note, isDeleted: false } : note,
      ),
    );
  };

  const handleDeleteNotePermanently = async (noteId: string) => {
    if (dbInitialized) {
      // Delete permanently from database
      await deleteNotePermanentlyInDb(noteId);
    }

    setNotes(notes.filter((note) => note.id !== noteId));

    // If the currently selected note is being permanently deleted, deselect it
    if (selectedNote && selectedNote.id === noteId) {
      setSelectedNote(null);
    }
  };

  // Calculate folder counts
  const folderCounts = notes.reduce(
    (acc, note) => {
      if (!note.isDeleted && note.folderId) {
        acc[note.folderId] = (acc[note.folderId] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  // Add counts to folders
  const foldersWithCounts = folders.map((folder) => ({
    ...folder,
    notesCount: folderCounts[folder.id] || 0,
  }));

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  // Helper function to format dates
  const formatDate = (date: Date | string): string => {
    try {
      // Ensure we have a Date object
      const dateObj = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diffInDays = Math.floor(
        (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffInDays === 0) return "Today";
      if (diffInDays === 1) return "Yesterday";
      if (diffInDays < 7) return `${diffInDays} days ago`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;

      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Unknown date";
    }
  };

  // Handle closing a note
  const handleCloseNote = () => {
    // Immediately set to null and prevent any reopening
    setSelectedNote(null);
    // Clear any pending state updates
    setTimeout(() => {
      setSelectedNote(null);
    }, 0);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthContainer
        onLogin={login}
        onRegister={register}
        onRequestPasswordReset={requestPasswordReset}
      />
    );
  }

  return (
    <div className={`flex h-screen bg-background ${isDarkMode ? "dark" : ""}`}>
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col bg-muted/20">
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Нотатки</h1>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                title={
                  isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              {/* Settings button removed as requested */}
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {user && (
            <div className="text-sm text-muted-foreground">
              Увійшли як {user.name}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук нотаток..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button onClick={createNewNote}>
            <Plus className="h-4 w-4 mr-2" />
            Нова нотатка
          </Button>
        </div>

        <Separator />

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <NotesList
              notes={filteredNotes.map((note) => ({
                id: note.id,
                title: note.title,
                preview: note.content,
                hasAudio: note.hasAudio,
                tags: note.tags,
                date: formatDate(note.updatedAt),
                isFavorite: note.isFavorite,
                folderId: note.folderId,
                isDeleted: note.isDeleted,
              }))}
              folders={foldersWithCounts}
              selectedNoteId={selectedNote?.id}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onNoteSelect={(id) => {
                // Don't do anything if clicking the same note
                if (selectedNote && selectedNote.id === id) return;

                try {
                  // First save any changes to the current note if needed
                  if (selectedNote) {
                    const updatedNote = { ...selectedNote };
                    updateNote(updatedNote);
                  }

                  // Now select the new note
                  const noteToSelect =
                    notes.find((note) => note.id === id) || null;

                  // Use setTimeout to ensure state updates don't conflict
                  setTimeout(() => {
                    if (noteToSelect) {
                      // Create a fresh copy to avoid reference issues
                      const noteCopy = JSON.parse(JSON.stringify(noteToSelect));
                      setSelectedNote(noteCopy);
                    } else {
                      setSelectedNote(null);
                    }
                  }, 0);
                } catch (error) {
                  console.error("Error switching notes:", error);
                  // Fallback: just try to select the note directly
                  const noteToSelect =
                    notes.find((note) => note.id === id) || null;
                  setSelectedNote(noteToSelect);
                }
              }}
              onCreateNote={createNewNote}
              onCreateFolder={createNewFolder}
              onMoveNoteToFolder={handleMoveNoteToFolder}
              onDeleteNote={handleDeleteNote}
              onRestoreNote={handleRestoreNote}
              onDeleteNotePermanently={handleDeleteNotePermanently}
              showTrash={showTrash}
              onToggleTrash={() => setShowTrash(!showTrash)}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onUpdateNote={updateNote}
            onClose={handleCloseNote}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">
                Нотатку не вибрано
              </h2>
              <p className="mb-6">
                Виберіть нотатку з бічної панелі або створіть нову
              </p>
              <Button onClick={createNewNote}>
                <Plus className="h-4 w-4 mr-2" />
                Створити нову нотатку
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
