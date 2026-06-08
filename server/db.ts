import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, promptHistory, savedPrompts, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Prompt History Queries
 */
export async function savePromptHistory(
  userId: number,
  type: "generation" | "improvement",
  inputText: string,
  outputPrompt: string,
  framework: string,
  improvementBreakdown?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(promptHistory).values({
    userId,
    type,
    inputText,
    outputPrompt,
    framework,
    improvementBreakdown,
  });

  return result;
}

export async function getPromptHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select()
    .from(promptHistory)
    .where(eq(promptHistory.userId, userId))
    .orderBy(desc(promptHistory.createdAt))
    .limit(limit);

  return results;
}

export async function deletePromptHistory(historyId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(promptHistory)
    .where(and(eq(promptHistory.id, historyId), eq(promptHistory.userId, userId)));

  return result;
}

/**
 * Saved Prompts Library Queries
 */
export async function savePromptToLibrary(
  userId: number,
  title: string,
  prompt: string,
  framework?: string,
  tags?: string,
  notes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(savedPrompts).values({
    userId,
    title,
    prompt,
    framework,
    tags,
    notes,
  });

  return result;
}

export async function getSavedPrompts(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select()
    .from(savedPrompts)
    .where(eq(savedPrompts.userId, userId))
    .orderBy(desc(savedPrompts.createdAt));

  return results;
}

export async function searchSavedPrompts(userId: number, searchQuery: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select()
    .from(savedPrompts)
    .where(
      and(
        eq(savedPrompts.userId, userId),
        or(
          like(savedPrompts.title, `%${searchQuery}%`),
          like(savedPrompts.prompt, `%${searchQuery}%`),
          like(savedPrompts.tags, `%${searchQuery}%`)
        )
      )
    )
    .orderBy(desc(savedPrompts.createdAt));

  return results;
}

export async function deleteSavedPrompt(promptId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .delete(savedPrompts)
    .where(and(eq(savedPrompts.id, promptId), eq(savedPrompts.userId, userId)));

  return result;
}

export async function updateSavedPrompt(
  promptId: number,
  userId: number,
  updates: { title?: string; prompt?: string; framework?: string; tags?: string; notes?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(savedPrompts)
    .set(updates)
    .where(and(eq(savedPrompts.id, promptId), eq(savedPrompts.userId, userId)));

  return result;
}
