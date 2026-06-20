# KiddyHub — Giai đoạn 5 · Phần A Implementation Plan (Giọng đọc neural Piper)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Spec (source of truth):** [`../specs/2026-06-20-kiddyhub-phase-5a-voice-neural.md`](../specs/2026-06-20-kiddyhub-phase-5a-voice-neural.md)
> **Roadmap GĐ5:** [`../specs/2026-06-20-kiddyhub-phase-5-roadmap.md`](../specs/2026-06-20-kiddyhub-phase-5-roadmap.md) (§5 TTS = Piper, §6 ranh giới)
> **Style reference:** [`2026-06-20-kiddyhub-phase-3.md`](./2026-06-20-kiddyhub-phase-3.md)

**Goal:** Thay giọng Web Speech live bằng **clip MP3 thu sẵn bằng Piper TTS** (cục bộ, miễn phí) cho mọi câu manifest + nội dung động *hữu hạn*, để sửa lỗi "Chromium-macOS đọc tiếng Việt bằng giọng tiếng Anh". Runtime **offline tuyệt đối** (chỉ phát clip đã bundle). Web Speech vẫn còn — nay là **fallback** cho nội dung không có clip (tên bé).

**Architecture:** Thêm **một** `SpeechEngine` mới (`prerecordedEngine.ts`) tra clip theo khoá `${lang}|${text.trim()}` → URL mp3, phát qua `HTMLAudioElement` (tiêm được để test); thiếu clip → uỷ quyền cho fallback Web Speech. `AudioManager` **không đổi** (interface engine giữ nguyên từ GĐ4A). Clip do `scripts/build-voice-clips.mjs` sinh một lần cục bộ (Piper → WAV → ffmpeg → mp3), output `public/voice/<hash>.mp3` + index `src/audio/voiceClips.ts` (cả hai **commit**). Chỉ `App.tsx` đổi engine được tiêm (một dòng).

**Tech stack:** TypeScript 5 (strict), Vitest 2, Vite + vite-plugin-pwa (workbox). Generator chạy bằng `tsx` (như `build-pwa-icons.mjs`). Piper qua venv cục bộ ở `scripts/.piper-cache/venv/` (đã dựng ở khâu de-risk). ffmpeg qua brew.

---

## Global Constraints

- **Runtime offline tuyệt đối:** engine mới KHÔNG gọi mạng. Chỉ phát `/voice/<hash>.mp3` đã bundle. Web Speech fallback cũng cục bộ.
- **KHÔNG đụng:** `src/audio/AudioManager.ts` (giữ nguyên 100% — interface + nội tại), `src/audio/sfxEngine.ts`, `src/audio/audioManifest.ts` (giữ nguyên 20 voice key + lời thoại), mọi `*Logic.ts`, `progression.ts`, `applyCompletion.ts`, `registry.ts`, guard `roundResolved`/`finished`, drag-snap/hit-area, các Phaser scene, `GameHost`/`GameModule`. **Chỉ chạm** `App.tsx` (1 dòng), `vite.config.ts` (workbox glob), `.gitignore`, + **tạo mới** `prerecordedEngine.ts`, `voiceClips.ts` (sinh), 2 file test, `scripts/build-voice-clips.mjs`.
- **jsdom-safe:** engine mới không dùng `Audio`/`HTMLAudioElement` thật trong test → tiêm `AudioPlayer` giả; bản player thật no-op an toàn khi `Audio` vắng (jsdom). Giữ alias `phaser → src/test/phaser-stub.ts`.
- **Hợp đồng engine (giữ từ GĐ4A):** `speak(text, lang, onDone)` gọi `onDone` **đúng một lần** ở MỌI nhánh (ended / error / play() rejected / cancel / off-or-empty) — không bao giờ treo. Trả `cancel()` làm `onDone` chạy idempotent.
- **Build production / CI / Docker KHÔNG cần Piper/ffmpeg** — clip commit sẵn. Chỉ máy *sinh lại* giọng mới cần (một lần). `scripts/.piper-cache/` gitignore.
- **213 test hiện có giữ XANH;** thêm 2 file test mới (engine + coverage). `npm run build`, `npm run lint`, `npx tsc -b` xanh.
- **Commits:** một commit mỗi task ở bước cuối task.

---

## Khám phá đã chốt từ khâu de-risk (đọc trước khi code)

> Tất cả đã xác minh trên máy (Piper 1.4.2 + voice `vi_VN-vais1000-medium` & `en_US-amy-medium`, espeak phonemizer). Đây là dữ liệu cứng cho generator §Task 2.

1. **App-string nào được đọc (khoá tra clip = chuỗi app truyền vào `speak`/`speakText`):**
   - **Manifest:** 20 dòng `AUDIO_MANIFEST.voices[*].text` (lang trong entry, tất cả `vi-VN`). `AudioManager.speak(key)` → `utter(entry.text, entry.lang)` → engine nhận `entry.text`. **Khoá clip = `entry.text`, KHÔNG phải `key`.**
   - **counting-fun** → `speakText(String(count), 'vi-VN')` → DIGIT "1".."10" (count 1..max, max=10 ở L3).
   - **letter-spotting** → `speakText(target, 'vi-VN')` → 29 chữ cái Việt `LETTERS`.
   - **first-letter** → `speakText(target, 'vi-VN')` → chữ từ `LETTER_POOL` (M,C,O,V,G,N,T,R,B,D,H,L,S,X — đều ⊂ 29 chữ trên).
   - **abc-english** → `speakText(target, 'en-US')` → A–Z (26).
   - **numbers-english** → `speakText(word, 'en-US')` → "one".."ten" (10).
   - **colors-english** → `speakText(name, 'en-US')` → 8 màu.
   - **first-words** → `speakText(word, 'en-US')` → 18 từ (6×3 level, union).
   - **Tên nhóm / tên trò:** HIỆN TẠI **chưa** đọc ở runtime (không scene/menu nào gọi speakText cho chúng — Phần E mới "đọc mọi nút"). Spec §5 liệt kê chúng để thu *sẵn cho B/D/E*. → **Quyết định:** thu tên-nhóm (6) + tên-trò (16) để sẵn sàng, NHƯNG **loại khỏi coverage-test "app đọc được"** (vì runtime chưa đọc) — đưa vào danh sách "extra, optional" của generator. *(Xem "Điều chỉnh spec" cuối plan.)*

2. **Chuẩn hoá app-string → input-Piper (CHỖ DUY NHẤT app-string ≠ piper-input):**
   - **Số Việt (digit):** Piper-vi đọc `"3"` → phonemes `bˈaː` = **"ba"** ĐÚNG. → **digit KHÔNG cần remap**, feed thẳng "1".."10". (Đã xác minh phonemes cho cả dải.)
   - **Chữ cái Anh:** `"B"`→`bˈiː`("bee"), `"A"`→`ˈeɪ`, `"Z"`→`zˈiː` — **ĐÚNG tên chữ**, feed thẳng A–Z, KHÔNG remap.
   - **Từ/màu Anh:** `"cat"`→`kˈæt`, `"red"`→`ɹˈɛd` — đúng, feed thẳng.
   - **Chữ cái Việt (CẦN REMAP):** đọc raw single-letter thì **sai/lung tung** — `G`→`ðˈe7`, `H`→`hˈaɜt`("hát"), `L/M/N/R/S`→kiểu "e-lờ"/"e-mờ", `X`→`ˈiɜc`, `Đ`→`dˈəː`, `D`→`dˈe`. **Phải remap sang TÊN CHỮ tiếng Việt** rồi mới feed Piper. **Bảng remap (khoá = chữ app, value = text feed Piper):**
     ```
     A→"a"  Ă→"á"  Â→"ớ"  B→"bê"  C→"xê"  D→"dê"  Đ→"đê"  E→"e"  Ê→"ê"
     G→"gờ" H→"hờ" I→"i"  K→"ca"  L→"lờ"  M→"mờ"  N→"nờ"  O→"o"  Ô→"ô"
     Ơ→"ơ"  P→"pê" Q→"cu" R→"rờ"  S→"sờ"  T→"tờ"  U→"u"   Ư→"ư"  V→"vê"
     X→"xờ" Y→"i dài"
     ```
     (Đã xác minh các tên này phonemize sạch & đúng. **Khoá clip vẫn là chữ gốc** `"Ă"`, chỉ text-feed-Piper đổi.)
   - **Số/chữ/từ/màu Anh, digit Việt, mọi câu manifest:** feed thẳng (identity).

3. **Đếm clip (đã tính chính xác từ module thật):** **142 clip** core (80 vi-VN + 62 en-US): 20 manifest + 10 digit + 29 chữ Việt + 18 từ Anh + 26 chữ Anh + 10 số Anh + 8 màu Anh + (1 từ trùng? không) = 121 core "app-đọc-được" + 6 tên nhóm + 16 tên trò (extra) ≈ **143**. **Kích thước ~600 KB** (mp3 mono 48k: câu dài ~7 KB, token ngắn ~3 KB). *(Nhỏ hơn nhiều ước tính spec 1–1.5 MB → precache thoải mái.)*

---

## File Structure

```
kiddy-hub/
  scripts/
    build-voice-clips.mjs            # TẠO (Task 2): generator một-lần, cục bộ
    .piper-cache/                    # gitignore: venv + models (.onnx/.json) [đã dựng]
    voice-samples/                   # gitignore: clip mẫu de-risk [đã có]
  public/
    voice/<hash>.mp3                 # TẠO (Task 2 chạy): clip đã nén — COMMIT
  src/
    audio/
      prerecordedEngine.ts           # TẠO (Task 3): engine clip + fallback
      prerecordedEngine.test.ts      # TẠO (Task 3): test engine (player giả)
      voiceClips.ts                  # SINH (Task 2 chạy): ClipIndex — COMMIT, đừng sửa tay
      voiceClips.test.ts             # TẠO (Task 4): coverage/anti-drift
      AudioManager.ts                # KHÔNG ĐỔI
      audioManifest.ts               # KHÔNG ĐỔI
      speechEngine.ts                # KHÔNG ĐỔI (dùng làm fallback)
    App.tsx                          # MODIFY (Task 5): 1 dòng đổi engine
  vite.config.ts                     # MODIFY (Task 5): thêm mp3 vào globPatterns
  .gitignore                         # MODIFY: thêm scripts/.piper-cache/ [đã thêm ở de-risk]
  ROADMAP.md / .superpowers/sdd/progress.md  # MODIFY (Task 6): handoff
```

**Thứ tự & phụ thuộc:** Task 1 (cổng chất lượng — CHẶN bởi review của con người) → Task 2 (generator + chạy sinh clip) → Task 3 (engine + test) → Task 4 (coverage test) → Task 5 (tích hợp App + PWA) → Task 6 (handoff). Task 3 và 4 có thể song song *sau* Task 2 (cần `voiceClips.ts`). Engine (Task 3) thực ra không phụ thuộc clip thật để test (dùng index giả) → **có thể làm Task 3 song song Task 2**.

---

### Task 1: 🚦 Cổng chất lượng — clip mẫu cho con người nghe duyệt **[CHECKPOINT NGƯỜI]**

> Mục tiêu: chủ dự án **nghe** chất lượng giọng Piper-vi/en TRƯỚC khi thu trọn bộ + nối dây. Không đạt → đổi giọng Piper khác (hoặc Azure — kiến trúc không đổi). **DỪNG ở đây chờ duyệt.**

- [x] **Step 1: Cài Piper + ffmpeg + tải model** *(ĐÃ XONG ở khâu de-risk)*
  - venv: `python3 -m venv scripts/.piper-cache/venv && scripts/.piper-cache/venv/bin/python -m pip install piper-tts` (1.4.2).
  - ffmpeg: `brew install ffmpeg` (đã có 8.1.1).
  - Model về `scripts/.piper-cache/`: `vi_VN-vais1000-medium.onnx(.json)` + `en_US-amy-medium.onnx(.json)` (curl từ `huggingface.co/rhasspy/piper-voices/resolve/main/...`).
- [x] **Step 2: Sinh ~8–12 clip mẫu** → `scripts/voice-samples/*.mp3` *(ĐÃ XONG)*. Gồm: 3 câu manifest vi, digit "3" (RAW vs "ba"), chữ Việt RAW vs NAMED (Ă, Đ, G, X), en `cat`/`B`/`red`. Lệnh: `printf '%s\n' "<text>" | venv/bin/python -m piper -m <model> -c <config> -f /tmp/x.wav && ffmpeg -y -i /tmp/x.wav -ac 1 -ar 22050 -b:a 48k <out>.mp3`.
- [ ] **Step 3: 🚦 GỬI CHỦ DỰ ÁN NGHE** các mẫu (đặc biệt: chất lượng giọng vi tổng thể; chữ Việt NAMED có đọc đúng tên chữ không; số đọc đúng không). **CHỜ DUYỆT.** Đạt → tiếp Task 2. Không đạt → escalate đổi giọng/nguồn (cập nhật bảng remap & model path trong generator, phần còn lại không đổi).

---

### Task 2: Generator `scripts/build-voice-clips.mjs` + chạy sinh clip

**Files:** Create `scripts/build-voice-clips.mjs`; (chạy) sinh `public/voice/*.mp3` + `src/audio/voiceClips.ts`.

**Interfaces / hành vi:**
- Chạy: `npx tsx scripts/build-voice-clips.mjs` (tsx để import `.ts` module nội dung — DRY, không hard-code danh sách).
- **DRY enumerate:** import module thật và gom tập `{lang, text}` *duy nhất*:
  - `AUDIO_MANIFEST.voices` (`src/audio/audioManifest.ts`) → `{entry.lang, entry.text}` ×20.
  - `COUNTING`/digits: số "1".."10" (lang `vi-VN`). *(Hằng — có thể lấy max từ `maxCountForLevel(3)` của `countingLogic` = 10.)*
  - `LETTERS` (`letter-spotting/letterLogic`) ×29 + `LETTER_POOL` (`first-letter/firstLetterLogic`) — union (lang `vi-VN`).
  - `WORD_BANK` (`first-words/wordLogic`) L1∪L2∪L3 `.word` (lang `en-US`).
  - `ALPHABET` (`abc-english/abcLogic`) A–Z (lang `en-US`).
  - `NUMBER_WORDS` (`numbers-english/numbersEnLogic`) values (lang `en-US`).
  - `COLORS` (`colors-english/colorsEnLogic`) `.name` (lang `en-US`).
  - **(extra, optional)** `CATEGORIES` (`content/categories`) `.title` ×6 + game `title` từ registry ×16 (lang theo nội dung: tên Việt `vi-VN`, "ABC"/"Colors"/"First Words"/"Numbers 1–10" `en-US`). Gắn cờ `extra: true` để Task 4 loại khỏi coverage bắt buộc.
- **Chuẩn hoá app-string → piper-input** (bảng `PIPER_INPUT`):
  - VI letters: dùng bảng remap 29-chữ ở §"Khám phá" (chữ → tên chữ Việt).
  - Còn lại: identity (digit, chữ Anh, từ, màu, câu manifest, tên nhóm/trò).
- **Sinh từng clip:**
  1. `hash = createHash('sha1').update(lang + '|' + text.trim()).digest('hex').slice(0, 10)` → tên file `public/voice/<hash>.mp3`. *(Hash từ KHOÁ, không từ piper-input → khoá ổn định.)*
  2. **Idempotent:** nếu `public/voice/<hash>.mp3` đã tồn tại → bỏ qua synth (chạy lại nhanh; thêm nội dung chỉ sinh phần mới).
  3. Piper: `execFileSync(venvPython, ['-m','piper','-m',VI_MODEL|EN_MODEL,'-c',VI_CFG|EN_CFG,'-f',tmpWav], { input: piperInput + '\n' })`. Chọn model theo `lang` (vi vs en). Model/cfg path từ `scripts/.piper-cache/`.
  4. ffmpeg: `execFileSync('ffmpeg', ['-y','-i',tmpWav,'-ac','1','-ar','22050','-b:a','48k', outMp3])`.
- **Sinh `src/audio/voiceClips.ts`** (đè mỗi lần, có header "tự sinh — đừng sửa tay"):
  ```ts
  // AUTO-GENERATED by scripts/build-voice-clips.mjs — DO NOT EDIT.
  import type { ClipIndex } from './prerecordedEngine';
  export const VOICE_CLIPS: ClipIndex = {
    'vi-VN|Giỏi quá!': '/voice/ab12cd34ef.mp3',
    // ...
  };
  ```
  Khoá = `${lang}|${text.trim()}` (chữ app gốc, KHÔNG phải piper-input). Sort khoá để diff ổn định.
- **Style:** theo `scripts/build-pwa-icons.mjs` — header doc-comment giải thích, `execFileSync`, `resolve(__dirname, ...)`, log `wrote <path>`. **Không** thêm vào `package.json` scripts/deps runtime (công cụ tay).

- [ ] **Step 1:** Viết `scripts/build-voice-clips.mjs` (enumerate DRY + remap + hash + idempotent + synth + ffmpeg + emit `voiceClips.ts`). Hằng path model + venvPython ưu tiên env override (`PIPER_VENV`, `PIPER_VI_MODEL`, `PIPER_EN_MODEL`) mặc định trỏ `scripts/.piper-cache/`.
- [ ] **Step 2:** Chạy `npx tsx scripts/build-voice-clips.mjs`. Kỳ vọng: ~143 mp3 ở `public/voice/`, `src/audio/voiceClips.ts` sinh ra. Kiểm tra: `ls public/voice | wc -l` ≈ 143; tổng `du -sh public/voice` ≈ 600 KB.
- [ ] **Step 3:** Chạy lại generator → log "skip (exists)" cho mọi clip (chứng minh idempotent), không sinh thừa.
- [ ] **Step 4:** Spot-check vài clip phát đúng (mở thủ công `public/voice/<hash của 'vi-VN|Giỏi quá!'>.mp3`).
- [ ] **Step 5: Commit** clip + index + generator.
  ```bash
  git add scripts/build-voice-clips.mjs public/voice/ src/audio/voiceClips.ts .gitignore
  git commit -m "feat(audio): generate pre-recorded Piper voice clips (GĐ5A)"
  ```

---

### Task 3: `prerecordedEngine.ts` + test (TDD)

**Files:** Create `src/audio/prerecordedEngine.ts`, `src/audio/prerecordedEngine.test.ts`.

**Interfaces:**
```ts
import type { SpeechEngine } from './speechEngine';
export type ClipIndex = Record<string, string>;            // `${lang}|${text.trim()}` -> mp3 URL
export interface AudioPlayer { play(url: string, onDone: () => void): () => void; } // trả cancel()
export function createPrerecordedEngine(
  clips: ClipIndex, fallback: SpeechEngine, player?: AudioPlayer,
): SpeechEngine;
```

**Hành vi `speak(text, lang, onDone)`:**
1. `key = lang + '|' + text.trim()`.
2. **Có `clips[key]`** → `player.play(clips[key], onDone)`; trả `cancel()`. KHÔNG chạm fallback.
3. **Không có** → `return fallback.speak(text, lang, onDone)` (trả cancel của fallback).
- **Bản `AudioPlayer` thật (mặc định)** dùng `new Audio(url)`: gọi `.play()` → `.catch(onDone)` (autoplay bị từ chối → onDone, không treo); `ended`/`error` → onDone (idempotent qua cờ `done`); `cancel()` = `audio.pause()` + onDone. Nếu `typeof Audio === 'undefined'` (jsdom) → no-op: gọi `onDone()` ngay, trả `() => {}`.
- `onDone` bắn **đúng một lần** mọi nhánh (cờ `done` trong player thật; engine không bọc thêm — `AudioManager.utter` đã lo idempotent ở tầng trên, nhưng player vẫn tự bảo vệ).

- [ ] **Step 1: Viết test thất bại** `src/audio/prerecordedEngine.test.ts`:
  - Tiêm `AudioPlayer` giả (ghi lại `url`, giữ `onDone` để gọi tay) + `SpeechEngine` fallback giả (spy `speak`).
  - **có clip** → `player.play` được gọi với đúng URL; fallback **không** được gọi; gọi player.onDone → engine onDone chạy.
  - **cancel** → trả về từ `speak` gọi được; làm player.cancel chạy & engine onDone chạy (idempotent — gọi 2 lần không lỗi).
  - **không clip** → `fallback.speak(text, lang, onDone)` được gọi đúng tham số; cancel uỷ quyền fallback.
  - **chuẩn hoá khoá:** `'  Giỏi quá! '` (thừa space) khớp `'vi-VN|Giỏi quá!'`; **tách lang**: cùng `text` khác `lang` (vd `'A'` vi vs en) tra 2 khoá khác nhau.
  - **player thật jsdom-safe:** gọi `createPrerecordedEngine(clips, fallback)` (không tiêm player) trong jsdom (`Audio` vắng) → `speak` gọi `onDone` ngay, không ném.
- [ ] **Step 2:** `npx vitest run src/audio/prerecordedEngine.test.ts` → FAIL (chưa có module).
- [ ] **Step 3:** Viết `src/audio/prerecordedEngine.ts` (như interface trên).
- [ ] **Step 4:** `npx vitest run src/audio/prerecordedEngine.test.ts` → PASS. `npx tsc -b` sạch.
- [ ] **Step 5: Commit**
  ```bash
  git add src/audio/prerecordedEngine.ts src/audio/prerecordedEngine.test.ts
  git commit -m "feat(audio): pre-recorded clip SpeechEngine + Web Speech fallback (GĐ5A)"
  ```

---

### Task 4: Coverage / anti-drift test `voiceClips.test.ts`

**Files:** Create `src/audio/voiceClips.test.ts`.

**Mục tiêu:** **khẳng định mọi `{lang, text}` HỮU HẠN mà app có thể đọc đều có khoá trong `VOICE_CLIPS`.** Thiếu → đỏ, nhắc chạy lại generator. (Cùng nguồn enumerate như generator → chống drift khi thêm nội dung mà quên thu.)

- [ ] **Step 1: Viết test** `src/audio/voiceClips.test.ts`:
  - Import `VOICE_CLIPS` + các nguồn nội dung thật (manifest, digits 1..10, `LETTERS`, `WORD_BANK` words, `ALPHABET`, `NUMBER_WORDS`, `COLORS`).
  - Dựng tập `expected` `{lang, text}` (CÙNG logic generator core — **trừ** tên nhóm/trò extra). Với mỗi → `expect(VOICE_CLIPS).toHaveProperty(\`${lang}|${text.trim()}\`)`.
  - Khẳng định **nội dung vô hạn loại trừ tường minh:** comment + (tuỳ chọn) test rằng tên-bé-tự-nhập KHÔNG có trong index (không cố thu).
  - Khẳng định mọi value URL khớp `^/voice/[0-9a-f]+\.mp3$`.
- [ ] **Step 2:** `npx vitest run src/audio/voiceClips.test.ts` → PASS (sau khi Task 2 đã sinh clip). Nếu đỏ vì thiếu khoá → chạy lại generator.
- [ ] **Step 3:** `npm test` → **toàn bộ 213 + 2 file mới XANH.**
- [ ] **Step 4: Commit**
  ```bash
  git add src/audio/voiceClips.test.ts
  git commit -m "test(audio): voice-clip coverage / anti-drift guard (GĐ5A)"
  ```

---

### Task 5: Tích hợp — `App.tsx` engine swap + PWA precache mp3

**Files:** Modify `src/App.tsx` (1 dòng), `vite.config.ts` (workbox glob).

- [ ] **Step 1: `App.tsx`** — thêm import `createPrerecordedEngine` + `VOICE_CLIPS`, đổi dòng `useMemo`:
  ```ts
  // trước:
  createAudioManager(createWebSpeechEngine(), createWebAudioSfxEngine(), AUDIO_MANIFEST)
  // sau:
  createAudioManager(
    createPrerecordedEngine(VOICE_CLIPS, createWebSpeechEngine()),
    createWebAudioSfxEngine(),
    AUDIO_MANIFEST,
  )
  ```
  *(Web Speech vẫn tạo — nay là fallback. `AudioManager` KHÔNG đổi.)*
- [ ] **Step 2: `vite.config.ts`** — thêm `mp3` vào `workbox.globPatterns`:
  ```ts
  globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,ico,woff2,mp3}'],
  ```
  (`maximumFileSizeToCacheInBytes` 3 MiB đã đủ — clip ≤ ~10 KB.)
- [ ] **Step 3:** `npx tsc -b` sạch; `npm run lint` sạch; `npm test` xanh (App không có test riêng — chỉ đảm bảo build types).
- [ ] **Step 4:** `npm run build` thành công. Kiểm precache: `dist/sw.js` / `workbox-*.js` liệt kê các `/voice/*.mp3`. Tổng precache ~1.9 MB (hiện) + ~0.6 MB giọng ≈ 2.5 MB — chấp nhận.
- [ ] **Step 5: Commit**
  ```bash
  git add src/App.tsx vite.config.ts
  git commit -m "feat(audio): wire pre-recorded voice engine + precache mp3 (GĐ5A)"
  ```

---

### Task 6: Bàn giao Phần A

**Files:** Modify `ROADMAP.md`, `.superpowers/sdd/progress.md`.

- [ ] **Step 1:** `ROADMAP.md` — đánh ✅ "Giai đoạn 5 / Phần A", ghi tổng test mới (213 + 2 file), ghi commit.
- [ ] **Step 2:** `.superpowers/sdd/progress.md` — ledger Phần A (task/commit/finding: bảng remap chữ Việt; digit-không-remap; 143 clip ~600 KB).
- [ ] **Step 3: Để lại manual-test TODO** (giọng chỉ verify ở trình duyệt thật) — theo spec §9:
  - `npm run build` + preview, **Chrome/Cốc Cốc macOS:** câu dẫn đọc **giọng Việt đúng** (hết lỗi giọng Anh); nhóm English đọc en-US; số/chữ/từ/màu đọc đúng từ clip; chữ Việt (Ă/Â/Đ/G/X…) đọc đúng **tên chữ**; tên bé (không clip) vẫn đọc qua Web Speech; **tắt mạng** vẫn đọc (precache); giọng không treo khi chen ngang; tắt giọng → im.
  - Kiểm thử với trẻ thật.
- [ ] **Step 4: Commit**
  ```bash
  git add ROADMAP.md .superpowers/sdd/progress.md
  git commit -m "docs: mark GĐ5A (neural voice) complete + manual-test TODO"
  ```

---

## Điều chỉnh spec đề xuất (xác nhận với chủ dự án)

1. **Digit Việt KHÔNG cần remap** — Piper-vi đọc "3"→"ba" gốc (spec §5 ngỏ khả năng phải feed "ba"; thực tế không cần). Generator feed thẳng digit.
2. **CẦN bảng remap chữ-cái-Việt → tên-chữ** (29 mục) — đây là chỗ `app-string ≠ piper-input` DUY NHẤT. Spec §4 nên ghi rõ bảng này (đã liệt kê trong plan §"Khám phá").
3. **Tên nhóm (6) + tên trò (16) hiện CHƯA được runtime đọc** (chỉ Phần E mới đọc nút). Plan vẫn thu sẵn (extra) nhưng **loại khỏi coverage-test bắt buộc**; coverage chỉ ép 121 clip "app-đọc-được-ngay". Tránh test đỏ vì nội dung chưa ai gọi.
4. **Tổng clip ~143, ~600 KB** (không phải 1–1.5 MB như spec §5/§10 ước) — precache nhẹ hơn dự kiến.
5. **Khoá clip = `entry.text` (không phải manifest `key`)** — vì `AudioManager.speak(key)` truyền `entry.text` xuống engine. Generator & index dùng text, không dùng key. (Spec §3.2 ví dụ `'vi-VN|Giỏi quá!'` đã đúng tinh thần này — nhấn mạnh để khỏi nhầm.)
6. **Piper qua venv** (`scripts/.piper-cache/venv/`) vì macOS Homebrew Python là "externally-managed" (PEP 668) — `pip install piper-tts` trực tiếp bị chặn. Generator nên trỏ `venv/bin/python -m piper` (env-overridable).
