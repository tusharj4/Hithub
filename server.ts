import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;

app.use(express.json());

// ============================================================================
// API ROUTES (HIT-HUB)
// ============================================================================

// 1. Get Top Repositories Today (Sorted by Upvotes)
app.get("/api/repos", async (req, res) => {
  try {
    const repos = await prisma.repository.findMany({
      orderBy: { hithubScore: "desc" },
      include: { upvotes: true },
    });
    res.json({ data: repos });
  } catch (error) {
    console.error("Failed to fetch repos:", error);
    res.status(500).json({ error: "Failed to fetch repositories." });
  }
});

// 2. Upvote Route (Expects userId and repositoryId)
app.post("/api/upvote", async (req, res) => {
  const { userId, repositoryId } = req.body;

  if (!userId || !repositoryId) {
    return res.status(400).json({ error: "userId and repositoryId required" });
  }

  try {
    // Check if the user already upvoted
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_repositoryId: { userId, repositoryId },
      },
    });

    if (existingUpvote) {
      // Remove upvote
      await prisma.upvote.delete({
        where: { id: existingUpvote.id },
      });
      const repo = await prisma.repository.update({
        where: { id: repositoryId },
        data: { hithubScore: { decrement: 1 } },
      });
      return res.json({ success: true, action: "removed", score: repo.hithubScore });
    }

    // Add upvote
    await prisma.upvote.create({
      data: { userId, repositoryId },
    });
    const repo = await prisma.repository.update({
      where: { id: repositoryId },
      data: { hithubScore: { increment: 1 } },
    });

    res.json({ success: true, action: "added", score: repo.hithubScore });
  } catch (error) {
    console.error("Upvote failed:", error);
    res.status(500).json({ error: "Failed to toggle upvote." });
  }
});

// Dev route for preview: Mock Login
app.post("/api/mock-login", async (req, res) => {
  const { handle } = req.body;
  if (!handle) return res.status(400).json({ error: "GitHub handle required" });

  try {
    let user = await prisma.user.findFirst({ where: { githubHandle: handle } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: handle,
          githubHandle: handle,
          image: `https://avatars.githubusercontent.com/${handle}`
        }
      });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Dev route for preview: Seed Database Manually (Calling our local Python-like logic)
import { GoogleGenAI, Type } from "@google/genai";

app.post("/api/seed", async (req, res) => {
  try {
    const repos = [
      { id: 101, full_name: "facebook/react", html_url: "https://github.com/facebook/react", description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.", language: "JavaScript", stargazers_count: 210000 },
      { id: 102, full_name: "nextauthjs/next-auth", html_url: "https://github.com/nextauthjs/next-auth", description: "Authentication for Next.js", language: "TypeScript", stargazers_count: 32000 },
      { id: 103, full_name: "google/gemini-pro", html_url: "https://github.com/google/gemini", description: "Google Gemini AI model SDK and Examples", language: "Python", stargazers_count: 5000 },
    ];

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    for (const repo of repos) {
      let insights = {
        category: "Framework",
        what_it_does: repo.description,
        under_the_hood: "Built with " + repo.language,
        how_to_use: "Read the docs!"
      };

      try {
        if (process.env.GEMINI_API_KEY) {
          const prompt = `Analyze this GitHub repository:
          Name: ${repo.full_name}
          Description: ${repo.description}
          Language: ${repo.language}
      
          Return a JSON object with:
          - category: A concise category.
          - what_it_does: 1-sentence summary.
          - under_the_hood: 1-2 sentences explaining technical architecture.
          - how_to_use: 1 practical sentence on its use case.`;
          
          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  what_it_does: { type: Type.STRING },
                  under_the_hood: { type: Type.STRING },
                  how_to_use: { type: Type.STRING }
                }
              }
            }
          });
          if (response.text) {
            insights = JSON.parse(response.text.trim());
          }
        }
      } catch (err) {
        console.warn("AI extraction failed, using defaults", err);
      }

      await prisma.repository.upsert({
        where: { githubId: repo.id },
        update: { githubStars: repo.stargazers_count, snapshotDate: new Date() },
        create: {
          githubId: repo.id,
          name: repo.full_name,
          url: repo.html_url,
          description: repo.description,
          language: repo.language,
          githubStars: repo.stargazers_count,
          aiCategory: insights.category,
          aiWhatItDoes: insights.what_it_does,
          aiUnderTheHood: insights.under_the_hood,
          aiHowToUse: insights.how_to_use
        }
      });
    }

    res.json({ success: true, message: "Database seeded!" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// ============================================================================
// VITE MIDDLEWARE
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express 4
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
