import express, { Request, Response } from "express";
import crypto from "crypto";
import { env } from "./config/env";
import { githubService } from "./services/githubService";

function verifySignature(payloadBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;

  const expectedSignature =
    "sha256=" + crypto.createHmac("sha256", env.githubWebhookSecret).update(payloadBody).digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signatureHeader);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

export function createWebhookServer() {
  const app = express();

  app.post(
    "/webhooks/github",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const signature = req.header("X-Hub-Signature-256");
      const rawBody = req.body as Buffer;

      if (!verifySignature(rawBody, signature)) {
        console.warn("[webhook] Signature tidak valid, request ditolak.");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(rawBody.toString("utf-8"));
      } catch {
        res.status(400).json({ error: "Invalid JSON" });
        return;
      }

      const eventType = req.header("X-GitHub-Event");

      try {
        if (eventType === "push") {
          const count = await githubService.handlePushEvent(payload);
          console.log(`[webhook] Push event diproses: ${count} commit disimpan.`);
        } else if (eventType === "pull_request") {
          await githubService.handlePullRequestEvent(payload);
          console.log(`[webhook] Pull request event diproses: #${payload.pull_request?.number} (${payload.action})`);
        } else if (eventType === "ping") {
          console.log("[webhook] Ping diterima -- webhook berhasil terpasang di GitHub.");
        } else {
          console.log(`[webhook] Event "${eventType}" diterima tapi belum di-handle, diabaikan.`);
        }
        res.status(200).json({ ok: true });
      } catch (error) {
        console.error("[webhook] Error saat memproses event:", error);
        res.status(500).json({ error: "Internal error" });
      }
    }
  );

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  return app;
}