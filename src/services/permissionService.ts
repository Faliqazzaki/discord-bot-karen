import { GuildMember } from "discord.js";
import { env } from "../config/env";

/**
 * Service ini bertanggung jawab murni untuk grant/revoke role Focus Room.
 * Dipisah dari workSessionService supaya:
 * - workSessionService tetap murni business logic, tidak bergantung ke Discord API
 * - kalau nanti cara "kasih akses" berubah (misal jadi channel permission overwrite,
 *   bukan role), kita cukup ubah file ini.
 */
export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

class PermissionService {
  async grantFocusRoomAccess(member: GuildMember): Promise<void> {
    try {
      await member.roles.add(env.focusRoomRoleId);
    } catch (error) {
      throw new PermissionError(
        `Gagal memberikan akses Focus Room ke ${member.user.tag}. ` +
          `Pastikan bot punya permission "Manage Roles" dan role bot berada di atas role Focus Room. Detail: ${
            (error as Error).message
          }`
      );
    }
  }

  async revokeFocusRoomAccess(member: GuildMember): Promise<void> {
    try {
      await member.roles.remove(env.focusRoomRoleId);
    } catch (error) {
      throw new PermissionError(
        `Gagal mencabut akses Focus Room dari ${member.user.tag}. Detail: ${
          (error as Error).message
        }`
      );
    }
  }

  hasFocusRoomAccess(member: GuildMember): boolean {
    return member.roles.cache.has(env.focusRoomRoleId);
  }
}

export const permissionService = new PermissionService();
