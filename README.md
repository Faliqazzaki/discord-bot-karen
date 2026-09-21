# TA Workspace Bot — Phase 1

Discord bot untuk workspace produktivitas tim saat mengerjakan TA.
Phase 1: core Discord bot + work session management (in-memory, belum pakai database).

## Fitur Phase 1

- `/startwork` — mulai work session, dapat akses role Focus Room
- `/endwork` — akhiri work session, akses Focus Room dicabut, durasi ditampilkan
- `/status` — lihat siapa saja yang sedang aktif bekerja

## Prasyarat

- Node.js versi 18 atau lebih baru ([download di sini](https://nodejs.org))
- Sudah membuat Discord Application + Bot di https://discord.com/developers/applications
- Bot sudah di-invite ke server Discord kamu
- Sudah ada 1 role bernama misalnya `Focus Room Access` di server (buat manual dulu di Server Settings → Roles)

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

| Variable | Cara mendapatkan |
|---|---|
| `DISCORD_TOKEN` | Developer Portal → Application kamu → Bot → Reset Token |
| `DISCORD_CLIENT_ID` | Developer Portal → Application kamu → General Information → Application ID |
| `DISCORD_GUILD_ID` | Discord app → aktifkan Developer Mode (Settings → Advanced) → klik kanan nama server → Copy Server ID |
| `FOCUS_ROOM_ROLE_ID` | Discord app → klik kanan role `Focus Room Access` → Copy Role ID |

**Jangan pernah commit file `.env` ke git** — file ini sudah masuk `.gitignore`.

### 3. Daftarkan slash command ke server

Jalankan sekali (dan setiap kali ada command baru/berubah):

```bash
npm run deploy-commands
```

Kalau berhasil, command `/startwork`, `/endwork`, `/status` akan langsung muncul saat kamu ketik `/` di server Discord.

### 4. Jalankan bot

Mode development (auto-restart saat file berubah):

```bash
npm run dev
```

Kalau di console muncul `✅ Bot online sebagai ...`, bot sudah siap dipakai.

## Cara pakai

1. Ketik `/startwork` di channel mana saja di server → kamu dapat role Focus Room
2. Kerja seperti biasa
3. Ketik `/endwork` saat selesai → role Focus Room dicabut, durasi kerja ditampilkan
4. Siapa saja bisa ketik `/status` untuk lihat siapa yang sedang aktif bekerja

## Catatan penting Phase 1

- **Data session hilang saat bot di-restart** — ini expected, karena Phase 1 belum pakai database. Persistence baru masuk di Phase 2 (Supabase).
- Bot butuh permission **Manage Roles** dan role bot harus **di atas** role Focus Room di urutan Server Settings → Roles, kalau tidak, grant/revoke akses akan gagal.
- Belum ada GitHub integration, AI, atau deployment ke VPS — semua itu di phase-phase berikutnya.

## Struktur project

```
src/
├── index.ts                    # entry point, setup client & load command
├── deploy-commands.ts          # script daftarkan slash command (jalankan manual)
├── commands/                   # 1 file = 1 slash command
│   ├── startwork.ts
│   ├── endwork.ts
│   └── status.ts
├── events/                     # Discord event handlers
│   ├── ready.ts
│   └── interactionCreate.ts
├── services/                   # business logic, tidak tahu soal Discord API detail
│   ├── workSessionService.ts
│   └── permissionService.ts
├── repositories/                # akses data (Phase 1: in-memory, Phase 2: Supabase)
│   └── workSessionRepository.ts
├── config/
│   └── env.ts                  # baca & validasi environment variables
├── types/
│   ├── session.ts
│   └── command.ts
└── utils/
    └── duration.ts
```

Alur data: **Command → Service → Repository**. Command tidak pernah bicara langsung ke repository, dan service tidak pernah tahu detail Discord.js — supaya nanti gampang di-test dan gampang migrasi ke Phase 2 (Supabase).
