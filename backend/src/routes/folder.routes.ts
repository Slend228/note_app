import express from "express";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../controllers/folder.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(authMiddleware as express.RequestHandler);

router.get("/", getFolders as express.RequestHandler);
router.post("/", createFolder as express.RequestHandler);
router.put("/:id", updateFolder as express.RequestHandler);
router.delete("/:id", deleteFolder as express.RequestHandler);

export default router;
