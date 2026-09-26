import { supabase } from "../config/supabaseClient";

export interface ServerRecord {
  id: string;
  discordGuildId: string;
  name: string | null;
}

class ServerRepository {
  async upsert(discordGuildId: string, name?: string): Promise<ServerRecord> {
    const { data, error } = await supabase
      .from("servers")
      .upsert(
        { discord_guild_id: discordGuildId, name: name ?? null },
        { onConflict: "discord_guild_id" }
      )
      .select("id, discord_guild_id, name")
      .single();

    if (error || !data) {
      throw new Error(`Gagal upsert server (discord_guild_id=${discordGuildId}): ${error?.message}`);
    }

    return { id: data.id, discordGuildId: data.discord_guild_id, name: data.name };
  }
}

export const serverRepository = new ServerRepository();