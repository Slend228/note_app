import express from "express";
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  moveNoteToTrash,
  restoreNoteFromTrash,
  deleteNotePermanently,
  moveNoteToFolder,
} from "../controllers/note.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(authMiddleware as express.RequestHandler);

router.get("/", getNotes as express.RequestHandler);
router.get("/:id", getNoteById as express.RequestHandler);
router.post("/", createNote as express.RequestHandler);
router.put("/:id", updateNote as express.RequestHandler);
router.put("/:id/trash", moveNoteToTrash as express.RequestHandler);
router.put("/:id/restore", restoreNoteFromTrash as express.RequestHandler);
router.delete("/:id", deleteNotePermanently as express.RequestHandler);
router.put("/:id/move", moveNoteToFolder as express.RequestHandler);

export default router;
