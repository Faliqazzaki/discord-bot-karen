import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`[env] Environment variable "${name}" wajib diisi. Cek file .env kamu.`);
  }
  return value;
}

export const env = {
  discordToken: requireEnv("DISCORD_TOKEN"),
  discordClientId: requireEnv("DISCORD_CLIENT_ID"),
  discordGuildId: requireEnv("DISCORD_GUILD_ID"),
  focusRoomRoleId: requireEnv("FOCUS_ROOM_ROLE_ID"),
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceKey: requireEnv("SUPABASE_SERVICE_KEY"),
};