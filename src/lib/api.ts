// Import pool only in server environment
let pool;

// For client-side mock implementation
const mockNotes = [];
const mockFolders = [];

// In a real app, this would be server-side code
if (typeof window === "undefined") {
  import("./db").then((module) => {
    pool = module.default;
  });
}

export interface Note {
  id: string;
  title: string;
  content: string;
  audio_url?: string;
  has_audio: boolean;
  tags: string[];
  updated_at: Date;
  is_favorite: boolean;
  folder_id?: string;
  is_deleted?: boolean;
}

// Create the notes and folders tables if they don't exist
export const initializeDatabase = async () => {
  try {
    if (typeof window !== "undefined") {
      console.log("Client-side: Using mock database");
      return true; // Mock success for client-side
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        audio_url TEXT,
        has_audio BOOLEAN DEFAULT FALSE,
        tags TEXT[] DEFAULT '{}',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_favorite BOOLEAN DEFAULT FALSE,
        folder_id TEXT,
        is_deleted BOOLEAN DEFAULT FALSE
      );
    `);
    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
};

// Get all notes (excluding deleted ones unless specified)
export const getNotes = async (includeDeleted = false): Promise<Note[]> => {
  try {
    if (typeof window !== "undefined") {
      // Try to use the API client first
      try {
        const { notesAPI } = await import("./api-client");
        const response = await notesAPI.getNotes(includeDeleted);
        return response.notes;
      } catch (apiError) {
        console.warn("API call failed, using mock data:", apiError);
        // Fallback to mock implementation
        return mockNotes.filter((note) => includeDeleted || !note.is_deleted);
      }
    }

    const query = includeDeleted
      ? "SELECT * FROM notes ORDER BY updated_at DESC"
      : "SELECT * FROM notes WHERE is_deleted = FALSE ORDER BY updated_at DESC";
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
};

export interface Folder {
  id: string;
  name: string;
  color?: string;
  created_at: Date;
}

// Get all folders
export const getFolders = async (): Promise<Folder[]> => {
  try {
    if (typeof window !== "undefined") {
      // Try to use the API client first
      try {
        const { foldersAPI } = await import("./api-client");
        const response = await foldersAPI.getFolders();
        return response.folders;
      } catch (apiError) {
        console.warn("API call failed, using mock data:", apiError);
        // Fallback to mock implementation
        return mockFolders;
      }
    }

    const result = await pool.query(
      "SELECT * FROM folders ORDER BY created_at ASC",
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching folders:", error);
    return [];
  }
};

// Create a new folder
export const createFolder = async (
  name: string,
  color?: string,
): Promise<Folder | null> => {
  const id = Date.now().toString();
  try {
    if (typeof window !== "undefined") {
      // Try to use the API client first
      try {
        const { foldersAPI } = await import("./api-client");
        const response = await foldersAPI.createFolder({ name, color });
        return response.folder;
      } catch (apiError) {
        console.warn("API call failed, using mock implementation:", apiError);
        // Fallback to mock implementation
        const newFolder = {
          id,
          name,
          color,
          created_at: new Date(),
        };
        mockFolders.push(newFolder);
        return newFolder;
      }
    }

    const result = await pool.query(
      `INSERT INTO folders (id, name, color) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [id, name, color],
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating folder:", error);
    return null;
  }
};

// Update a folder
export const updateFolder = async (folder: Folder): Promise<Folder | null> => {
  try {
    const result = await pool.query(
      `UPDATE folders 
       SET name = $1, color = $2
       WHERE id = $3 
       RETURNING *`,
      [folder.name, folder.color, folder.id],
    );
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating folder ${folder.id}:`, error);
    return null;
  }
};

// Delete a folder
export const deleteFolder = async (id: string): Promise<boolean> => {
  try {
    await pool.query("DELETE FROM folders WHERE id = $1", [id]);
    // Move notes from this folder to no folder
    await pool.query("UPDATE notes SET folder_id = NULL WHERE folder_id = $1", [
      id,
    ]);
    return true;
  } catch (error) {
    console.error(`Error deleting folder ${id}:`, error);
    return false;
  }
};

// Get a single note by ID
export const getNoteById = async (id: string): Promise<Note | null> => {
  try {
    const result = await pool.query("SELECT * FROM notes WHERE id = $1", [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching note ${id}:`, error);
    return null;
  }
};

// Create a new note
export const createNote = async (
  note: Omit<Note, "id" | "updated_at">,
): Promise<Note | null> => {
  const id = Date.now().toString();
  try {
    if (typeof window !== "undefined") {
      // Try to use the API client first
      try {
        const { notesAPI } = await import("./api-client");
        const response = await notesAPI.createNote({
          title: note.title,
          content: note.content,
          audioUrl: note.audio_url,
          hasAudio: note.has_audio,
          tags: note.tags || [],
          isFavorite: note.is_favorite,
          folderId: note.folder_id || null,
        });
        return {
          id: response.note.id,
          title: response.note.title,
          content: response.note.content,
          audio_url: response.note.audioUrl,
          has_audio: response.note.hasAudio,
          tags: response.note.tags,
          updated_at: new Date(response.note.updatedAt),
          is_favorite: response.note.isFavorite,
          folder_id: response.note.folderId,
          is_deleted: response.note.isDeleted,
        };
      } catch (apiError) {
        console.warn("API call failed, using mock implementation:", apiError);
        // Fallback to mock implementation
        const newNote = {
          id,
          title: note.title,
          content: note.content,
          audio_url: note.audio_url,
          has_audio: note.has_audio,
          tags: note.tags || [],
          updated_at: new Date(),
          is_favorite: note.is_favorite,
          folder_id: note.folder_id || null,
          is_deleted: note.is_deleted || false,
        };
        mockNotes.push(newNote);
        return newNote;
      }
    }

    const result = await pool.query(
      `INSERT INTO notes (id, title, content, audio_url, has_audio, tags, is_favorite, folder_id, is_deleted) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        id,
        note.title,
        note.content,
        note.audio_url,
        note.has_audio,
        note.tags,
        note.is_favorite,
        note.folder_id || null,
        note.is_deleted || false,
      ],
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error creating note:", error);
    return null;
  }
};

// Update an existing note
export const updateNote = async (note: Note): Promise<Note | null> => {
  try {
    if (typeof window !== "undefined") {
      // Try to use the API client first
      try {
        const { notesAPI } = await import("./api-client");
        const response = await notesAPI.updateNote(note.id, {
          title: note.title,
          content: note.content,
          audioUrl: note.audio_url,
          hasAudio: note.has_audio,
          tags: note.tags,
          isFavorite: note.is_favorite,
          folderId: note.folder_id,
        });
        return {
          id: response.note.id,
          title: response.note.title,
          content: response.note.content,
          audio_url: response.note.audioUrl,
          has_audio: response.note.hasAudio,
          tags: response.note.tags,
          updated_at: new Date(response.note.updatedAt),
          is_favorite: response.note.isFavorite,
          folder_id: response.note.folderId,
          is_deleted: response.note.isDeleted,
        };
      } catch (apiError) {
        console.warn("API call failed, using mock implementation:", apiError);
        // Fallback to mock implementation
        const index = mockNotes.findIndex((n) => n.id === note.id);
        if (index !== -1) {
          mockNotes[index] = {
            ...note,
            updated_at: new Date(),
          };
          return mockNotes[index];
        }
        return null;
      }
    }

    const result = await pool.query(
      `UPDATE notes 
       SET title = $1, content = $2, audio_url = $3, has_audio = $4, 
           tags = $5, updated_at = CURRENT_TIMESTAMP, is_favorite = $6, 
           folder_id = $7, is_deleted = $8 
       WHERE id = $9 
       RETURNING *`,
      [
        note.title,
        note.content,
        note.audio_url,
        note.has_audio,
        note.tags,
        note.is_favorite,
        note.folder_id,
        note.is_deleted || false,
        note.id,
      ],
    );
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating note ${note.id}:`, error);
    return null;
  }
};

// Move a note to trash (soft delete)
export const moveNoteToTrash = async (id: string): Promise<boolean> => {
  try {
    await pool.query("UPDATE notes SET is_deleted = TRUE WHERE id = $1", [id]);
    return true;
  } catch (error) {
    console.error(`Error moving note ${id} to trash:`, error);
    return false;
  }
};

// Restore a note from trash
export const restoreNoteFromTrash = async (id: string): Promise<boolean> => {
  try {
    await pool.query("UPDATE notes SET is_deleted = FALSE WHERE id = $1", [id]);
    return true;
  } catch (error) {
    console.error(`Error restoring note ${id} from trash:`, error);
    return false;
  }
};

// Permanently delete a note
export const deleteNotePermanently = async (id: string): Promise<boolean> => {
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [id]);
    return true;
  } catch (error) {
    console.error(`Error permanently deleting note ${id}:`, error);
    return false;
  }
};

// Move a note to a folder
export const moveNoteToFolder = async (
  noteId: string,
  folderId: string | null,
): Promise<boolean> => {
  try {
    await pool.query("UPDATE notes SET folder_id = $1 WHERE id = $2", [
      folderId,
      noteId,
    ]);
    return true;
  } catch (error) {
    console.error(`Error moving note ${noteId} to folder ${folderId}:`, error);
    return false;
  }
};

// Upload audio to a storage service and return the URL
// In a real app, this would upload to S3, Firebase Storage, etc.
export const uploadAudio = async (audioBlob: Blob): Promise<string> => {
  // For now, we'll use a mock URL since we can't actually upload to cloud storage in this demo
  // In a real app, you would upload to a storage service and return the URL
  const mockUrl = `https://storage.example.com/audio/${Date.now()}.wav`;
  console.log("Mock audio upload:", mockUrl);
  return mockUrl;
};
