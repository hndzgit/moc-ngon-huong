// src/assistant/greetingCardEngine.ts
// Mộc Ngôn Hương — Personalized Gift-Card Greeting Suggestion Engine

import {
  RecipientCategory,
  OccasionCategory,
  CardSuggestionItem,
} from './types';
import { TeaEmotion, GiftDraft } from '../types';

export interface CardGenerationInput {
  recipientCategory?: RecipientCategory;
  recipientRaw?: string;
  occasionCategory?: OccasionCategory;
  occasionRaw?: string;
  emotion?: TeaEmotion;
}

const RECIPIENT_DISPLAY_NAMES: Record<RecipientCategory, string> = {
  mother: 'Mẹ',
  father: 'Bố',
  parents: 'Bố Mẹ',
  grandparents: 'Ông Bà',
  teacher: 'Thầy Cô',
  partner: 'Người thương',
  friend: 'Bạn thân',
  business: 'Quý đối tác',
  self: 'Bản thân',
  general: 'Người thân thương',
};

const TEMPLATES: Record<
  RecipientCategory,
  {
    warm: string[];
    formal: string[];
    short: string[];
    recommendedEmotion: TeaEmotion;
    intentionId: 'peace' | 'love' | 'thanks' | 'memory';
  }
> = {
  mother: {
    warm: [
      'Con gửi mẹ chén trà thơm dịu, mong mẹ mỗi ngày luôn bình an, thư thái và thật nhiều sức khỏe bên gia đình mình.',
      'Mẹ ơi, những ngày bận rộn mẹ nhớ nghỉ tay uống ngụm trà ấm nhé. Con mong mẹ luôn khỏe mạnh và an yên.',
    ],
    formal: [
      'Kính chúc Mẹ luôn dồi dào sức khỏe, an khang và an nhiên. Con xin gửi chút hương trà thanh sạch thay cho ngàn lời biết ơn.',
      'Kính gửi Mẹ kính yêu! Nguyện chúc Mẹ thân tâm thường an lạc, một đời an lành bên con cháu.',
    ],
    short: [
      'Gửi Mẹ chén trà sớm, mong Mẹ một đời an vui và thật nhiều sức khỏe.',
      'Một tách trà thơm, ngàn lời yêu thương gửi tới Mẹ kính yêu.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  father: {
    warm: [
      'Con gửi bố hộp trà thơm mộc mạc, chúc bố những phút giây thư thả bên ấm trà và luôn dồi dào sức khỏe.',
      'Bố ơi, chúc bố luôn mạnh khỏe, vững chãi và an vui. Mong tách trà sớm mang lại cho bố sự tĩnh tại.',
    ],
    formal: [
      'Kính chúc Bố luôn mạnh khỏe, an nhiên và trường thọ. Xin gửi trọn lòng tri ân và kính trọng tới Bố.',
      'Kính tặng Bố món quà mộc mạc từ búp trà La Bằng, chúc Bố vạn sự như ý, sức khỏe dồi dào.',
    ],
    short: [
      'Kính chúc Bố luôn dồi dào sức khỏe, tâm an và mọi sự thuận hòa.',
      'Tách trà ấm gửi Bố, thay cho lời chúc an khang và trường thọ.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  parents: {
    warm: [
      'Con gửi bố mẹ chén trà ấm, chúc bố mẹ mỗi ngày đều bình an, thư thả và vui vầy cùng con cháu.',
      'Mong tách trà sớm mang đến cho bố mẹ sự thanh thản, chúc bố mẹ một đời khỏe mạnh và an nhiên.',
    ],
    formal: [
      'Kính chúc Cha Mẹ phúc như đông hải, thọ tỷ nam sơn, luôn an khang thịnh vượng và vạn sự bình an.',
      'Kính dâng Cha Mẹ chén trà thơm thanh sạch thay lời tri ân công đức sinh thành dưỡng dục.',
    ],
    short: [
      'Kính chúc Bố Mẹ luôn mạnh khỏe, an nhiên và ngập tràn niềm vui.',
      'Chút hương trà thơm mộc mạc, gửi trọn tấm lòng thơm thảo đến Bố Mẹ.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  grandparents: {
    warm: [
      'Cháu kính chúc ông bà luôn khỏe mạnh, an vui, mỗi sớm mai đều có ấm trà thơm để thưởng thức thảnh thơi.',
      'Gửi ông bà hương trà bưởi thanh tao, mong ông bà trường thọ và an lạc bên cháu con.',
    ],
    formal: [
      'Kính chúc Ông Bà trường thọ vô biên, phúc lộc song toàn, thân tâm luôn an lạc và thư thái.',
      'Kính dâng Ông Bà búp trà thơm La Bằng, chúc Ông Bà bách niên giai lão, gia đạo bình an.',
    ],
    short: [
      'Kính chúc Ông Bà sống vui, sống khỏe và luôn an lạc mỗi ngày.',
      'Chén trà kính Ông Bà, chúc Ông Bà trường thọ và an khang.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  teacher: {
    warm: [
      'Em xin gửi tặng Thầy Cô tách trà thơm dịu mát, cảm ơn Thầy Cô đã luôn tận tâm dìu dắt và bao dung chúng em.',
      'Chúc Thầy Cô luôn dồi dào sức khỏe, giữ mãi ngọn lửa nhiệt huyết và có những giây phút an yên bên ấm trà ngon.',
    ],
    formal: [
      'Kính chúc Thầy Cô luôn dồi dào sức khỏe, hạnh phúc và thành công trên con đường trồng người cao quý.',
      'Xin gửi trọn lòng tri ân sâu sắc đến Thầy Cô qua hương trà thanh sạch của đất trời La Bằng.',
    ],
    short: [
      'Tri ân Thầy Cô — người đã tận tâm soi sáng tri thức cho chúng em.',
      'Kính chúc Thầy Cô luôn an vui, dồi dào sức khỏe và hạnh phúc.',
    ],
    recommendedEmotion: 'CAM',
    intentionId: 'thanks',
  },
  partner: {
    warm: [
      'Gửi em một chút dịu dàng, mong những ngày bận rộn em luôn thấy bình yên mỗi khi thưởng thức tách trà này.',
      'Cảm ơn vì đã luôn ở bên anh. Mong mỗi ngày của chúng mình đều êm đềm và ấm áp như hương hoa nhài.',
    ],
    formal: [
      'Chúc người thương luôn an vui, hạnh phúc và vạn sự như ý trên mọi nẻo đường.',
      'Món quà nhỏ gửi người đồng hành trân quý, cảm ơn vì những thấu hiểu và sẻ chia.',
    ],
    short: [
      'Gửi người tôi thương một chút hương thơm dịu dàng mỗi sớm mai.',
      'Bình yên bên ấm trà, yêu thương gửi trọn nơi người.',
    ],
    recommendedEmotion: 'THUONG',
    intentionId: 'love',
  },
  friend: {
    warm: [
      'Gửi bạn chút hương thơm mộc mạc của búp trà quê, mong bạn luôn vững vàng, an nhiên và gặp nhiều may mắn.',
      'Lâu ngày chưa gặp, gửi bạn hộp trà nhâm nhi lúc làm việc nhé. Chúc bạn luôn vui vẻ và thuận buồm xuôi gió!',
    ],
    formal: [
      'Chúc bạn luôn dồi dào năng lượng, vạn sự hanh thông và gặt hái nhiều thành công rực rỡ.',
      'Món quà thanh nhã gửi người bạn trân quý, chúc cho tình bạn của chúng ta luôn bền chặt.',
    ],
    short: [
      'Chúc bạn luôn an vui, công việc thuận lợi và tâm hồn luôn tươi trẻ.',
      'Chút hương trà thơm gửi người bạn đồng hành tri kỷ!',
    ],
    recommendedEmotion: 'NHO',
    intentionId: 'memory',
  },
  business: {
    warm: [
      'Kính gửi Quý đối tác, chúc mối quan hệ hợp tác của chúng ta luôn bền chặt, thịnh vượng và tốt đẹp.',
      'Xin gửi tặng Quý đối tác món quà trà thanh sạch, kính chúc Quý công ty ngày càng phát triển vững mạnh.',
    ],
    formal: [
      'Kính chúc Quý khách hàng / Đối tác sức khỏe dồi dào, vạn sự hanh thông, công việc kinh doanh đại cát đại lợi.',
      'Trân trọng gửi tặng Quý vị thức trà thượng hạng La Bằng thay cho lời tri ân sự tin tưởng và đồng hành.',
    ],
    short: [
      'Kính chúc Quý đối tác phát tài phát lộc, hợp tác thành công mỹ mãn.',
      'Trân trọng cảm ơn sự đồng hành quý báu của Quý khách hàng.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'thanks',
  },
  self: {
    warm: [
      'Dành cho chính mình một khoảng lặng dịu dàng sau những lo toan, chúc bản thân luôn an yên và yêu đời.',
      'Thả trôi muộn phiền theo làn khói trà, thương mình hơn một chút mỗi ngày.',
    ],
    formal: [
      'Tự thưởng cho bản thân chén trà tĩnh tại, giữ tâm hồn an nhiên trước mọi xô bồ.',
      'Chăm sóc thân tâm bằng búp trà sạch truyền thống La Bằng.',
    ],
    short: [
      'Chậm lại một nhịp, lắng nghe chính mình cùng chén trà thơm.',
      'Một tách trà an yên dành tặng bản thân hôm nay.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
  general: {
    warm: [
      'Gửi bạn chút hương trà thơm ngát, mong mỗi ngày trôi qua đều là những ngày an lành, tràn đầy yêu thương.',
      'Chúc người một đời an nhiên, lòng luôn phẳng lặng và bình an trước những biến thiên của cuộc sống.',
    ],
    formal: [
      'Kính chúc Quý vị luôn dồi dào sức khỏe, an khang thịnh vượng và vạn sự như ý.',
      'Xin gửi món quà thanh sạch của đất trời La Bằng thay cho lời chúc tốt đẹp nhất.',
    ],
    short: [
      'Chúc bạn luôn an vui, tĩnh tại và ngập tràn niềm hạnh phúc.',
      'Trao hương, gửi lời thương — chúc một đời an lành.',
    ],
    recommendedEmotion: 'AN',
    intentionId: 'peace',
  },
};

/**
 * Generate 3 curated styles of greeting card messages (warm, formal, short), strictly <= 280 chars.
 */
export function generateCardSuggestions(input: CardGenerationInput): {
  suggestions: CardSuggestionItem[];
  recommendedEmotion: TeaEmotion;
  intentionId: 'peace' | 'love' | 'thanks' | 'memory';
} {
  const category = input.recipientCategory || 'general';
  const recipientName = input.recipientRaw
    ? input.recipientRaw.charAt(0).toUpperCase() + input.recipientRaw.slice(1)
    : RECIPIENT_DISPLAY_NAMES[category];

  const templateSet = TEMPLATES[category] || TEMPLATES.general;
  const emotion = input.emotion || templateSet.recommendedEmotion;

  const warmText = templateSet.warm[0];
  const formalText = templateSet.formal[0];
  const shortText = templateSet.short[0];

  const suggestions: CardSuggestionItem[] = [
    {
      id: `warm-${category}`,
      style: 'warm',
      styleLabel: 'Ấm áp & Gần gũi',
      recipient: recipientName,
      text: warmText.slice(0, 280),
      charCount: warmText.length,
    },
    {
      id: `formal-${category}`,
      style: 'formal',
      styleLabel: 'Trang trọng & Kính cẩn',
      recipient: recipientName,
      text: formalText.slice(0, 280),
      charCount: formalText.length,
    },
    {
      id: `short-${category}`,
      style: 'short',
      styleLabel: 'Ngắn gọn & Súc tích',
      recipient: recipientName,
      text: shortText.slice(0, 280),
      charCount: shortText.length,
    },
  ];

  return {
    suggestions,
    recommendedEmotion: emotion,
    intentionId: templateSet.intentionId,
  };
}

/**
 * Convert a card suggestion into a GiftDraft ready for GiftJourneyPage
 */
export function createDraftFromCardSuggestion(
  suggestion: CardSuggestionItem,
  emotion: TeaEmotion,
  productId = 'hop-qua-tam-y'
): GiftDraft {
  const intentionMap: Record<TeaEmotion, string> = {
    AN: 'peace',
    THUONG: 'love',
    CAM: 'thanks',
    NHO: 'memory',
  };

  return {
    intention: intentionMap[emotion] || 'peace',
    emotion,
    productId,
    recipient: suggestion.recipient,
    message: suggestion.text,
    cardStyle: 'botanical',
  };
}
