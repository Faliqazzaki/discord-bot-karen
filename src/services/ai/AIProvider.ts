/**
 * Kontrak yang harus dipenuhi semua AI provider (Gemini, OpenAI, dst).
 * Ini kunci dari requirement "AI provider harus modular" di spec Phase 5 --
 * selama provider baru implement interface ini, aiService.ts dan seluruh
 * command TIDAK PERNAH perlu diubah untuk ganti provider.
 */
export interface AIProvider {
  readonly name: string;
  generateText(prompt: string): Promise<string>;
}