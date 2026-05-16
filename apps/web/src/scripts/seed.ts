/**
 * Database seed script for Metl-VibeCoder
 *
 * Usage:
 *   cd apps/web && npx prisma db seed (once seeds configured in schema)
 *   OR: npx tsx src/scripts/seed.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("[SEED] Seeding database...\n");

  // 1. Create guest user
  const guest = await prisma.user.upsert({
    where: { id: "guest" },
    create: { id: "guest", email: "guest@metl.dev", name: "Guest User" },
    update: {},
  });
  console.log(`  User: ${guest.id} (${guest.email})`);

  // 2. Create a sample project
  const project = await prisma.project.create({
    data: {
      name: "Demo Playground",
      description: "A demo project to showcase VibeCoder",
      language: "typescript",
      userId: guest.id,
    },
  });
  console.log(`  Project: ${project.name}`);

  // 3. Create sample sessions
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        projectId: project.id,
        mode: "ASK",
        status: "completed",
        userPrompt: "Explain the current tech stack",
        modelUsed: "gemini-3.1-pro-preview-customtools",
        promptVersion: "0.1.0",
      },
    }),
    prisma.session.create({
      data: {
        projectId: project.id,
        mode: "AGENT",
        status: "failed",
        userPrompt: "Build a todo app with authentication",
        modelUsed: "gemini-3.1-pro-preview-customtools",
        promptVersion: "0.1.0",
      },
    }),
    prisma.session.create({
      data: {
        projectId: project.id,
        mode: "PLAN",
        status: "awaiting_plan_approval",
        userPrompt: "Redesign the navbar component",
        modelUsed: "gemini-3.1-pro-preview-customtools",
        promptVersion: "0.1.0",
      },
    }),
  ]);

  for (const s of sessions) {
    console.log(`  Session: ${s.id} (${s.mode} / ${s.status})`);

    await prisma.chatMessage.create({
      data: {
        sessionId: s.id,
        role: "system",
        content: `Session started in ${s.mode} mode.`,
        mode: s.mode,
      },
    });
    await prisma.chatMessage.create({
      data: {
        sessionId: s.id,
        role: "user",
        content: s.userPrompt,
        mode: s.mode,
      },
    });
  }

  // 4. Create check runs for the completed session
  await prisma.checkRun.create({
    data: {
      sessionId: sessions[0].id,
      type: "typecheck",
      status: "passed",
      command: "tsc --noEmit",
    },
  });
  await prisma.checkRun.create({
    data: {
      sessionId: sessions[0].id,
      type: "lint",
      status: "passed",
      command: "eslint .",
    },
  });

  // 5. Create approval request for PLAN session
  await prisma.approvalRequest.create({
    data: {
      sessionId: sessions[2].id,
      type: "PLAN",
      title: "NavBar Redesign Plan",
      body: "## Plan\n\n1. Extract NavBar into separate component\n2. Add responsive mobile menu\n3. Update Tailwind styles\n",
    },
  });

  console.log("\n[SEED] Done.");
}

main()
  .catch((e) => {
    console.error("[SEED] Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
