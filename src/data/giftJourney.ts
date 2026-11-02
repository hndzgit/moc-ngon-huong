import { PRODUCTS } from './products';
import type { GiftDraft, TeaEmotion } from '../types';

// Editorial intention mappings; product characteristics and all prices come from the catalogue.
export const INTENTIONS = [
  { id: 'thanks', label: 'Lời cảm ơn', emotion: 'CAM', sentence: 'Cảm ơn vì đã luôn ở đó, lắng nghe và đồng hành.' },
  { id: 'love', label: 'Lời yêu thương', emotion: 'THUONG', sentence: 'Gửi một chút dịu dàng, cho những ngày mình ở bên nhau.' },
  { id: 'peace', label: 'Lời chúc bình an', emotion: 'AN', sentence: 'Mong mỗi ngày của người đều có một khoảng bình yên.' },
  { id: 'memory', label: 'Một nỗi nhớ', emotion: 'NHO', sentence: 'Có những điều đi xa rồi, hương thơm vẫn giữ lại thật gần.' },
] as const;
export const TEAS = PRODUCTS.filter(p=>['AN','THUONG','CAM','NHO'].includes(p.emotion));
export const teaFor = (emotion:TeaEmotion)=>TEAS.find(p=>p.emotion===emotion)!;
export const emotionName = (emotion:TeaEmotion)=>({AN:'AN',THUONG:'THƯƠNG',CAM:'CẢM',NHO:'NHỚ'}[emotion]);
export const money = (value:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(value);
export function createGiftDraft(emotion:TeaEmotion='AN'):GiftDraft {
  return {intention:'',emotion,productId:teaFor(emotion).id,recipient:'',message:'',cardStyle:'botanical'};
}
export function changeEmotion(draft:GiftDraft,emotion:TeaEmotion):GiftDraft {
  return {...draft,emotion,productId:draft.productId==='hop-qua-tam-y'?draft.productId:teaFor(emotion).id};
}
export const journeyHash=(emotion:TeaEmotion,step=1)=>`#/chon-qua?cam-xuc=${emotion}&buoc=${step}`;
