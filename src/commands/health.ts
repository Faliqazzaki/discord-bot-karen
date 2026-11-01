import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { healthService } from "../services/healthService";
import { aiService } from "../services/aiService";

export const data = new SlashCommandBuilder()
  .setName("health")
  .setDescription("Cek status bot: latensi Discord, koneksi Supabase, dan konfigurasi AI");

function truncate(text: string, maxLength = 400): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const discordPingMs = interaction.client.ws.ping;
  const interactionLatencyMs = Date.now() - interaction.createdTimestamp;

  const supabaseHealth = await healthService.checkSupabase();
  const aiStatus = aiService.getStatus();

  // AI bersifat opsional: laporan tetap jalan tanpa AI, jadi cukup kuning.
  const color = !supabaseHealth.ok ? 0xed4245 : aiStatus.configured ? 0x57f287 : 0xfee75c;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("🩺 Status Bot")
    .addFields(
      {
        name: "🏓 Discord",
        value:
          `WebSocket latency: **${discordPingMs.toFixed(0)} ms**\n` +
          `Respons command: **${interactionLatencyMs} ms**`,
        inline: false,
      },
      {
        name: "🗄️ Supabase",
        value:
          `${supabaseHealth.ok ? "✅" : "❌"} ${supabaseHealth.message}\n` +
          `Latensi query: **${supabaseHealth.latencyMs} ms**`,
        inline: false,
      },
      {
        name: "🤖 AI Provider",
        value: aiStatus.configured
          ? `✅ **${aiStatus.provider}**${aiStatus.model ? ` • \`${aiStatus.model}\`` : ""}\n${aiStatus.message}`
          : `⚠️ Belum dikonfigurasi (\`${aiStatus.provider}\`)\n${truncate(aiStatus.message)}`,
        inline: false,
      }
    )
    .setFooter({ text: "TA Workspace Bot • Health Check" })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
