import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`[env] Environment variable "${name}" wajib diisi. Cek file .env kamu.`);
  }
  return value;
}

function optionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : defaultValue;
}

function optionalPositiveNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value || value.trim() === "") return defaultValue;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`[env] Environment variable "${name}" harus berupa angka > 0. Cek file .env kamu.`);
  }
  return parsed;
}

export const env = {
  discordToken: requireEnv("DISCORD_TOKEN"),
  discordClientId: requireEnv("DISCORD_CLIENT_ID"),
  discordGuildId: requireEnv("DISCORD_GUILD_ID"),
  focusRoomRoleId: requireEnv("FOCUS_ROOM_ROLE_ID"),
  
  // SUPABASE CONFIGURATION
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceKey: requireEnv("SUPABASE_SERVICE_KEY"),

  // GITHUB CONFIGURATION
  githubWebhookSecret: requireEnv("GITHUB_WEBHOOK_SECRET"),
  githubToken: process.env.GITHUB_TOKEN?.trim() || undefined,
  webhookServerPort: optionalEnv("WEBHOOK_SERVER_PORT", "3000"),

  // AI INTEGRATION
  aiProvider: optionalEnv("AI_PROVIDER", "gemini"),
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
  geminiModel: optionalEnv("GEMINI_MODEL", "gemini-3.5-flash-lite"),

  // AUTO ENDWORK
  // Session yang aktif lebih lama dari batas ini akan ditutup otomatis
  // supaya data tidak membengkak saat user lupa /endwork.
  autoEndworkMaxHours: optionalPositiveNumber("AUTO_ENDWORK_MAX_HOURS", 8),
  autoEndworkCheckIntervalMinutes: optionalPositiveNumber("AUTO_ENDWORK_CHECK_INTERVAL_MINUTES", 10),
};