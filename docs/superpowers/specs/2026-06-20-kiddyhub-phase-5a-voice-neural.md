# KiddyHub — Giai đoạn 5 · Phần A: Giọng đọc neural bản cuối (Phase 5A Design)

> **Trạng thái:** Đã duyệt nguồn TTS = **Piper (local, miễn phí)** (2026-06-20). Spec triển khai: **GĐ5 — Phần A.**
> **Bản đồ GĐ5:** [`2026-06-20-kiddyhub-phase-5-roadmap.md`](./2026-06-20-kiddyhub-phase-5-roadmap.md) · **Tiền lệ:** [`2026-06-20-kiddyhub-phase-4a-audio-voice.md`](./2026-06-20-kiddyhub-phase-4a-audio-voice.md) (đã tách `SpeechEngine` interface — Phần A tận dụng).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — "Giai đoạn 5 / Phần A".

---

## 1. Mục tiêu Phần A

Sửa **lỗi chất lượng cốt lõi đã biết**: Web Speech đọc tiếng Việt **sai giọng** trên Chromium-macOS (Chrome / Cốc Cốc / Edge **không expose giọng `vi-VN`** → đọc tiếng Việt bằng giọng tiếng Anh); macOS chỉ có giọng "Linh" compact (robot). Voice-first là cốt lõi (bé chưa đọc), nên đây là lỗi nghiêm trọng về trải nghiệm.

**Cách sửa:** **thu sẵn** mọi câu manifest + nội dung động **hữu hạn** bằng **Piper TTS chạy cục bộ lúc build**, đóng gói thành **clip MP3 nén nhỏ**, phát lúc runtime. Kết quả: **giọng Việt/Anh đúng & nhất quán trên MỌI trình duyệt** (Safari, Chrome, Cốc Cốc, Edge, Android), **runtime offline tuyệt đối** (chỉ phát file đã bundle, không gọi mạng, không phụ thuộc giọng OS). Đây cũng là **nền giọng** cho Phần B (gợi ý dạy có giọng), D (Cáo nói), E (đọc mọi nút điều hướng).

**Local kể cả lúc build:** Piper là engine mã nguồn mở chạy ngay trên máy — **không tài khoản, không API, không cloud**. Mạng chỉ cần *một lần* để tải model giọng; sau đó clip được **commit vào repo** nên cả `npm run build` lẫn Docker **không cần Piper** — chỉ bundle file có sẵn.

> **Ngoài phạm vi Phần A:** câu gợi-ý-dạy của Phần B (sẽ thu thêm ở B), nội dung động *vô hạn* (tên bé tự đặt → vẫn dùng Web Speech fallback), đổi lời thoại hiện có.

## 2. Ranh giới — KHÔNG đụng tới gì

- **Logic & guard trò chơi** (`*Logic.ts`, `progression.ts`, `applyCompletion.ts`, `registry.ts`, `roundResolved`/`finished`, drag-snap/hit-area) — không đổi.
- **`AudioManager` (`src/audio/AudioManager.ts`)** — **giữ nguyên hoàn toàn** (interface công khai + nội tại). Engine mới tuân thủ y nguyên interface `SpeechEngine` nên `AudioManager` không cần biết. *(Đây là lý do GĐ4A tách engine ra.)*
- **`audioManifest.ts`** — giữ nguyên 20 voice key + lời thoại (clip thu đúng từ các `text` này).
- **`sfxEngine.ts`** (SFX Web Audio) — không đụng; Phần A chỉ thay đường *giọng*, không thay SFX.
- **Cài đặt âm/giọng** (`getSettings` → `setSoundOn/setVoiceOn`) — engine mới vẫn tôn trọng toggle qua `AudioManager` như cũ.
- **Hạ tầng test** — giữ alias `phaser → stub`; engine mới phải **jsdom-safe** (không `HTMLAudioElement`/`Audio` thật trong jsdom → tiêm bản giả như GĐ4A tiêm `SpeechEngine` giả). **Không** làm đỏ 213 test hiện có.
- **Runtime offline** — tuyệt đối không thêm lời gọi mạng lúc chạy.

## 3. Kiến trúc: engine "clip thu sẵn" + fallback Web Speech

Thêm **một** `SpeechEngine` mới, **bọc** engine Web Speech cũ làm fallback. `AudioManager` không đổi; chỉ `App.tsx` đổi engine được tiêm.

### 3.1 `src/audio/prerecordedEngine.ts` (mới)

```ts
import type { SpeechEngine } from './speechEngine';

// Tra cứu clip: khoá chuẩn hoá `${lang}|${text.trim()}` -> URL file mp3.
export type ClipIndex = Record<string, string>;

export interface AudioPlayer {            // tiêm được, để test không cần Audio thật
  play(url: string, onDone: () => void): () => void; // trả cancel()
}

export function createPrerecordedEngine(
  clips: ClipIndex,
  fallback: SpeechEngine,                 // Web Speech, cho nội dung không có clip
  player?: AudioPlayer,                    // mặc định: HTMLAudioElement thật
): SpeechEngine;
```

- `speak(text, lang, onDone)`:
  1. Chuẩn hoá khoá `key = lang + '|' + text.trim()`.
  2. **Có clip** → `player.play(url, onDone)`; trả `cancel()` (pause + onDone idempotent). `onDone` bắn ở **cả `ended` lẫn `error`/`play()` bị từ chối** (không treo — đúng hợp đồng GĐ4A).
  3. **Không có clip** (vd tên bé) → **uỷ quyền cho `fallback.speak(...)`** (Web Speech). Vẫn trả `cancel()` của fallback.
- **Bản `AudioPlayer` thật** dùng `HTMLAudioElement` (`new Audio(url)`): `play()` (xử lý promise rejection do autoplay → gọi onDone); `ended`/`error` → onDone; cancel = `pause()` + onDone. Nếu `Audio` không tồn tại (jsdom) → no-op an toàn (onDone ngay).
- **Lý do HTMLAudioElement** (không Web Audio): đơn giản, tự giải mã mp3, có `ended`, `pause()` để ngắt — đủ cho clip một-phát. (SFX vẫn dùng Web Audio riêng, không liên quan.)

> Ngữ nghĩa preempt/cancel/resolve **không đổi** vì nằm ở `AudioManager.utter()` (đã đúng từ GĐ4A). Engine mới chỉ cần: gọi `onDone` đúng một lần ở mọi nhánh, và `cancel()` làm `onDone` chạy.

### 3.2 `src/audio/voiceClips.ts` (sinh tự động, commit)

File **do script sinh ra** (đừng sửa tay): `export const VOICE_CLIPS: ClipIndex = { 'vi-VN|Giỏi quá!': '/voice/ab12cd.mp3', ... }`. Tên file = hash ngắn của khoá (tránh ký tự dấu/space trong tên file). Đặt clip ở `public/voice/*.mp3` (phục vụ tĩnh ở `/voice/...`, vào precache PWA).

## 4. Pipeline thu giọng — `scripts/build-voice-clips.mjs` (chạy một lần, cục bộ)

Theo đúng tiền lệ `scripts/build-pwa-icons.mjs` (công cụ chạy tay, output commit). Các bước:

1. **Liệt kê dòng cần thu** — **DRY, không hard-code**: script import các nguồn nội dung thật và gom thành tập `{text, lang}` *duy nhất*:
   - 20 dòng từ `AUDIO_MANIFEST.voices` (đã có sẵn `{text, lang}`).
   - Nội dung động **hữu hạn** từ các module logic/nội dung (xem §5).
2. **Sinh WAV bằng Piper** cho mỗi dòng:
   - Giọng Việt: **`vi_VN-vais1000-medium`** (chất lượng tốt nhất nhóm vi của Piper).
   - Giọng Anh: **`en_US-amy-medium`** (rõ ràng, ấm, hợp bé học từ vựng).
   - Model `.onnx` + `.json` tải một lần từ `rhasspy/piper-voices` (HuggingFace) về `scripts/.piper-cache/` (gitignore).
3. **Nén WAV → MP3 mono** bằng `ffmpeg` (`-ac 1 -ar 22050 -b:a 48k`) — nhỏ & **chạy mọi trình duyệt** (kể cả Safari iPad). Output `public/voice/<hash>.mp3`.
4. **Sinh `src/audio/voiceClips.ts`** (khoá→URL) + **commit cả clip lẫn index**.
5. **Idempotent:** dòng đã có clip (cùng hash) thì bỏ qua → chạy lại nhanh khi thêm nội dung.

> Phụ thuộc công cụ (một lần, cục bộ): `piper` (binary hoặc `pip install piper-tts`) + `ffmpeg` (brew). **Không** thêm vào `package.json` runtime/CI; build production & Docker **không** cần chúng.

## 5. Tập clip cần thu (nội dung hữu hạn)

Script gom từ **chính các module đang dùng** (sync tự động) — ước ~150–170 clip, ~1–1.5 MB tổng (mp3 mono 48k, mỗi clip ~1–2s/5–12 KB):

| Nguồn | Ngôn ngữ | Lấy từ |
|---|---|---|
| 20 câu manifest | vi-VN | `AUDIO_MANIFEST.voices` |
| Số đếm tiếng Việt | vi-VN | dải số của `counting-fun` (`countingLogic`) |
| Chữ cái tiếng Việt (29, gồm Ă Â Ê Ô Ơ Ư Đ) | vi-VN | bảng chữ của `letter-spotting` / `first-letter` |
| Từ vựng tiếng Anh | en-US | `first-words` (`wordLogic`) |
| Chữ cái tiếng Anh (A–Z) | en-US | `abc-english` (`abcLogic`) |
| Số đếm tiếng Anh (one…ten) | en-US | `numbers-english` (`numbersEnLogic`) |
| Tên màu tiếng Anh | en-US | `colors-english` (`colorsEnLogic`) |
| Tên 6 nhóm | vi-VN | `src/content/categories.ts` |
| Tên 16 trò | vi-VN | registry `src/games/index.ts` (title) |

**Không thu** (→ Web Speech fallback): tên bé do phụ huynh tự nhập (vô hạn).

## 6. Tích hợp (thay đổi tối thiểu)

- **`src/App.tsx`** (~dòng dựng audio): đổi
  `createAudioManager(createWebSpeechEngine(), sfx, MANIFEST)`
  → `createAudioManager(createPrerecordedEngine(VOICE_CLIPS, createWebSpeechEngine()), sfx, MANIFEST)`.
  *(Web Speech vẫn được tạo — nay là fallback.)*
- **Không đổi** `AudioManager`, các scene, `audioManifest`, `GameHost`, màn menu — chúng gọi `speak`/`speakText` y như cũ; engine mới lo việc tra clip vs fallback.

## 7. PWA precache

- `vite-plugin-pwa` (workbox) precache theo glob trên `dist`. Thêm `mp3` vào `workbox.globPatterns` (`vite.config.ts`) để clip vào precache → **chạy offline ngay lần đầu**.
- Kiểm tra tổng precache sau khi thêm (~1.9 MB hiện tại + ~1–1.5 MB giọng). Nếu cần, đặt clip dưới một thư mục để dễ kiểm soát glob. Giữ `sw.js`/manifest no-cache (nginx) như cũ.

## 8. Kiểm thử

- **`src/audio/prerecordedEngine.test.ts`** (tiêm `AudioPlayer` giả + `SpeechEngine` fallback giả):
  - có clip → gọi `player.play(url, onDone)`, **không** chạm fallback; `onDone` bắn khi player xong; `cancel()` làm `onDone` chạy & gọi pause.
  - **không** clip → uỷ quyền `fallback.speak(text, lang, onDone)`.
  - chuẩn hoá khoá đúng (`lang|text.trim()`), khớp đúng lang (vi vs en cùng text hiếm nhưng phải tách).
  - `Audio` vắng (jsdom) trong bản player thật → no-op, onDone ngay.
- **`src/audio/voiceClips.test.ts` (coverage/chống-drift):** import `VOICE_CLIPS` + các nguồn §5; **khẳng định mọi `{text,lang}` hữu hạn app có thể đọc đều có khoá trong index** (thiếu → đỏ, nhắc chạy lại script). Nội dung vô hạn (tên) được loại trừ tường minh.
- **`AudioManager.test.ts` giữ nguyên xanh** (interface engine không đổi).
- Toàn bộ **213 test giữ xanh**; engine mới jsdom-safe.

## 9. Bàn giao Phần A

- Cập nhật `ROADMAP.md`: đánh ✅ Phần A + ghi tổng test mới.
- Cập nhật sổ SDD `.superpowers/sdd/progress.md`.
- **Kiểm thử thủ công (`npm run build` + preview, trình duyệt thật — đặc biệt Chrome/Cốc Cốc macOS):** câu dẫn đọc **giọng Việt đúng** (không còn giọng Anh đọc tiếng Việt); nhóm English đọc en-US; số/chữ/từ/màu/tên-nhóm/tên-trò đọc đúng từ clip; tên bé (không clip) vẫn đọc qua Web Speech; offline (tắt mạng) vẫn đọc; giọng không treo khi chen ngang; cài đặt tắt giọng vẫn im.

## 10. Rủi ro & quyết định

- **Chất lượng giọng Piper vi (rủi ro chính):** `vi_VN-vais1000-medium` tốt hơn "Linh" compact nhưng có thể chưa mượt bằng neural cloud. **Giảm thiểu — cổng chất lượng sớm:** *bước đầu tiên* của implement = cài Piper + thu **một nhúm clip mẫu** (vài câu manifest + vài số/chữ/từ) rồi **gửi chủ dự án nghe duyệt TRƯỚC khi thu trọn bộ + nối dây**. Không đạt → đổi giọng Piper khác / cân nhắc Azure (kiến trúc không đổi, chỉ đổi script + nguồn clip).
- **Autoplay policy:** clip chỉ phát sau cú chạm đầu (như SFX/Web Speech hiện nay) — chấp nhận; bé luôn chạm để chơi. `Audio.play()` bị từ chối → gọi `onDone` để không treo.
- **Định dạng MP3:** chọn mp3 (không Opus/Ogg) để **mọi** trình duyệt gồm Safari iPad phát được; mono 48k đủ rõ cho giọng & nhỏ.
- **Kích thước bundle:** ~1–1.5 MB giọng, tải-một-lần + precache offline; chấp nhận (đã có Phaser 1.5 MB tách riêng; giọng nhỏ hơn & có thể lười-tải nếu cần — nhưng precache để offline lần đầu là chủ ý).
- **Build cần Piper/ffmpeg?** **Không** ở build/CI/Docker — clip commit sẵn. Chỉ máy *sinh lại* giọng mới cần (một lần). `scripts/.piper-cache/` gitignore.
