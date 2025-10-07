import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  audioUrl: z.string().optional(),
  hasAudio: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  isFavorite: z.boolean().default(false),
  folderId: z.string().nullable().optional(),
});

const updateNoteSchema = createNoteSchema.partial();

// Get all notes for the current user
export const getNotes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const includeDeleted = req.query.includeDeleted === "true";

    const notes = await prisma.note.findMany({
      where: {
        userId: req.user.id,
        isDeleted: includeDeleted ? undefined : false,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.status(200).json({
      notes: notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        audioUrl: note.audioUrl,
        hasAudio: note.hasAudio,
        tags: note.tags,
        updatedAt: note.updatedAt,
        isFavorite: note.isFavorite,
        folderId: note.folderId,
        isDeleted: note.isDeleted,
      })),
    });
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get a single note by ID
export const getNoteById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    const note = await prisma.note.findUnique({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        audioUrl: note.audioUrl,
        hasAudio: note.hasAudio,
        tags: note.tags,
        updatedAt: note.updatedAt,
        isFavorite: note.isFavorite,
        folderId: note.folderId,
        isDeleted: note.isDeleted,
      },
    });
  } catch (error) {
    console.error("Get note by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new note
export const createNote = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Validate request body
    const validatedData = createNoteSchema.parse(req.body);

    const note = await prisma.note.create({
      data: {
        ...validatedData,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      message: "Note created successfully",
      note: {
        id: note.id,
        title: note.title,
        content: note.content,
        audioUrl: note.audioUrl,
        hasAudio: note.hasAudio,
        tags: note.tags,
        updatedAt: note.updatedAt,
        isFavorite: note.isFavorite,
        folderId: note.folderId,
        isDeleted: note.isDeleted,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    console.error("Create note error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a note
export const updateNote = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Validate request body
    const validatedData = updateNoteSchema.parse(req.body);

    const updatedNote = await prisma.note.update({
      where: { id },
      data: validatedData,
    });

    res.status(200).json({
      message: "Note updated successfully",
      note: {
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
        audioUrl: updatedNote.audioUrl,
        hasAudio: updatedNote.hasAudio,
        tags: updatedNote.tags,
        updatedAt: updatedNote.updatedAt,
        isFavorite: updatedNote.isFavorite,
        folderId: updatedNote.folderId,
        isDeleted: updatedNote.isDeleted,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    console.error("Update note error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Move note to trash (soft delete)
export const moveNoteToTrash = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    await prisma.note.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.status(200).json({ message: "Note moved to trash" });
  } catch (error) {
    console.error("Move note to trash error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Restore note from trash
export const restoreNoteFromTrash = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    await prisma.note.update({
      where: { id },
      data: { isDeleted: false },
    });

    res.status(200).json({ message: "Note restored from trash" });
  } catch (error) {
    console.error("Restore note from trash error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete note permanently
export const deleteNotePermanently = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    await prisma.note.delete({
      where: { id },
    });

    res.status(200).json({ message: "Note deleted permanently" });
  } catch (error) {
    console.error("Delete note permanently error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Move note to folder
export const moveNoteToFolder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;
    const { folderId } = req.body;

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    // If folderId is provided, check if folder exists and belongs to user
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: req.user.id,
        },
      });

      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }
    }

    await prisma.note.update({
      where: { id },
      data: { folderId },
    });

    res.status(200).json({ message: "Note moved to folder" });
  } catch (error) {
    console.error("Move note to folder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
