import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
});

const updateFolderSchema = createFolderSchema.partial();

// Get all folders for the current user
export const getFolders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const folders = await prisma.folder.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.status(200).json({
      folders: folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: folder.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get folders error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new folder
export const createFolder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Validate request body
    const validatedData = createFolderSchema.parse(req.body);

    const folder = await prisma.folder.create({
      data: {
        ...validatedData,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      message: "Folder created successfully",
      folder: {
        id: folder.id,
        name: folder.name,
        color: folder.color,
        createdAt: folder.createdAt,
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
    console.error("Create folder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a folder
export const updateFolder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingFolder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Validate request body
    const validatedData = updateFolderSchema.parse(req.body);

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: validatedData,
    });

    res.status(200).json({
      message: "Folder updated successfully",
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
        color: updatedFolder.color,
        createdAt: updatedFolder.createdAt,
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
    console.error("Update folder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a folder
export const deleteFolder = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { id } = req.params;

    // Check if folder exists and belongs to user
    const existingFolder = await prisma.folder.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!existingFolder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Update notes in this folder to have no folder
    await prisma.note.updateMany({
      where: {
        folderId: id,
        userId: req.user.id,
      },
      data: {
        folderId: null,
      },
    });

    // Delete the folder
    await prisma.folder.delete({
      where: { id },
    });

    res.status(200).json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Delete folder error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
