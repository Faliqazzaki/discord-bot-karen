# TA Workspace Bot

Discord bot untuk workspace produktivitas tim saat mengerjakan TA. Bot ini mengelola **work session** (mulai/selesai kerja), memberi akses **Focus Room**, menyimpan data ke **Supabase**, menerima aktivitas **GitHub** lewat webhook, dan membuat **ringkasan AI** dari data tim.

## Fitur

### Work Session

- `/startwork` — mulai work session dan dapatkan role Focus Room.
- `/endwork` — akhiri work session, role Focus Room dicabut, durasi kerja ditampilkan.
- `/status` — lihat siapa saja yang sedang work session aktif saat ini.
- **Auto-endwork** — session yang lupa di-`/endwork` otomatis ditutup setelah melewati batas durasi (default 8 jam), role Focus Room dicabut, dan user dikabari lewat DM (fallback ke system channel).

### Laporan & Statistik

- `/dailyreport` — ringkasan aktivitas tim hari ini + ringkasan AI.
- `/weeklyreport` — ringkasan aktivitas tim 7 hari terakhir + ringkasan AI.
- `/mystats` — statistik work session kamu sendiri (sepanjang waktu).
- `/teamstats` — statistik keseluruhan tim (sepanjang waktu).

### Integrasi

- **Supabase** — semua data user, server, work session, commit, dan pull request tersimpan permanen (tidak hilang saat bot restart).
- **GitHub webhook** — menerima event `push` dan `pull_request`, memverifikasi signature, lalu menyimpan commit/PR beserta statistiknya.
- **Gemini AI** — merangkum laporan harian/mingguan. Kalau API key tidak diisi, laporan tetap tampil tanpa bagian AI.

### Lainnya

- `/help` — tampilkan daftar command beserta fungsinya.
- `/health` — cek latensi Discord, koneksi Supabase, dan konfigurasi AI provider. Berguna untuk debugging tanpa membuka terminal.
- `/about` — info versi bot, uptime, dan link repository.

## Daftar Command

| Command | Fungsi |
|---|---|
| `/startwork` | Mulai work session dan dapatkan akses Focus Room |
| `/endwork` | Akhiri work session, cabut akses Focus Room, tampilkan durasi |
| `/status` | Lihat session yang sedang aktif |
| `/dailyreport` | Ringkasan aktivitas tim hari ini + AI |
| `/weeklyreport` | Ringkasan aktivitas tim 7 hari terakhir + AI |
| `/mystats` | Statistik work session kamu sendiri |
| `/teamstats` | Statistik work session seluruh tim |
| `/help` | Daftar command dan fungsinya (ephemeral) |
| `/health` | Cek latensi Discord, Supabase, dan konfigurasi AI (ephemeral) |
| `/about` | Versi bot, uptime, dan link repository (ephemeral) |

## Prasyarat

- Node.js versi 18 atau lebih baru ([download di sini](https://nodejs.org)) — bot memakai `fetch` bawaan Node.
- Discord Application + Bot ([Developer Portal](https://discord.com/developers/applications)), dan bot sudah di-invite ke server.
- Role `Focus Room Access` (atau nama lain) sudah dibuat di Server Settings → Roles.
- Project Supabase dengan tabel: `users`, `servers`, `work_sessions`, `commits`, `pull_requests`.
- (Opsional) API key Gemini untuk ringkasan AI.
- (Opsional) Akses repo GitHub untuk memasang webhook.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi environment variables

Copy `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Lalu isi nilainya:

| Variable | Wajib | Keterangan |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Developer Portal → Application → Bot → Reset Token |
| `DISCORD_CLIENT_ID` | ✅ | Developer Portal → General Information → Application ID |
| `DISCORD_GUILD_ID` | ✅ | Klik kanan nama server → Copy Server ID (aktifkan Developer Mode) |
| `FOCUS_ROOM_ROLE_ID` | ✅ | Klik kanan role Focus Room → Copy Role ID |
| `SUPABASE_URL` | ✅ | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase → Project Settings → API → `service_role` key |
| `GITHUB_WEBHOOK_SECRET` | ✅ | Secret bebas; harus sama dengan yang diisi di webhook GitHub |
| `GITHUB_TOKEN` | — | Personal access token; disarankan agar bisa baca repo privat & limit API lebih besar |
| `WEBHOOK_SERVER_PORT` | — | Default `3000` |
| `AI_PROVIDER` | — | Default `gemini` |
| `GEMINI_API_KEY` | — | Kalau kosong, ringkasan AI tidak tersedia |
| `GEMINI_MODEL` | — | Default `gemini-3.5-flash-lite` |
| `AUTO_ENDWORK_MAX_HOURS` | — | Default `8`. Batas durasi session sebelum ditutup otomatis |
| `AUTO_ENDWORK_CHECK_INTERVAL_MINUTES` | — | Default `10`. Interval pengecekan session kedaluwarsa |

**Jangan pernah commit file `.env` ke git** — file ini sudah masuk `.gitignore`.

`AUTO_ENDWORK_MAX_HOURS` menerima angka desimal (misal `0.5` = 30 menit). Nilai dibaca sekali saat bot start, jadi **restart bot setelah mengubah `.env`**.

### 3. Daftarkan slash command ke server

Jalankan sekali (dan setiap kali ada command baru/berubah):

```bash
npm run deploy-commands
```

Kalau berhasil, semua slash command akan langsung muncul saat kamu ketik `/` di server Discord.

### 4. Jalankan bot

Mode development (auto-restart saat file `.ts` berubah):

```bash
npm run dev
```

Atau build lalu jalankan versi production:

```bash
npm run build
npm start
```

Kalau di console muncul `✅ Bot online sebagai ...` dan `⏰ Auto-endwork aktif`, bot sudah siap dipakai.

## Cara Pakai

1. Ketik `/startwork` di channel mana saja → kamu dapat role Focus Room.
2. Kerja seperti biasa.
3. Ketik `/endwork` saat selesai → role Focus Room dicabut, durasi kerja ditampilkan.
4. Ketik `/status` untuk melihat siapa yang sedang aktif bekerja.
5. Ketik `/dailyreport`, `/weeklyreport`, `/mystats`, atau `/teamstats` untuk melihat laporan.
6. Ketik `/help` untuk melihat daftar command, `/health` untuk cek status bot, dan `/about` untuk info versi.

## Auto-endwork

Kalau user lupa `/endwork`, session-nya tidak akan menggantung selamanya:

- Bot mengecek session aktif secara berkala (`AUTO_ENDWORK_CHECK_INTERVAL_MINUTES`).
- Session yang sudah berjalan lebih lama dari `AUTO_ENDWORK_MAX_HOURS` ditutup dengan status `ended`.
- Role Focus Room dicabut, lalu user dikirimi DM. Kalau DM gagal (misal DM ditutup), notifikasi dikirim ke system channel server.
- Pengecekan pertama juga berjalan saat bot start, jadi session lama yang sudah kedaluwarsa langsung ditutup setelah restart.
- Durasi dihitung dari waktu `started_at`, bukan dari aktivitas terakhir user.

## Setup Webhook GitHub

1. Jalankan bot agar webhook server aktif di `WEBHOOK_SERVER_PORT` (default `3000`).
2. Buka repo GitHub → Settings → Webhooks → Add webhook.
3. Isi **Payload URL** dengan `https://<host-kamu>:<port>/webhooks/github`.
   - Untuk development lokal, gunakan tunnel seperti ngrok/smee.
4. **Content type**: `application/json`.
5. **Secret**: samakan dengan `GITHUB_WEBHOOK_SECRET` di `.env`.
6. Pilih event **Pushes** dan **Pull requests**.
7. Setelah tersimpan, GitHub mengirim event `ping` — cek console bot untuk memastikan webhook terpasang.

Endpoint tambahan: `GET /health` untuk cek bot/webhook server hidup.

## Catatan Penting

- Bot butuh permission **Manage Roles**, dan role bot harus **di atas** role Focus Room di Server Settings → Roles. Kalau tidak, grant/revoke akses akan gagal.
- Data work session tersimpan di Supabase, jadi tidak hilang saat bot restart.
- GitHub activity **belum terhubung** ke identitas Discord — laporan menampilkannya berdasarkan username GitHub. Command `/linkgithub` belum tersedia.
- Ringkasan AI dibuat dengan guardrail: hanya meringkas data, tidak membuat ranking atau menilai kinerja seseorang.
- Tanpa `GITHUB_TOKEN`, GitHub API dibatasi 60 request/jam dan repo privat tidak bisa diakses.

## Troubleshooting

Mulai dari `/health` di Discord — command ini menunjukkan bagian mana yang bermasalah.

| Gejala | Kemungkinan penyebab & solusi |
|---|---|
| `/health` menampilkan Supabase ❌ / `fetch failed` | Cek `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY`. Pastikan project Supabase tidak sedang paused dan server bisa mengakses internet. |
| `/health` menampilkan AI ⚠️ | `GEMINI_API_KEY` kosong atau `AI_PROVIDER` tidak dikenal. Isi key lalu restart bot. |
| Laporan muncul tanpa bagian AI | Normal jika AI belum dikonfigurasi; laporan objektif tetap ditampilkan. |
| Grant/revoke Focus Room gagal | Bot butuh permission **Manage Roles**, dan role bot harus di atas role Focus Room. |
| Command tidak muncul saat mengetik `/` | Jalankan `npm run deploy-commands`, cek `DISCORD_GUILD_ID`, lalu restart Discord. |
| Webhook GitHub mendapat `401` | `GITHUB_WEBHOOK_SECRET` di `.env` tidak sama dengan secret di GitHub. |
| `Unknown interaction` / command timeout | Bot restart atau lambat merespons. Cek console dan `/health`. |
| Session lama masih aktif setelah restart | Cek log `[autoEndwork]`; pastikan job berjalan dan batas durasi belum terlewati. |

## Struktur Project

```
src/
├── index.ts                    # entry point, setup client, load command, start job
├── deploy-commands.ts          # script daftarkan slash command (jalankan manual)
├── server.ts                   # webhook server Express (GitHub + /health)
├── commands/                   # 1 file = 1 slash command
│   ├── startwork.ts
│   ├── endwork.ts
│   ├── status.ts
│   ├── dailyreport.ts
│   ├── weeklyreport.ts
│   ├── mystats.ts
│   ├── teamstats.ts
│   ├── help.ts
│   ├── health.ts
│   └── about.ts
├── events/                     # Discord event handlers
│   ├── ready.ts
│   └── interactionCreate.ts
├── jobs/
│   └── autoEndworkJob.ts       # penutupan session kedaluwarsa berkala
├── services/                   # business logic, tidak tahu detail Discord API
│   ├── workSessionService.ts
│   ├── permissionService.ts
│   ├── reportService.ts
│   ├── githubService.ts
│   ├── aiService.ts
│   ├── healthService.ts
│   └── ai/
│       ├── AIProvider.ts
│       └── GeminiProvider.ts
├── repositories/               # akses data ke Supabase
│   ├── userRepository.ts
│   ├── serverRepository.ts
│   ├── workSessionRepository.ts
│   ├── reportRepository.ts
│   └── githubRepository.ts
├── config/
│   ├── env.ts                  # baca & validasi environment variables
│   └── supabaseClient.ts
├── types/
│   ├── session.ts
│   ├── report.ts
│   ├── github.ts
│   └── command.ts
└── utils/
    ├── duration.ts
    └── formatReport.ts
```

## Scripts

| Command | Fungsi |
|---|---|
| `npm run dev` | Jalankan bot mode development (auto-restart) |
| `npm run build` | Compile TypeScript ke `dist/` |
| `npm start` | Jalankan hasil build |
| `npm run deploy-commands` | Daftarkan slash command ke guild |

Alur data: **Command → Service → Repository**. Command tidak pernah bicara langsung ke repository, dan service tidak bergantung pada detail Discord.js — supaya mudah di-test dan dikembangkan.
