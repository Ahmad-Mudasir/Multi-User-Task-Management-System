import mongoose from "mongoose";

import { env } from "@/env";

type GlobalMongoose = typeof globalThis & {
  mongooseConn?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const g = globalThis as GlobalMongoose;

if (!g.mongooseConn) {
  g.mongooseConn = { conn: null, promise: null };
}

export async function dbConnect() {
  if (g.mongooseConn.conn) return g.mongooseConn.conn;

  if (!g.mongooseConn.promise) {
    g.mongooseConn.promise = mongoose
      .connect(env.MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  g.mongooseConn.conn = await g.mongooseConn.promise;
  return g.mongooseConn.conn;
}

