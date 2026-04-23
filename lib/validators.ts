import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).default("#00e5ff")
});

export const wordSchema = z.object({
  term: z.string().trim().min(1).max(120),
  meaning: z.string().trim().min(1).max(500),
  example: z.string().trim().max(500).default(""),
  categoryId: z.string().uuid().nullable().optional(),
  authorName: z.string().trim().min(1).max(80).default("Anonymous")
});

export const masterySchema = z.object({
  mastery: z.number().int().min(0).max(5)
});

export const challengeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  categoryId: z.string().uuid().nullable().optional(),
  hostName: z.string().trim().min(1).max(80),
  remindMessage: z.string().trim().min(1).max(180).default("Ugee tseejleerei!")
});

export const joinChallengeSchema = z.object({
  displayName: z.string().trim().min(1).max(80)
});

export const subscribeSchema = z.object({
  memberName: z.string().trim().min(1).max(80),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1)
    })
  })
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  dailyGoal: z.number().int().min(1).max(200).default(10),
  favoriteCategoryId: z.string().uuid().nullable().optional(),
  notificationsEnabled: z.boolean().default(false)
});
