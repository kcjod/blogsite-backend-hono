import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
}>();

userRouter.use("/edit", async(c, next) => {
  const header = c.req.header("Authorization") || "";
  const token = header.split(" ")[1];

  const user = (await verify(token, c.env.JWT_SECRET)) as { id: string };

  if (!user) {
    c.status(401);
    return c.json({
      message: "Unauthorized",
    });
  }

  c.set("userId", user.id);

  await next();
});

userRouter.use("/signout", async(c, next) => {
  const header = c.req.header("Authorization") || "";
  const token = header.split(" ")[1];

  const user = (await verify(token, c.env.JWT_SECRET)) as { id: string };

  if (!user) {
    c.status(401);
    return c.json({
      message: "Unauthorized",
    });
  }

  c.set("userId", user.id);

  await next();
});

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const hashedPassword = await sign(body.password, c.env.JWT_SECRET);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      password: hashedPassword,
    },
  });

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);

  return c.json({
    token,
  });
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const hashedPassword = await sign(body.password, c.env.JWT_SECRET);

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
      password: hashedPassword,
    },
  });

  if (!user) {
    c.status(401);
    return c.json({
      message: "Invalid credentials",
    });
  }

  const token = await sign({ id: user.id }, c.env.JWT_SECRET);

  return c.json({
    token,
  });
});

userRouter.put("/edit", async(c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  const userId = c.get("userId");

  if(body.password){
    const hashedPassword = await sign(body.password, c.env.JWT_SECRET);

    await prisma.user.update({
      where: {
        id: userId
      },
      data: {
        email: body?.email,
        password: hashedPassword
      }
    })
  }
  

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      email: body.email,
    }
  })

  return c.json({
    message: "User updated"
  })

});