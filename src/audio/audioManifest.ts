import type { AudioManifest } from './AudioManager';

// Phase 4A: real, warm Vietnamese lines spoken via the Web Speech API (no audio
// files, no network). UI is Vietnamese throughout; English content (words,
// letters, numbers, colours) is read DYNAMICALLY via AudioManager.speakText with
// lang 'en-US' from inside the English game scenes, so the prompts here stay
// Vietnamese guidance lines.
export const AUDIO_MANIFEST: AudioManifest = {
  voices: {
    'counting.prompt': { text: 'Đếm xem có mấy bạn nào!', lang: 'vi-VN' },
    'letter.prompt': { text: 'Tìm đúng chữ cái nhé!', lang: 'vi-VN' },
    'pattern.prompt': { text: 'Chuỗi tiếp theo là hình gì nào?', lang: 'vi-VN' },
    'firstwords.prompt': { text: 'Chạm vào hình đúng với từ nhé!', lang: 'vi-VN' },
    'memory.prompt': { text: 'Lật tìm hai hình giống nhau nào!', lang: 'vi-VN' },
    'jigsaw.prompt': { text: 'Ghép các mảnh thành bức tranh nhé!', lang: 'vi-VN' },
    'moreless.prompt': { text: 'Bên nào nhiều hơn nào?', lang: 'vi-VN' },
    'firstletter.prompt': { text: 'Chữ cái đầu tiên là chữ gì?', lang: 'vi-VN' },
    'oddoneout.prompt': { text: 'Tìm bạn khác với các bạn còn lại nhé!', lang: 'vi-VN' },
    'abc.prompt': { text: 'Nghe và chạm đúng chữ nào!', lang: 'vi-VN' },
    'numbersen.prompt': { text: 'Nghe và chạm đúng số nhé!', lang: 'vi-VN' },
    'shapecolor.prompt': { text: 'Chạm đúng hình hoặc màu nào!', lang: 'vi-VN' },
    'colorsen.prompt': { text: 'Nghe và chạm đúng màu nhé!', lang: 'vi-VN' },
    'matchquantity.prompt': { text: 'Kéo số vào đúng nhóm nào!', lang: 'vi-VN' },
    'sorting.prompt': { text: 'Phân loại các bạn vào đúng giỏ nhé!', lang: 'vi-VN' },
    'spotdiff.prompt': { text: 'Tìm điểm khác nhau giữa hai bức tranh nhé!', lang: 'vi-VN' },
    'feedback.correct': { text: 'Giỏi quá!', lang: 'vi-VN' },
    'feedback.tryagain': { text: 'Thử lại nhé!', lang: 'vi-VN' },
    'reward.cheer': { text: 'Tuyệt vời, con được thưởng sao!', lang: 'vi-VN' },
    'who.title': { text: 'Ai đang chơi nào?', lang: 'vi-VN' },
    // GĐ5B scaffolding hints (warm, no-lose, "explain why"). Spoken by the fox
    // on a wrong FIRST try; the skill→key mapping lives in masteryMap.ts.
    'hint.tryagain.warm': { text: 'Gần đúng rồi, mình thử lại nhé!', lang: 'vi-VN' },
    'hint.fewer': { text: 'Cáo bớt bớt đi cho dễ chọn nha!', lang: 'vi-VN' },
    'hint.letter': { text: 'Nghe kĩ chữ cái rồi tìm chữ giống nhé!', lang: 'vi-VN' },
    'hint.number': { text: 'Mình cùng đếm lại từ một xem nào!', lang: 'vi-VN' },
    'hint.word': { text: 'Nhìn hình rồi chọn từ đúng nha bé!', lang: 'vi-VN' },
    'hint.colorshape': { text: 'Nhìn kĩ màu và hình rồi chọn lại nhé!', lang: 'vi-VN' },
  },
  sfx: ['tap', 'correct', 'wrong', 'star'],
};
