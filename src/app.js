import express from "express";
import { userRouter } from "./modules/user/user.router.js";
import cronRouter from "./modules/cron/cron.router.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRouter);
app.use("/api/cron", cronRouter);

export default app;
