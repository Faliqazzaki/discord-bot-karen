import { supabase } from "../config/supabaseClient";

export interface UserRecord {
  id: string;
  discordUserId: string;
  username: string | null;
}

class UserRepository {
  async upsert(discordUserId: string, username?: string): Promise<UserRecord> {
    const { data, error } = await supabase
      .from("users")
      .upsert(
        { discord_user_id: discordUserId, username: username ?? null },
        { onConflict: "discord_user_id" }
      )
      .select("id, discord_user_id, username")
      .single();

    if (error || !data) {
      throw new Error(`Gagal upsert user (discord_user_id=${discordUserId}): ${error?.message}`);
    }

    return { id: data.id, discordUserId: data.discord_user_id, username: data.username };
  }
}

export const userRepository = new UserRepository();