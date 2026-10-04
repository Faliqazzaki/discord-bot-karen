import { AIProvider } from "./ai/AIProvider";
import { GeminiProvider } from "./ai/GeminiProvider";
import { ReportSummary } from "../types/report";
import { formatDuration } from "../utils/duration";
import { env } from "../config/env";

export class AIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIServiceError";
  }
}

const GUARDRAIL_INSTRUCTION = `
ATURAN PENTING yang harus kamu ikuti:
- Kamu HANYA boleh meringkas/menginterpretasi data yang diberikan, bukan membuat kesimpulan baru di luar data.
- JANGAN membuat ranking, peringkat, atau penilaian siapa "paling rajin", "paling produktif", atau pernyataan sejenis yang menilai kinerja seseorang.
- Jangan bandingkan satu orang dengan orang lain secara menghakimi. Kamu boleh menyebutkan angka objektif (durasi, jumlah commit, dst) secara netral.
- Gunakan Bahasa Indonesia yang santai tapi profesional, seperti laporan tim ke manusia lain.
- Jangan mengarang data yang tidak ada di input.
`.trim();

class AIService {
  private provider: AIProvider | null = null;

  private getProvider(): AIProvider {
    if (this.provider) return this.provider;

    switch (env.aiProvider) {
      case "gemini": {
        if (!env.geminiApiKey) {
          throw new AIServiceError("AI_PROVIDER diset ke 'gemini' tapi GEMINI_API_KEY belum diisi di .env.");
        }
        this.provider = new GeminiProvider(env.geminiApiKey, env.geminiModel);
        return this.provider;
      }
      default:
        throw new AIServiceError(
          `AI_PROVIDER "${env.aiProvider}" tidak dikenal. Provider yang tersedia saat ini: gemini.`
        );
    }
  }

  private buildReportPrompt(summary: ReportSummary, kind: "harian" | "mingguan"): string {
    const workLines =
      summary.workStats
        .map((s) => `- User ${s.discordUserId}: total ${formatDuration(s.totalDurationMs)}, ${s.sessionCount} session`)
        .join("\n") || "(tidak ada data work session)";

    const githubLines =
      summary.githubStats
        .map(
          (s) =>
            `- ${s.githubUsername}: ${s.commitCount} commit, ${s.pullRequestCount} PR (${s.mergedPullRequestCount} merged)`
        )
        .join("\n") || "(tidak ada data GitHub)";

    return `
${GUARDRAIL_INSTRUCTION}

Tolong buatkan ringkasan ${kind} aktivitas tim development berikut, dalam 3-5 kalimat.
Fokus ke: apa yang terjadi secara umum, pola yang terlihat (misal banyak commit tapi sedikit PR, atau sebaliknya), dan hal yang mungkin perlu diperhatikan tim (misal: tidak ada aktivitas sama sekali).

Data work session (per user, by Discord ID):
${workLines}

Data GitHub activity (per username GitHub, belum tentu terhubung ke user Discord di atas):
${githubLines}

Total commit: ${summary.totalCommits}
Total pull request: ${summary.totalPullRequests}
`.trim();
  }

  async summarizeReport(summary: ReportSummary, kind: "harian" | "mingguan"): Promise<string> {
    const provider = this.getProvider();
    const prompt = this.buildReportPrompt(summary, kind);

    try {
      return await provider.generateText(prompt);
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError(`Gagal membuat ringkasan AI (provider: ${provider.name}): ${(error as Error).message}`);
    }
  }
}

export const aiService = new AIService();