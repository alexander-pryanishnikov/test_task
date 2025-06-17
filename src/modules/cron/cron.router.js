import express from "express";
import { cronController } from "./cron.controller.js";

const router = express.Router();

router.get("/", cronController.getCronJobs);

export default router;
