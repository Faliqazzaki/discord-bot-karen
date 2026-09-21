import { Client } from "discord.js";
import "../types/command"; // memastikan augmentasi tipe client.commands ter-load

export function registerInteractionCreateEvent(client: Client) {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.warn(`[interactionCreate] Command tidak dikenal: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[interactionCreate] Error saat menjalankan /${interaction.commandName}:`, error);

      const errorMessage = {
        content: "❌ Terjadi kesalahan saat menjalankan command ini.",
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  });
}
