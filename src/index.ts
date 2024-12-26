import { Hono } from "hono";
import { userRouter } from "./routes/user";
import { verify } from "hono/jwt";
import { blogRouter } from "./routes/blog";

const app = new Hono<{
  Bindings: {
    JWT_SECRET: string;
  }
}>();

app.route("/api/v1/user", userRouter)
app.route("/api/v1/blog", blogRouter)


export default app;
