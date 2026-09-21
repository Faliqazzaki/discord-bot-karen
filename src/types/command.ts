import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// Augmentasi tipe Client bawaan discord.js supaya client.commands dikenali TypeScript.
declare module "discord.js" {
  interface Client {
    commands: Map<string, Command>;
  }
}
