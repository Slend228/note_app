import React, { useState, useRef } from "react";
import {
  Search,
  Plus,
  Tag,
  Mic,
  Clock,
  Star,
  Folder,
  FolderPlus,
  Trash2,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Calendar,
  Hash,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface Note {
  id: string;
  title: string;
  preview: string;
  hasAudio: boolean;
  tags: string[];
  date: string;
  isFavorite: boolean;
  folderId?: string;
  isDeleted?: boolean;
}

interface Folder {
  id: string;
  name: string;
  color?: string;
  notesCount?: number;
}

interface NotesListProps {
  notes?: Note[];
  folders?: Folder[];
  onNoteSelect?: (noteId: string) => void;
  onCreateNote?: () => void;
  onCreateFolder?: (name: string, color?: string) => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => void;
  onDeleteNote?: (noteId: string) => void;
  onRestoreNote?: (noteId: string) => void;
  onDeleteNotePermanently?: (noteId: string) => void;
  selectedNoteId?: string;
  selectedFolderId?: string | null;
  onSelectFolder?: (folderId: string | null) => void;
  showTrash?: boolean;
  onToggleTrash?: () => void;
}

const NotesList = ({
  notes = defaultNotes,
  folders = [],
  onNoteSelect = () => {},
  onCreateNote = () => {},
  onCreateFolder = () => {},
  onMoveNoteToFolder = () => {},
  onDeleteNote = () => {},
  onRestoreNote = () => {},
  onDeleteNotePermanently = () => {},
  selectedNoteId = "",
  selectedFolderId = null,
  onSelectFolder = () => {},
  showTrash = false,
  onToggleTrash = () => {},
}: NotesListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "favorites" | "audio" | "tags" | "date"
  >("all");
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({});
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#4f46e5");
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] =
    useState(false);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(
    null,
  );
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(
    null,
  );
  const folderRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Get all unique tags from notes
  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags)),
  ).sort();

  // Get all unique dates from notes
  const allDates = Array.from(
    new Set(
      notes
        .map((note) => note.date.split(" ")[0]) // Extract just the date part
        .filter((date) => date !== "Today" && date !== "Yesterday"),
    ),
  ).sort();

  // Toggle folder expansion
  const toggleFolderExpansion = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Handle creating a new folder
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName("");
      setIsCreateFolderDialogOpen(false);
    }
  };

  // Handle drag start for a note
  const handleDragStart = (noteId: string) => {
    setDraggedNoteId(noteId);
  };

  // Handle drag over for a folder
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle drop on a folder
  const handleDrop = (folderId: string | null) => {
    if (draggedNoteId) {
      onMoveNoteToFolder(draggedNoteId, folderId);
      setDraggedNoteId(null);
    }
  };

  const filteredNotes = notes.filter((note) => {
    // Skip deleted notes unless we're in trash view
    if (note.isDeleted && !showTrash) return false;
    if (!note.isDeleted && showTrash) return false;

    // Apply search filter
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    // Apply folder filter
    if (
      selectedFolderId !== null &&
      !showTrash &&
      note.folderId !== selectedFolderId
    )
      return false;

    // Apply tag filter
    if (
      activeFilter === "tags" &&
      selectedTagFilter &&
      !note.tags.includes(selectedTagFilter)
    )
      return false;

    // Apply date filter
    if (
      activeFilter === "date" &&
      selectedDateFilter &&
      !note.date.includes(selectedDateFilter)
    )
      return false;

    // Apply category filter
    if (activeFilter === "favorites" && !note.isFavorite) return false;
    if (activeFilter === "audio" && !note.hasAudio) return false;

    return matchesSearch;
  });

  return (
    <div className="h-full flex flex-col border-r bg-background">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Нотатки</h2>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCreateFolderDialogOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onCreateNote}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук нотаток..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveFilter("all");
              setSelectedTagFilter(null);
              setSelectedDateFilter(null);
            }}
            className="text-xs"
          >
            Всі
          </Button>
          <Button
            variant={activeFilter === "favorites" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveFilter("favorites");
              setSelectedTagFilter(null);
              setSelectedDateFilter(null);
            }}
            className="text-xs"
          >
            <Star className="h-3 w-3 mr-1" />
            Улюблені
          </Button>
          <Button
            variant={activeFilter === "audio" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setActiveFilter("audio");
              setSelectedTagFilter(null);
              setSelectedDateFilter(null);
            }}
            className="text-xs"
          >
            <Mic className="h-3 w-3 mr-1" />
            Аудіо
          </Button>
          <Button
            variant={activeFilter === "tags" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("tags")}
            className="text-xs"
          >
            <Hash className="h-3 w-3 mr-1" />
            Теги
          </Button>
          <Button
            variant={activeFilter === "date" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter("date")}
            className="text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Дата
          </Button>
          <Button
            variant={showTrash ? "default" : "outline"}
            size="sm"
            onClick={onToggleTrash}
            className="text-xs ml-auto"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Кошик
          </Button>
        </div>

        {activeFilter === "tags" && (
          <div className="flex flex-wrap gap-1 mt-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTagFilter === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedTagFilter(tag === selectedTagFilter ? null : tag)
                }
              >
                {tag}
              </Badge>
            ))}
            {allTags.length === 0 && (
              <div className="text-xs text-muted-foreground">
                Теги не знайдено
              </div>
            )}
          </div>
        )}

        {activeFilter === "date" && (
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge
              variant={selectedDateFilter === "Today" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() =>
                setSelectedDateFilter(
                  selectedDateFilter === "Today" ? null : "Today",
                )
              }
            >
              Сьогодні
            </Badge>
            <Badge
              variant={
                selectedDateFilter === "Yesterday" ? "default" : "outline"
              }
              className="cursor-pointer"
              onClick={() =>
                setSelectedDateFilter(
                  selectedDateFilter === "Yesterday" ? null : "Yesterday",
                )
              }
            >
              Вчора
            </Badge>
            {allDates.map((date) => (
              <Badge
                key={date}
                variant={selectedDateFilter === date ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  setSelectedDateFilter(
                    date === selectedDateFilter ? null : date,
                  )
                }
              >
                {date}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {!showTrash && (
        <div className="px-2 py-2">
          <div
            className={`flex items-center p-2 rounded-md cursor-pointer ${selectedFolderId === null ? "bg-accent" : "hover:bg-accent/50"}`}
            onClick={() => onSelectFolder(null)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(null)}
          >
            <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">Всі нотатки</span>
          </div>

          {folders.map((folder) => (
            <div
              key={folder.id}
              ref={(el) => (folderRefs.current[folder.id] = el)}
            >
              <div
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedFolderId === folder.id ? "bg-accent" : "hover:bg-accent/50"}`}
                onClick={() => onSelectFolder(folder.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(folder.id)}
              >
                <div className="flex items-center">
                  <div
                    className="h-3 w-3 rounded-full mr-2"
                    style={{ backgroundColor: folder.color || "#4f46e5" }}
                  />
                  <span className="text-sm font-medium">{folder.name}</span>
                  {folder.notesCount !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {folder.notesCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolderExpansion(folder.id);
                    }}
                  >
                    {expandedFolders[folder.id] ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedNoteId === note.id ? "bg-accent" : "hover:bg-accent/50"}`}
                onClick={() => onNoteSelect(note.id)}
                draggable={!showTrash}
                onDragStart={() => handleDragStart(note.id)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{note.title}</h3>
                  <div className="flex items-center space-x-1">
                    {note.isFavorite && (
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    )}
                    {note.hasAudio && <Mic className="h-3 w-3 text-blue-500" />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!showTrash ? (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.id);
                              }}
                            >
                              Перемістити в кошик
                            </DropdownMenuItem>
                            {folders.length > 0 && (
                              <>
                                <DropdownMenuItem
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-medium"
                                >
                                  Перемістити в папку
                                </DropdownMenuItem>
                                {folders.map((folder) => (
                                  <DropdownMenuItem
                                    key={folder.id}
                                    className="pl-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMoveNoteToFolder(note.id, folder.id);
                                    }}
                                  >
                                    {folder.name}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                  className="pl-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveNoteToFolder(note.id, null);
                                  }}
                                >
                                  Без папки
                                </DropdownMenuItem>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestoreNote(note.id);
                              }}
                            >
                              Відновити
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Видалити назавжди
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Ви абсолютно впевнені?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Цю дію неможливо скасувати. Це назавжди
                                    видалить нотатку та видалить її з наших
                                    серверів.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Скасувати
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteNotePermanently(note.id);
                                    }}
                                  >
                                    Видалити
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {note.preview.replace(/<[^>]*>/g, "")}
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs py-0 px-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {note.date}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {showTrash ? (
                <p>Кошик порожній</p>
              ) : (
                <>
                  <p>Нотатки не знайдено</p>
                  <Button
                    variant="link"
                    onClick={onCreateNote}
                    className="mt-2"
                  >
                    Створити нову нотатку
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Folder Dialog */}
      <Dialog
        open={isCreateFolderDialogOpen}
        onOpenChange={setIsCreateFolderDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Створити нову папку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="folderName" className="text-sm font-medium">
                Назва папки
              </label>
              <Input
                id="folderName"
                placeholder="Введіть назву папки"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="folderColor" className="text-sm font-medium">
                Колір папки
              </label>
              <div className="flex gap-2">
                {[
                  "#4f46e5",
                  "#ef4444",
                  "#10b981",
                  "#f59e0b",
                  "#8b5cf6",
                  "#ec4899",
                ].map((color) => (
                  <div
                    key={color}
                    className={`w-6 h-6 rounded-full cursor-pointer ${newFolderColor === color ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFolderColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateFolderDialogOpen(false)}
            >
              Скасувати
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Створити
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Default notes for demonstration
const defaultNotes: Note[] = [
  {
    id: "1",
    title: "Meeting Notes",
    preview:
      "Discussed project timeline and deliverables with the team. Next steps include...",
    hasAudio: true,
    tags: ["work", "project"],
    date: "Today",
    isFavorite: true,
  },
  {
    id: "2",
    title: "Shopping List",
    preview: "Milk, eggs, bread, vegetables, fruits, chicken...",
    hasAudio: false,
    tags: ["personal"],
    date: "Yesterday",
    isFavorite: false,
  },
  {
    id: "3",
    title: "Book Recommendations",
    preview: "Atomic Habits by James Clear, Deep Work by Cal Newport...",
    hasAudio: false,
    tags: ["reading", "personal"],
    date: "Last week",
    isFavorite: true,
  },
  {
    id: "4",
    title: "Interview Questions",
    preview:
      "Prepare answers for common interview questions. Research company background...",
    hasAudio: true,
    tags: ["career", "preparation"],
    date: "2 days ago",
    isFavorite: false,
  },
  {
    id: "5",
    title: "Project Ideas",
    preview: "App for tracking habits, website for book recommendations...",
    hasAudio: false,
    tags: ["ideas", "projects"],
    date: "Last month",
    isFavorite: false,
  },
];

export default NotesList;
