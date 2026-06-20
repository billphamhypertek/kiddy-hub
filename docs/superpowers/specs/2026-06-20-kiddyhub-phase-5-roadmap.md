# KiddyHub — Giai đoạn 5 "Full-Fledged" · Bản đồ tổng (Phase 5 Master Roadmap)

> **Trạng thái:** Đã duyệt phân rã (2026-06-20). Đây là **kim chỉ nam GĐ5** — phân rã "full-fledged" thành 5 phần độc lập A→E, mỗi phần có **spec + plan + sub-agent riêng**, làm tuần tự như GĐ4 (A–F).
> **Bản thiết kế tổng:** [`2026-06-19-kiddyhub-design.md`](./2026-06-19-kiddyhub-design.md).
> **Theo dõi tiến độ:** [`/ROADMAP.md`](../../../ROADMAP.md) — mục "Giai đoạn 5".
> **Cơ sở nghiên cứu:** tổng hợp best-practice EdTech mầm non 2024–2026 (Four Pillars / Hirsh-Pasek; mastery learning; spaced repetition — Mrs Wordsmith, Language Gems, ERIC; ethical engagement — UX Magazine; accessibility — WCAG/accessibility.com/Perkins; AAP screen-time). Xem §3.

---

## 1. Bối cảnh & mục tiêu

Hết GĐ4, KiddyHub là một **MVP hoàn chỉnh**: 16 trò / 6 nhóm, giọng đọc Việt/Anh (Web Speech), đồ hoạ SVG + linh vật Cáo, hoạt ảnh, tách bundle (−84% tải đầu), PWA offline, 213 test xanh. Về mặt **cấu trúc đạo đức**, sản phẩm đã đứng đúng phía của gần như mọi "đường nứt" mà EdTech mầm non 2024–2026 bị phê phán: **offline 100%, không quảng cáo, không thu thập dữ liệu, hợp tác (không leaderboard cạnh tranh), không "thua", voice-first**. Đây là lợi thế cạnh tranh thật — GĐ5 **không** sửa nền tảng, mà **đào sâu** ba trục giá trị:

1. **Chiều sâu học tập** — biến "gây vui" thành "thật sự dạy" (lặp lại ngắt quãng + phản hồi gợi-ý-dạy).
2. **Giá trị cho phụ huynh** — dashboard quanh *mastery* (không phải "phút đã chơi") + tổng kết tuần + cầu nối đời thực.
3. **Mạch trải nghiệm liền lạc, cuốn hút & hoà nhập** — không đứt gãy, kích thích bé tham gia, tiếp cận cho mọi trẻ; trên nền **giọng đọc bản cuối** chạy mọi trình duyệt.

**Tiêu chí "full-fledged" (DoD toàn GĐ5):** một bé mới mở app lần đầu được dẫn dắt mượt mà; mỗi lượt chơi *dạy* được điều gì đó và nhớ lâu hơn (SR); sai được *gợi ý dạy* chứ không chỉ "thử lại"; phụ huynh mở khu của mình thấy *bé đang giỏi gì / cần luyện gì / chơi gì ngoài đời*; toàn bộ hành trình liền mạch, dễ thương, và chơi được với trẻ khiếm khuyết vận động/thị giác/chú ý.

## 2. Năm phần của Giai đoạn 5

Mỗi phần là một hệ con độc lập (1 spec + 1 plan + 1 sub-agent), tuân thủ **Ranh giới chung** (§6) và kết thúc bằng review → fix → test/build/lint sạch → commit & push → cập nhật tiến độ.

### Phần A — Giọng đọc neural bản cuối *(nền tảng)*

- **Vì sao:** voice-first là cốt lõi (bé chưa đọc). Nhưng **Chrome / Cốc Cốc / Edge trên macOS không expose giọng `vi-VN`** cho `speechSynthesis` → đọc tiếng Việt bằng *giọng tiếng Anh* (lỗi chất lượng cốt lõi đã ghi nhận ở GĐ4A). macOS chỉ có giọng "Linh" compact (robot). Đây là nền cho **mọi giọng** ở B (gợi ý dạy), D (Cáo nói), E (đọc điều hướng).
- **Phạm vi:** thu sẵn **bộ câu manifest cố định** + **nội dung động hữu hạn** (số 0–20, 29 chữ cái Việt gồm Ă Â Ê Ô Ơ Ư Đ, bảng chữ + số + màu + từ vựng tiếng Anh đang dùng) bằng **neural TTS** một lần lúc build; đóng gói audio nén; runtime **offline, chạy mọi trình duyệt**. Tận dụng đúng `SpeechEngine` interface đã tách ở GĐ4A — thêm một engine "audio thu sẵn" + fallback Web Speech khi thiếu clip.
- **Quyết định chờ chốt:** **nguồn TTS** (xem §5 — Piper local / Azure / Google / ElevenLabs). Ảnh hưởng licensing, chất lượng, có cần mạng lúc build hay không.
- **Chạm vào:** `src/audio/speechEngine.ts` (+ engine mới), `AudioManager` (chọn clip theo key/nội dung động, fallback), pipeline build (script sinh + manifest clip), `public/` hoặc asset bundle, có thể SW precache.
- **Ngoài phạm vi:** đổi nội dung lời thoại; nội dung động *vô hạn* (tên bé tự đặt vẫn đọc qua Web Speech fallback).
- **DoD:** mọi câu manifest + nội dung động hữu hạn phát đúng giọng Việt/Anh **trong Chromium** (không chỉ Safari); offline; runtime không gọi mạng; fallback an toàn khi thiếu clip; test tiêm engine giả vẫn xanh.

### Phần B — Chiều sâu học tập *(linh hồn giáo dục)*

- **Vì sao:** đòn bẩy biến "engagement → learning" lớn nhất (Four Pillars; Springer 2024). Lặp lại ngắt quãng tăng ghi nhớ tới ~200% so với học dồn.
- **Phạm vi:**
  - **Mô hình mastery từng-mục** (Dexie, §4): theo dõi từng *mục học* (chữ cái, từ EN, số, hình, màu…) cho từng bé — số lần gặp/đúng, hộp Leitner, hạn ôn `dueAt`.
  - **Lập lịch lặp lại ngắt quãng:** khi chọn nội dung một lượt, ưu tiên đưa lại "mục đến hạn" theo khoảng giãn dần (vd 1 ngày → 3 ngày → 1 tuần → 2 tuần). Áp cho các trò có "mục học" rời rạc (chữ/số/từ/hình/màu).
  - **Phản hồi gợi-ý-dạy (scaffolding):** sai → **giảm số lựa chọn** (bớt nhiễu) + **gợi ý có giọng giải thích vì sao**; làm tốt lại → "rút giàn giáo" (khôi phục lựa chọn). Thay cho feedback chỉ-rung-"thử lại" hiện tại.
- **Chạm vào:** lớp `src/data/*` (bảng mastery + repo + test), `src/games/GameModule.ts`/`GameHost.ts` (API gợi ý/chọn-mục), logic chọn nội dung của các trò có mục học rời rạc, `audioManifest` (câu gợi ý).
- **Ngoài phạm vi:** đổi cơ chế cốt lõi từng trò; áp SR cho trò không có "mục" rời rạc (vd ghép hình, tìm điểm khác — chỉ ghi mastery kỹ năng tổng).
- **DoD:** mục đã thạo thưa dần, mục hay sai quay lại sớm; sai lần 1 → giảm lựa chọn + gợi ý giọng; dữ liệu mastery bền qua reload; logic thuần có test; **không phá** guard `roundResolved`/`finished`.

### Phần C — Bảng phụ huynh 2.0 *(giá trị cho người mua)*

- **Vì sao:** phụ huynh là người mua; họ coi trọng *educational value* nhưng "phút đã chơi" là vanity metric. Tín hiệu thật là *% thạo một kỹ năng* + *điều nên luyện tiếp* + *cầu nối đời thực*. Tổng kết tuần là tính năng giữ chân & được hành động nhiều nhất.
- **Phạm vi:** (tiêu thụ dữ liệu mastery của B)
  - **Dashboard mastery từng bé:** "Đã thạo / Đang lên / Nên luyện tiếp" theo từng kỹ năng (đếm, nhận chữ, từ EN, hình, màu…), ngôn ngữ đời thường — không mã chuẩn.
  - **Thẻ tổng kết tuần** trên máy mỗi bé (số mục mới thạo, từ vựng nhớ, xu hướng tập trung/độ chính xác tap).
  - **Gợi ý chơi ngoài đời** kèm mỗi insight ("Bé giỏi hình rồi — thử đi săn hình tròn quanh nhà").
  - **Quyền riêng tư là tính năng hiển thị** ("offline, không quảng cáo, không gửi dữ liệu") + **nhắc dùng lành mạnh** dịu nhẹ (theo AAP ≤1h/ngày): nhắc "đến giờ ra chơi ngoài đời", không ép, không đếm-tội.
- **Chạm vào:** `src/components/parent/*`, đọc bảng mastery (B), `src/data/*` (truy vấn tổng hợp), nội dung gợi ý (bảng tra kỹ năng → hoạt động đời thực).
- **Ngoài phạm vi:** xuất/in báo cáo; biểu đồ phức tạp; bất kỳ thứ gì rời máy.
- **DoD:** phụ huynh mở khu của mình thấy mỗi bé giỏi gì / nên luyện gì + 1 gợi ý đời thực; thẻ tuần sinh trên máy; không có metric "phút đã chơi" kiểu khoe; mọi tính toán cục bộ; có test.

### Phần D — Mạch chơi liền lạc & gắn kết *(cuốn hút, không đứt gãy)*

- **Vì sao:** trục bạn nhấn mạnh nhất — "mọi thứ mượt, không đứt gãy, kích thích bé tham gia". Gắn kết phải **lành mạnh**: phục vụ mục tiêu của *bé*, không phải DAU; tránh streak gây lo âu (loss-aversion), FOMO, autoplay, thông báo thúc ép (UX Magazine).
- **Phạm vi (có thể tách D1 mạch/flow + D2 gắn kết khi lập plan):**
  - **Onboarding lần đầu** dịu dàng (Cáo dẫn bé/phụ huynh qua bước tạo hồ sơ → chọn avatar → vào trò đầu).
  - **Điều hướng không đứt gãy / không ngõ cụt:** mọi màn đều có lối "tiếp theo" rõ; loading/empty states mượt (Phaser tải lần đầu, chưa có hồ sơ, chưa có sao…); chuyển cảnh liền mạch (mở rộng nền GĐ4D).
  - **Đà chơi:** cuối lượt gợi ý "chơi tiếp" hợp lý (mục đến hạn của B / trò cùng nhóm), giảm ma sát quay lại.
  - **"Cuộc phiêu lưu hôm nay":** mỗi ngày Cáo gợi ý 2–3 trò (ưu tiên mục đến hạn từ B); **bỏ ngày không phạt**, không đếm-streak gây áp lực — khung "routine" thay vì "streak".
  - **Cáo bạn đồng hành sâu hơn:** chào, cổ vũ, làm mẫu — ấm áp, *không bao giờ* hờn dỗi/thúc ép.
  - **Sưu tập gắn mastery thật:** bộ *hoàn thành được* (sticker-book / vườn sao mọc phong phú) gắn mốc mastery, không grind vô tận.
  - **Nối đời thực cuối lượt** (giao với C): "đếm thử 3 món đồ thật nhé".
- **Chạm vào:** `src/App.tsx` (luồng/onboarding — lưu ý không có test coverage, dùng `selectScreen` thuần), `src/components/*` (màn menu, loading/empty), `src/motion/*` (chuyển cảnh), Cáo (`src/art/fox.ts`), vườn sao/sưu tập (`src/data` + `src/components/StarGarden`), đọc mục-đến-hạn của B.
- **Ngoài phạm vi:** mọi cơ chế thúc ép (streak phạt, đếm ngược, autoplay, thông báo đẩy) — **cấm** theo triết lý.
- **DoD:** bé mở app lần đầu được dẫn tới lượt chơi đầu không lạc; không màn nào là ngõ cụt; có "phiêu lưu hôm nay" + "chơi tiếp"; sưu tập gắn mastery; **không** dark-pattern; chuyển cảnh mượt; tôn trọng reduced-motion.

### Phần E — Tiếp cận & hoà nhập *(quét polish cuối)*

- **Vì sao:** ~15% người dùng có nhu cầu tiếp cận; nhiều cải tiến giúp *mọi* trẻ. Có **lỗi tiếp cận thật** trong code: 2 trò màu/hình mã hoá ý nghĩa **chỉ bằng màu**.
- **Phạm vi:**
  - **An toàn mù màu:** trò màu/hình không bao giờ chỉ dựa vào màu — thêm hình/hoạ-tiết/nhãn + tương phản cao (WCAG).
  - **Chế độ êm (calm mode):** giảm hoạt ảnh + giảm nhiễu thị giác (mở rộng nền `prefers-reduced-motion` thành tuỳ chọn rõ trong cài đặt) cho bé nhạy cảm/ADHD/ASD.
  - **Đọc giọng cho mọi nút điều hướng** (tận dụng Phần A) — không nút nào "câm".
  - **Thuận tay trái / vùng chạm rộng & bao dung** (rà lại các trò kéo-thả).
- **Chạm vào:** logic/scene trò màu/hình (`shapes-colors`, `colors-english`), cài đặt (`src/data/settings.ts` + khu phụ huynh), các màn menu (đọc nút), rà drag.
- **Ngoài phạm vi:** chứng nhận WCAG đầy đủ cho web phức tạp; đọc màn hình toàn cục.
- **DoD:** trò màu/hình phân biệt được khi mù màu; có toggle "chế độ êm"; mọi nút điều hướng đọc được; bố cục không cố định một bên; có test cho phần logic đổi.

## 3. Nguyên tắc dẫn đường (cơ sở nghiên cứu)

Mọi phần GĐ5 phải nhất quán với các nguyên tắc đã có cơ sở:

- **Dạy, không chỉ vui** (Four Pillars: active / engaged / meaningful / social). Hiệu ứng phải *phục vụ* mục tiêu, không phân tán; tránh thưởng vặt vô nghĩa làm xói động lực nội tại.
- **Phản hồi phải *dạy*** — scaffolding (giảm lựa chọn + gợi ý vì sao), không chỉ verify đúng/sai.
- **Lặp lại ngắt quãng** cho mục rời rạc (chữ/số/từ/màu/hình); ôn theo khoảng giãn dần.
- **Mastery > thời lượng** — đo *% thạo*, không "phút đã chơi".
- **Gắn kết lành mạnh** — không streak phạt, không FOMO, không autoplay, không thông báo thúc ép, không lịch thưởng biến thiên kiểu máy đánh bạc; routine dịu thay vì đếm-streak; sưu tập *hoàn thành được* gắn mastery.
- **Cáo là bạn đồng hành ấm áp** — cổ vũ & làm mẫu, không nài ép/đe doạ ("quay lại không Cáo buồn" = dark pattern, **cấm**).
- **Nối đời thực** — chuyển học trên màn thành chuyển giao ngoài đời + gợi ý chơi cùng phụ huynh.
- **Tiếp cận là mặc định** — không mã hoá ý nghĩa chỉ bằng màu; vùng chạm lớn bao dung; không hẹn giờ; chế độ êm; mọi điều hướng có giọng.
- **Sức khoẻ số** — thiết kế *cho* phiên ngắn (≤10–15') và *hỗ trợ* phụ huynh đồng hành theo AAP ≤1h/ngày; app là *bổ trợ*, không phải giữ trẻ.

## 4. Mô hình dữ liệu mới (B & C dùng chung)

GĐ5 thêm tầng "mastery từng-mục" trên nền Dexie hiện có (không phá schema cũ). Phác thảo (chốt chi tiết ở spec Phần B):

```ts
// itemMastery — trạng thái thạo & lặp-lại-ngắt-quãng theo (bé × mục học)
{
  id, profileId,
  skillId,        // 'letter-vi' | 'word-en' | 'number' | 'shape' | 'color-en' | ...
  itemKey,        // 'Ă' | 'cat' | 7 | 'circle' | 'red' | ...
  seenCount, correctCount,
  box,            // hộp Leitner / mức SR (0..N)
  dueAt,          // mốc ôn kế tiếp (ms)
  lastResult,     // 'correct' | 'wrong'
  masteredAt?     // mốc đạt "đã thạo"
}
```

- **Phần B** ghi/đọc bảng này (cập nhật sau mỗi câu, chọn mục đến hạn).
- **Phần C** tổng hợp đọc-only (mastered / emerging / practice-next theo `skillId`).
- Truy cập qua repository hàm thuần như các bảng khác (`src/data/*`), có test, **không** đụng `progress`/`starEvents`/`garden` cũ (chỉ thêm bảng + bump version Dexie).

## 5. Quyết định nguồn TTS cho Phần A

Cần chốt **một** nguồn để thu sẵn giọng. Tiêu chí: chất lượng giọng Việt, licensing cho phép bundle audio, và mức phụ thuộc mạng *chỉ lúc build* (runtime luôn offline).

| Nguồn | Local? | Chất lượng Việt | Chi phí / tài khoản | Ghi chú |
|---|---|---|---|---|
| **Piper TTS** (rhasspy, local) | ✅ chạy ngay trên máy build | Khá (có giọng `vi_VN`) | Miễn phí, mã nguồn mở, **không tài khoản** | On-brand "local 100%": build cũng không cần mạng |
| **Azure** `vi-VN-HoaiMyNeural` | ❌ gọi API lúc build | Rất tốt (neural) | Cần tài khoản Azure + key; free tier có | Giọng Việt mượt nhất nhóm |
| **Google** Wavenet `vi-VN` | ❌ API lúc build | Rất tốt | Cần GCP + key | Tương đương Azure |
| **ElevenLabs** | ❌ API lúc build | Tốt, tự nhiên | Cần tài khoản, hạn free thấp | Linh hoạt giọng |

> Khuyến nghị mặc định để giữ triết lý **local-only kể cả lúc build**: **Piper**; nếu ưu tiên độ mượt giọng và chấp nhận gọi API *một lần* lúc build thì **Azure HoaiMyNeural**. Quyết định cuối thuộc về chủ dự án (liên quan tài khoản/chi phí). Dù chọn nguồn nào, **runtime vẫn offline** vì chỉ bundle file đã thu.

## 6. Ranh giới chung (KHÔNG được phá — mọi phần)

- **Local-only & riêng tư tuyệt đối:** không server, không tài khoản online, không gửi dữ liệu trẻ ra ngoài, runtime offline. (TTS nếu dùng cloud thì **chỉ lúc build**.)
- **Logic & guard trò chơi:** `*Logic.ts`, `progression.ts`, `applyCompletion.ts`, `registry.ts`, guard `roundResolved`/`finished`, drag-snap/hit-area — không phá. Thay đổi hành vi học (B) phải đi qua test logic thuần.
- **Triết lý trẻ thơ:** không "thua", không hẹn giờ gây áp lực, không dark-pattern. Vùng chạm lớn, phản hồi dịu.
- **Hạ tầng test:** giữ alias `phaser → src/test/phaser-stub.ts`; Web Speech/Web Audio/`matchMedia` vắng trong jsdom → engine/hook phải jsdom-safe & tiêm được bản giả. Scene Phaser chỉ kiểm thử thủ công (`npm run dev`).
- **Plugin pattern:** thêm trò qua `GameModule` registry; GĐ5 chủ yếu *bồi đắp* hệ chung, không đẻ trò mới.

## 7. Thứ tự, phụ thuộc & cách điều phối

**Thứ tự đề xuất: A → B → C → D → E.**

- **A trước:** nền cho mọi giọng (gợi ý B, Cáo D, đọc nút E) + sửa lỗi cốt lõi + có quyết định chờ.
- **B trước C:** C tiêu thụ bảng mastery của B.
- **D** sau C (dùng mục-đến-hạn của B cho "phiêu lưu hôm nay" & "chơi tiếp"); *có thể đảo lên ngay sau A nếu muốn thấy "cuốn hút" sớm* — đánh đổi: phần curation phải tạm thời không dựa SR.
- **E** quét cuối, cross-cutting.

**Điều phối (orchestrator = luồng chính, giữ quyết định & tóm tắt; sub-agent làm phần nặng):** mỗi phần chạy chu trình đã chuẩn hoá qua GĐ1–4:

1. **Brainstorm/spec** phần (chốt cơ chế & quyết định mở) → ghi spec `docs/superpowers/specs/2026-06-…-phase-5<x>-*.md`.
2. **writing-plans** → plan checkbox.
3. **sub-agent implement** (TDD cho logic thuần) → **sub-agent review** → **fix findings** → test/build/lint sạch.
4. **commit & push** → **cập nhật `ROADMAP.md` + sổ SDD** (đánh dấu phần xong, ghi commit, ghi manual-test TODO).
5. Sang phần kế.

**Tracking:** `ROADMAP.md` là nguồn sự thật; sổ SDD `.superpowers/sdd/progress.md` ghi nhật ký từng task/commit/finding. Mỗi phần để lại **manual-test TODO** (vì giọng/scene/flow chỉ verify được ở trình duyệt thật).

## 8. Ngoài phạm vi GĐ5 (YAGNI — giữ nguyên §13 thiết kế tổng)

Vẫn **không**: server/tài khoản online, leaderboard toàn cầu, mua hàng trong app, quảng cáo, mạng xã hội/chat, native app, thu thập/đẩy dữ liệu trẻ ra ngoài, **TTS runtime gọi mạng**. Thêm: **không** biến nội dung thành grind vô tận; **không** thêm trò mới (GĐ5 bồi đắp chiều sâu, không bề rộng); **không** song ngữ toàn giao diện (ngoài phạm vi, có thể tính sau).
