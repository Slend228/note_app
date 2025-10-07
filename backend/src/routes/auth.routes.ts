import express from "express";
import {
  register,
  login,
  getCurrentUser,
  requestPasswordReset,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/register", register as express.RequestHandler);
router.post("/login", login as express.RequestHandler);
router.post(
  "/request-password-reset",
  requestPasswordReset as express.RequestHandler,
);

router.get(
  "/me",
  authMiddleware as express.RequestHandler,
  getCurrentUser as express.RequestHandler,
);

export default router;
