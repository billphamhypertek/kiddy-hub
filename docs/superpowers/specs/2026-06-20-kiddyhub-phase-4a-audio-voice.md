# KiddyHub — Giai đoạn 4 · Phần A: Giọng đọc + âm thanh (Phase 4A Design)

> **Trạng thái:** Đã duyệt thiết kế (2026-06-20). Spec triển khai: **Giai đoạn 4 — Phần A (Giọng đọc Việt/Anh + âm thanh, 100% chạy cục bộ).**
> **Bản thiết kế tổng:** [`2026-06-19-kiddyhub-design.md`](./2026-06-19-kiddyhub-design.md).
> **Tiền lệ GĐ2 / GĐ3:** [`2026-06-19-kiddyhub-phase-2-design.md`](./2026-06-19-kiddyhub-phase-2-design.md) · [`2026-06-20-kiddyhub-phase-3-design.md`](./2026-06-20-kiddyhub-phase-3-design.md).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — mục "Giai đoạn 4" + "Nợ kỹ thuật".

---

## 1. Mục tiêu Phần A

Tới hết GĐ3, app chạy **im lặng hoàn toàn**: mọi voice key trong `src/audio/audioManifest.ts` ánh xạ chuỗi rỗng `''`, và `AudioManager` coi `''` là no-op. Phần A của GĐ4 bật **giọng đọc thật + âm thanh hiệu ứng (SFX)** mà **không cần file âm thanh, không mạng, không API key** — dùng **Web Speech API** (`speechSynthesis`) cho giọng và **Web Audio API** (tổng hợp oscillator) cho SFX. Mọi thứ chạy 100% cục bộ, đúng triết lý local-only của KiddyHub.

Phần A cũng trả **3 món nợ kỹ thuật** đã ghi ở ROADMAP:

1. `speak()` phải **resolve khi dừng/lỗi**, không chỉ khi clip kết thúc (`end`) — clip bị giọng mới chen vào (`cancel`) trước đây treo promise mãi.
2. **Gắn giọng cho các màn menu** (WhoIsPlaying / AdventureMap / CategoryScreen) — trước đây chỉ trong trò chơi mới có giọng.
3. **Đọc nội dung động** ("giọng Việt/Anh bản cuối"): các trò mà *nội dung chính là bài học* (từ tiếng Anh, chữ cái, con số) phải đọc đúng giá trị đang hiển thị, đúng ngôn ngữ bản ngữ.

> **Ngoài phạm vi Phần A:** đồ hoạ AI bản cuối, trò #10 "Tìm Điểm Khác", hoạt ảnh/hiệu ứng nâng cao — để các phần sau của GĐ4.

## 2. Ranh giới — KHÔNG đụng tới gì

- **Logic trò chơi** (`*Logic.ts`) và `progression.ts` / `applyCompletion.ts` / `registry.ts` — không đổi.
- **Lớp dữ liệu** (`src/data/*`), router màn (`src/state/screens.ts`), khu phụ huynh.
- **Toggle âm thanh/giọng** trong cài đặt (`getSettings` → `audio.setSoundOn/setVoiceOn`) — giữ nguyên cách App đọc cài đặt; mọi giọng/SFX mới phải **tôn trọng toggle này**.
- **Giao diện công khai của `AudioManager`** (`playSfx` / `speak` / `stopVoice` / `setSoundOn` / `setVoiceOn`) — giữ ổn định; chỉ **thêm** `speakText` và **đổi cách dựng** (constructor + dạng manifest).
- **Hạ tầng test:** giữ alias `phaser → src/test/phaser-stub.ts` trong `vite.config.ts`. Web Speech / Web Audio **không tồn tại** trong jsdom → test phải **tiêm engine giả** (như `AudioManager.test.ts` hiện tiêm `PlayFn` giả), **không** gọi engine thật.

## 3. Kiến trúc engine có thể tiêm (injectable)

Tách phần "đọc/kêu thật" ra khỏi `AudioManager` thành **hai engine** có interface rõ, để test tiêm bản giả còn app tiêm bản thật.

### 3.1 `src/audio/speechEngine.ts`

```ts
export interface SpeechEngine {
  // Đọc `text` bằng giọng `lang`; gọi onDone khi xong HOẶC lỗi.
  // Trả về handle cancel() để dừng sớm.
  speak(text: string, lang: string, onDone: () => void): () => void;
}
export function createWebSpeechEngine(): SpeechEngine;
```

- Bản thật dùng `window.speechSynthesis` + `SpeechSynthesisUtterance`.
- Chọn giọng khớp `lang` (`vi-VN` / `en-US`). **Giọng nạp bất đồng bộ** → xử lý `voiceschanged`: nạp danh sách giọng lười (lazy), khớp theo tiền tố `lang`, nếu không có thì để mặc định (đặt `utt.lang` rồi để trình duyệt tự chọn) — không vỡ.
- `onDone` phải bắn ở **cả `end` lẫn `error`** (đây là điểm trả nợ kỹ thuật #1).
- `cancel()` gọi `speechSynthesis.cancel()`. Nếu `speechSynthesis` không tồn tại (ví dụ môi trường lạ), engine no-op an toàn: gọi `onDone()` ngay và trả `cancel` rỗng.

### 3.2 `src/audio/sfxEngine.ts`

```ts
export interface SfxEngine {
  play(name: string): void; // tap | correct | wrong | star
}
export function createWebAudioSfxEngine(): SfxEngine;
```

- Bản thật dùng Web Audio API: **một `AudioContext` tạo lười** (lazy, khi `play` lần đầu), `resume()` trước khi phát để vượt chính sách autoplay của trình duyệt.
- Tổng hợp blip ngắn dễ thương bằng `OscillatorNode` + `GainNode` (envelope tắt dần), **không file**:
  - `tap` — click ngắn (sine ~600 Hz, ~0.08 s).
  - `correct` — hai nốt đi lên vui tai (ví dụ ~660 → ~880 Hz).
  - `wrong` — tiếng "ò" trầm nhẹ (square/saw tần thấp ~160 Hz, ngắn, không gắt).
  - `star` — lấp lánh (vài nốt cao nối tiếp ~880/1175/1568 Hz).
- Tên không nhận diện → no-op. Nếu `AudioContext` không tồn tại → no-op an toàn.

## 4. Refactor `src/audio/AudioManager.ts`

Giữ interface công khai; đổi **constructor** và **dạng manifest**.

```ts
export interface VoiceEntry { text: string; lang: string }
export interface AudioManifest {
  voices: Record<string, VoiceEntry>;
  sfx: string[]; // tập tên SFX hợp lệ
}
export function createAudioManager(
  speech: SpeechEngine,
  sfx: SfxEngine,
  manifest: AudioManifest,
): AudioManager;
```

- `speak(key)`: tra `{text, lang}`. Nếu **`voiceOff` hoặc key thiếu** → **resolve ngay**. Ngược lại: hủy giọng hiện tại (preempt), rồi `speech.speak(text, lang, resolve)`. Promise **resolve khi xong, khi bị preempt/hủy, và khi off/thiếu** — **không bao giờ treo** (nợ kỹ thuật #1). Cách làm: bọc resolve idempotent; khi một `speak` mới chen vào, gọi `cancel()` của cái cũ → cái cũ resolve.
- **`speakText(text: string, lang = 'vi-VN'): Promise<void>`** — đọc nội dung động, cùng ngữ nghĩa resolve. Nếu `voiceOff` hoặc `text` rỗng → resolve ngay.
- `playSfx(name)`: nếu `soundOn` thì `sfx.play(name)`; nếu `soundOff` thì bỏ qua.
- `stopVoice()`: hủy giọng đang đọc (và resolve promise của nó).
- `setSoundOn` / `setVoiceOn`: giữ nguyên.

> **Một biến `cancelCurrent` duy nhất** theo dõi giọng đang đọc cho cả `speak` lẫn `speakText`, để giọng mới (dù từ key hay text) luôn ngắt giọng cũ sạch sẽ.

## 5. `src/audio/audioManifest.ts` — lời thoại tiếng Việt thật

Thay mọi `''` bằng `{ text, lang }`. Tất cả `lang: 'vi-VN'` (nội dung tiếng Anh được đọc **động** qua `speakText`, xem §6, nên prompt EN trong manifest vẫn là câu dẫn tiếng Việt). Lời ấm áp, ngắn, hợp trẻ 3–5:

| key | text |
|---|---|
| `counting.prompt` | "Đếm xem có mấy bạn nào!" |
| `letter.prompt` | "Tìm đúng chữ cái nhé!" |
| `pattern.prompt` | "Chuỗi tiếp theo là hình gì nào?" |
| `firstwords.prompt` | "Chạm vào hình đúng với từ nhé!" |
| `memory.prompt` | "Lật tìm hai hình giống nhau nào!" |
| `jigsaw.prompt` | "Ghép các mảnh thành bức tranh nhé!" |
| `moreless.prompt` | "Bên nào nhiều hơn nào?" |
| `firstletter.prompt` | "Chữ cái đầu tiên là chữ gì?" |
| `oddoneout.prompt` | "Tìm bạn khác với các bạn còn lại nhé!" |
| `abc.prompt` | "Nghe và chạm đúng chữ nào!" |
| `numbersen.prompt` | "Nghe và chạm đúng số nhé!" |
| `shapecolor.prompt` | "Chạm đúng hình hoặc màu nào!" |
| `colorsen.prompt` | "Nghe và chạm đúng màu nhé!" |
| `matchquantity.prompt` | "Kéo số vào đúng nhóm nào!" |
| `sorting.prompt` | "Phân loại các bạn vào đúng giỏ nhé!" |
| `feedback.correct` | "Giỏi quá!" |
| `feedback.tryagain` | "Thử lại nhé!" |
| `reward.cheer` | "Tuyệt vời, con được thưởng sao!" |
| `who.title` | "Ai đang chơi nào?" |

`sfx`: `['tap', 'correct', 'wrong', 'star']`.

## 6. Đọc nội dung động (giọng Việt/Anh bản cuối)

Thêm `speakText` vào **`GameHost`** (`src/games/GameModule.ts`) và nối qua `createGameHost` (`src/games/GameHost.ts`) tới `audio.speakText`. Sau đó **chỉ** các scene mà nội dung *là* bài học mới đọc giá trị thật (giữ thay đổi tối thiểu, không phá guard `roundResolved`/`finished`):

- **Nhóm Tiếng Anh** đọc bản ngữ `en-US`:
  - `first-words` → `speakText(target.word, 'en-US')`.
  - `abc-english` → `speakText(target, 'en-US')` (chữ cái).
  - `numbers-english` → `speakText(word, 'en-US')` (đọc chữ "seven", không phải số).
  - `colors-english` → `speakText(target.name, 'en-US')`.
- **`counting-fun`** → `speakText(String(count), 'vi-VN')` (đọc số đếm tiếng Việt).
- **Trò chữ cái** đọc chữ đích tiếng Việt:
  - `letter-spotting` → `speakText(target, 'vi-VN')`.
  - `first-letter` → `speakText(entry.letter, 'vi-VN')`.

Cách nối: ở mỗi scene, sau câu dẫn tĩnh `speak(...prompt)`, thêm một lời đọc nội dung. Nút loa 🔊 cũng đọc lại nội dung động (ngoài câu prompt). Các scene còn lại **giữ nguyên** chỉ dùng `speak(key)` tĩnh.

## 7. Gắn giọng vào màn menu (nợ kỹ thuật #2)

App tạo `audio` ở `App.tsx` (~dòng 131) và truyền xuống `GameContainer`. Truyền **`AudioManager`** (hoặc hàm `speak`) xuống ba màn menu theo **prop tùy chọn** (đơn giản, không cần context mới; prop optional để các test component hiện có — render không truyền audio — vẫn xanh):

- **WhoIsPlaying**: `speak('who.title')` khi mount; chạm avatar → `speakText(name)` (tiếng Việt) rồi `onSelect`.
- **AdventureMap**: chạm đảo → `speakText(category.title)` rồi `onCategory`.
- **CategoryScreen**: chạm thẻ trò → `speakText(game.title)` rồi `onPlay`.

Tôn trọng toggle giọng/âm hiện có (chính `AudioManager` đã chặn khi `voiceOff`). Vì prop optional, mọi lời gọi bọc `audio?.speak?.(...)`.

## 8. Cập nhật `App.tsx` + dọn Howler

- `App.tsx` (~dòng 131): dựng `createAudioManager(createWebSpeechEngine(), createWebAudioSfxEngine(), AUDIO_MANIFEST)`.
- Truyền `audio` xuống ba màn menu (§7).
- **Xóa `src/audio/howlerPlayer.ts`** và mọi import của nó (Howler không còn dùng cho giọng). **Giữ nguyên** dependency `howler` trong `package.json` (chỉ ngừng import).

## 9. Kiểm thử

- **`src/audio/AudioManager.test.ts`** viết lại theo dạng tiêm `SpeechEngine`/`SfxEngine` giả, phủ:
  - `speak` resolve khi engine gọi `onDone`.
  - `speak` resolve khi bị **preempt/cancel** (giọng mới chen vào → giọng cũ resolve, `cancel` cũ được gọi).
  - `speak` resolve **ngay** khi `voiceOff` hoặc key thiếu (không gọi engine).
  - `speakText(text, lang)` đọc text đúng lang; resolve ngay khi `voiceOff`/text rỗng.
  - `playSfx` gọi engine khi `soundOn`, bỏ qua khi `soundOff`.
  - `stopVoice` hủy giọng đang đọc và resolve promise.
- **Test manifest mới:** mọi voice entry trong `audioManifest.ts` có `text` không rỗng và `lang` hợp lệ (`vi-VN` / `en-US`).
- **`GameHost.test.ts`:** thêm khẳng định `speakText` route tới `audio.speakText`.
- Giữ **toàn bộ test còn lại xanh** (hiện 138). Không bỏ setup phaser-stub.

## 10. Bàn giao Phần A

- Cập nhật `ROADMAP.md`: đánh ✅ "giọng đọc Việt/Anh" + "menu có giọng" + "speak resolve-on-stop"; ghi tổng test mới.
- Cập nhật ledger SDD `.superpowers/sdd/progress.md`.
- **Kiểm thử thủ công (chỉ verify được trong `npm run dev`, trình duyệt thật):** giọng tiếng Việt đọc câu dẫn; nhóm Tiếng Anh đọc bản ngữ `en-US`; SFX blip kêu (tap/correct/wrong/star); ba màn menu nói khi mount/chạm; giọng **không treo** khi bị chen ngang; `AudioContext.resume()` chạy sau cú chạm đầu (autoplay).

## 11. Rủi ro & quyết định

- **Web Speech phụ thuộc giọng OS:** chất lượng giọng `vi-VN`/`en-US` tùy hệ điều hành; nếu thiếu giọng `vi-VN`, trình duyệt đọc bằng giọng mặc định (có thể sai âm) — chấp nhận ở Phần A, có thể nâng cấp TTS thu sẵn ở phần sau nếu cần. Đây là lý do tách `SpeechEngine` ra interface: dễ thay bản thật sau này.
- **Autoplay policy:** `AudioContext` và `speechSynthesis` chỉ chạy sau tương tác người dùng → blip/giọng đầu màn "Ai đang chơi" có thể câm tới cú chạm đầu; chấp nhận được (trẻ luôn chạm để chơi).
- **Không file, không mạng:** giữ đúng local-only; Docker/nginx không cần thêm asset.
