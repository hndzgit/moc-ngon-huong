from pathlib import Path
import json,re,hashlib,xml.etree.ElementTree as ET,tarfile
root=Path.cwd();docs=root/'docs'; assets=json.loads((root/'figma-reference/manifests/assets-manifest.json').read_text())['assets']
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
public=list((root/'public/assets/figma').rglob('*'));public=[p for p in public if p.is_file()]
byhash={}
for p in public:byhash.setdefault(sha(p),[]).append(str(p.relative_to(root)))
sources=list((root/'src').rglob('*.tsx'))+list((root/'src').rglob('*.ts'))+list((root/'src').glob('*.css'))
rows=[]
for a in assets:
 p=root/'figma-reference'/a['rel_path'];actual=sha(p);aliases=byhash.get(actual,[]);calls=[]
 for f in sources:
  for i,line in enumerate(f.read_text().splitlines(),1):
   if any('/'+x.split('public/',1)[1] in line for x in aliases) or (a['suffix'] in line and f.name in ['FigmaIcon.tsx','figmaMedia.ts']):calls.append(f'{f.relative_to(root)}:{i}')
 rows.append({**{k:a.get(k) for k in ['node_id','data_name','suffix','width','height','category','rel_path']},'actualSha256':actual,'manifestSha256Matches':actual==a.get('sha256'),'publicAliases':aliases,'sourceCallsites':calls})
(docs/'evidence/asset-traceability.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
lines=['# FIGMA ASSET MAPPING — 02/11/2026','','A = `TKRa7opPooD1iBxlr3E0SU`; B = `jGNXZhtdoyrsEdaX3NgasR`; C = `S0TdOYTDdDR3IznouUu0cV`.','', 'Dữ liệu từng slot ảnh, kích thước và crop nằm trong `figma-reference/sources/*/metadata/live_*.txt`. SHA-256 dưới đây tính lại từ byte thực tế, không tin nhãn VERIFIED trong manifest cũ. File gốc giữ nguyên; production chỉ dùng đường dẫn local. Extension do Figma trả về có thể khác MIME thực tế (một số `.png` chứa JPEG). Không chuyển đổi/nắn lại ảnh gốc.','',f'Đã kiểm tra lại **{len(rows)} asset** trong manifest; **{sum(r["manifestSha256Matches"] for r in rows)} hash khớp**. Asset chưa được dùng không bị xóa. Các SVG control xuất mới được ghi riêng phía dưới.','', '| Figma node | Tên / loại | Original local | Public alias | React/data callsite | Kích thước ảnh | SHA-256 |','|---|---|---|---|---|---|---|']
for r in rows:
 lines.append(f'| `{r["node_id"]}` | {r["data_name"]} / {r["category"]} | `figma-reference/{r["rel_path"]}` | '+ '<br>'.join('`'+x+'`' for x in r['publicAliases'])+' | '+('<br>'.join('`'+x+'`' for x in r['sourceCallsites']) or 'Chưa có callsite trực tiếp; xem data/component liên quan hoặc chưa dùng')+f' | {r["width"]}×{r["height"]} | `{r["actualSha256"]}` |')
lines+=['','## Ánh xạ màn hình đã sửa','','| React slot | Node đúng theo nội dung trực tiếp | Asset local |','|---|---|---|','| Homepage Hero | `61:1165`, `70:3225`, `70:3224` | `hero-banner.png`, `originals/4ce5c.png`, `originals/3ee72.png`; crop theo context |','| Header/Footer logo | `92:3655`, `103:3670` | `logo-header.png` qua `BrandLogo.tsx`, crop 137.4%×134.5%, x −14.83%, y −19.27% |','| Homepage bốn card | `75:3666`, `80:1847`, `80:1831`, `80:1863` | `originals/ae4e7.png`, `219aa.png`, `417b2.png`, `c759e.png` |','| Chi tiết Bưởi | `35:3068` | `originals/55312.png`; story `14960.png` |','| Chi tiết Nhài | `120:2859` (nhãn cũ sai) | `originals/2cf37.png`; story cùng file, đúng context |','| Chi tiết Sói | `120:3302` (nhãn cũ sai) | `originals/2f1ed.png`; story `c6f60.png` |','| Chi tiết Cốm | `120:3541` (nhãn cũ sai) | `originals/24130.png`; story `3735e.png` |','| Chi tiết combo | `120:6560` (nhãn cũ sai) | `originals/7b167.png`; story `7dc9e.png` |','| Shared detail gallery | `103:5875`, `103:6447` | `originals/b5d74.png`, `191e7.png`; crop theo context, không tự tạo thumbnail |','| Brand story | `33:2852`, `33:2856`, `33:2858`, `77:2012` | `story-hero.png`, `story-1.png`, `story-2.png`, `originals/90128.png` |','| Auth | `127:11152`, `127:12463`, forgot images | `originals/7a0f7.png`, `e31ba.png`, `496fe.png` |','| Gold artwork | `80:3537`, `80:3539`, `80:3541` | `icons-gold-3.png` với ba crop gốc trong `FigmaArtwork.tsx` |','| Kraft / thiệp | `96:2976`, `96:2974` | `icons-steps-scroll-envelope.png` với crop gốc; không dùng bản crop không có nguồn |','','## Elements A/B/C','','12 lớp ảnh trong `18:105` trùng image hash, crop, rotation. Group `132:4516` chỉ là tổ hợp ba lớp sẵn có; không phải artwork mới và không được chèn thêm vào UI ngoài thiết kế.','', '| Node | Tên | Image hash trong Figma | Rotation | Size |','|---|---|---|---|---|']
for e in json.loads((root/'figma-reference/comparison/live-elements-source-c.json').read_text()):lines.append(f'| `{e["id"]}` | {e["name"]} | `{e["fills"][0]["imageHash"]}` | {e["rotation"]}° | {e["width"]}×{e["height"]} |')
lines+=['','## Giới hạn truy vết','','Các asset raw có node `download_assets` / `unknown` vẫn giữ trạng thái **MISSING_NODE_MAPPING**, không bịa node. Các thumbnail cũ không khớp hash gốc được giữ để bảo toàn dự án; các flow đã sửa ưu tiên map ở `figmaMedia.ts`. Bảng này chứng minh nguồn asset, chưa chứng minh mọi slot đã đạt pixel fidelity.']
lines+=['','## Original exports bổ sung trong lượt sửa','','| Source node | Local file | SHA-256 |','|---|---|---|']
for a in json.loads((root/'figma-reference/manifests/supplemental-original-assets.json').read_text()):
 lines.append(f'| `{a["nodeId"]}` | `{a["path"]}` | `{a["sha256"]}` |')
lines+=['','Listing Nhài dùng `ba739.png` tại `120:8204`; banner đăng ký dùng `c1a60.png` tại `127:12100`. Các bản này đã có nội dung hash trong manifest cũ nhưng chưa được dùng đúng slot. Giỏ/checkout/receipt dùng `ae4e7.png` với crop x −41.14%, width 149.98% và `01c48.png` tại các node 127:8356, 127:8372, 77:3818, 77:3824, 127:10608, 127:10617.','']
(docs/'FIGMA_ASSET_MAPPING.md').write_text('\n'.join(lines)+'\n')
# Named, repeated icon inventory.
iconrows=[]
for p in sorted((root/'figma-reference/manifests').glob('live-icon-details-*.json')):iconrows+=json.loads(p.read_text())['rows']
def color(paint):
 if paint.get('type')=='SOLID':
  c=paint['color'];return '#'+''.join(f'{round(c[x]*255):02x}' for x in ['r','g','b'])
 return paint.get('type','?')
def resolve(r):
 name=r['name'].lower();w=r['width']
 if name=='number input':return 'COMPOSED_CONTROL: glyph/text và border theo source, không phải icon/asset riêng','ProductDetailPage/CartDrawer'
 if w==28 and r['screenId'] in ['127:9562','127:10079']:
  if name.endswith('/user'):return 'd0415.svg','Navbar (contact override)'
  if name.endswith('/bag-2'):return '2dc38.svg','Navbar (contact override)'
 mapping={'search-normal':('5bc29.svg','Navbar/SearchOverlay'),'user':('b685b.svg','Navbar'),'bag-2':('06869.svg' if w==22 else '64a36.svg','Navbar/EmotionSelector/SignatureBoxSection'),'empty-wallet':('df75c.svg' if w==22 else '5f1e6.svg','EmotionSelector/SignatureBoxSection/ProductDetailPage'),'shopping-cart':('3bc2b.svg','CartDrawer'),'group':('c92d5.svg','ProductDetailPage'),'box':('a7960.svg','ProductDetailPage'),'dollar-circle':('5d78b.svg','ProductDetailPage'),'airplane':('34f1f.svg','ProductDetailPage'),'call':('ccb33.svg','ContactPage'),'sms':('3eb6c.svg','ContactPage'),'send-2':('98dd5.svg','ContactPage/ChatBox'),'messages':('191f0.svg','ChatBox'),'scan':('41dd0.svg','EmotionSelector'),'link':('f22ce.svg','ChatBox: chưa khớp slot attachment'),'clock':('54997.svg','Auth OTP: UI_ONLY'),'arrow-down':('4f88c.svg' if w==20 else '898de.svg','select/ProductDetailPage'),'arrow-left':('f0ea1.svg','SignatureBoxSection'),'arrow-right':('39da6.svg','SignatureBoxSection'),'bag':('dfcd0.svg' if w==22 else '66915.svg','ProductDetailPage'),'math':('4983f.svg' if w==32 else 'a2171.svg','CartDrawer/SearchOverlay/Auth/ChatBox')}
 for key in ['facebook','instagram','tiktok']:
  if key in name:return {'facebook':'39634.svg','instagram':'dc19d.svg','tiktok':'eface.svg'}[key],'Footer'
 if 'successmark' in name:return '75b73.svg','ContactPage/AuthPage'
 if name=='radio box':return 'checkbox/radio exported variants','native accessible input + SVG background'
 for key,pair in mapping.items():
  if name.endswith('/'+key) or name.endswith('/'+key+' 1'):return pair
 return 'MISSING_ORIGINAL_ASSET_MAPPING','Cần đối chiếu slot riêng; không thay bằng icon generic'
lines=['# FIGMA ICON AUDIT — 02/11/2026','','## Phạm vi và bằng chứng','',f'- Quét live UI page: **482 named nodes**, gồm **296 instance/frame** và 186 group lồng bên trong; giữ các instance lặp, không gộp theo tên. Thuộc tính chi tiết trong `figma-reference/manifests/live-icon-details-0.json` … `-8.json`.', '- Các vector vô danh (sao, nút +/−, dấu xác nhận) được kiểm kê thêm ở bảng SVG; không xem bộ lọc tên là toàn bộ artwork.','- `styles` trong JSON là stroke/fill thật của các vector con, gồm opacity và binding; không suy ra từ tên icon.','- Ảnh SVG gốc được copy byte-for-byte vào `public/assets/figma/originals/`. Không sửa path, viewBox hay màu để giả tương đồng.','- Hover/active: giữ component source trong JSON. Không có reaction được trả về không có nghĩa thiết kế không có hover. Các biến thể chưa có bằng chứng được ghi **NOT_VERIFIED**.','- Cột asset bên dưới là ánh xạ theo family/size để truy vết. Những instance có override màu/geometry vẫn cần đối chiếu riêng; không coi candidate cùng tên là đã nghiệm thu.','','## Các sai lệch đã sửa','','| Trước | Sau | Callsite |','|---|---|---|','| Footer f / ◎ / ♪ | Facebook/Instagram/TikTok gốc 24px | `Footer.tsx` |','| Emoji túi hàng | bag / bag-2 gốc 22/24px đúng slot | `EmotionSelector`, `SignatureBoxSection`, `ProductDetailPage` |','| Cart empty SVG tự vẽ | `127:9320` bold shopping-cart gốc | `CartDrawer` |','| Header icon đúng file nhưng 20px | SVG gốc 28px | `Navbar` |','| Dấu check giống nhau cho 4 dịch vụ | group/box/dollar-circle/airplane, stroke gốc 1.5px | `ProductDetailPage` |','| Ký tự điện thoại/email | call/sms gốc | `ContactPage` |','| Sao/avartar Unicode | Vector sao, check, avatar gốc | `ProductDetailPage`, `ReviewsSection` |','| Emoji lá/muỗng/thiệp | Crop artwork chính xác từ Figma | `FigmaArtwork` |','| Checkbox/radio browser tự vẽ | 4 SVG xuất trực tiếp từ variant gốc | `figma-repair.css` |','','## Inventory từng instance / frame','','| Screen node | Icon node | Original name / component | Size | Stroke widths | Stroke colors | Fill colors | Visibility / opacity | React | Candidate original | Hover/active | Status |','|---|---|---|---|---|---|---|---|---|---|---|']
for r in iconrows:
 widths=sorted(set(str(v['strokeWeight']) for v in r['styles'] if v.get('strokes')));strokes=sorted(set(color(p) for v in r['styles'] for p in v.get('strokes',[]) if p.get('visible',True)));fills=sorted(set(color(p) for v in r['styles'] for p in v.get('fills',[]) if p.get('visible',True)));asset,react=resolve(r);component=(r.get('component') or {}).get('name','—');lines.append(f'| `{r["screenId"]}` | `{r["id"]}` | {r["name"]} / {component} | {r["width"]}×{r["height"]} | {", ".join(widths) or "none"} | {", ".join(strokes) or "none"} | {", ".join(fills) or "none"} | {r["visible"]} / {r["opacity"]} | {react} | `{asset}` | NOT_VERIFIED | INSPECTING |')
lines+=['','## SVG structure và vector vô danh','','File SVG trong repo là bằng chứng geometry đầy đủ. Dưới đây kiểm kê root/viewBox và path counts, không tái vẽ từ trí nhớ.','', '| Original asset node | Local SVG | viewBox | paths | Stroke widths | Stroke/fill colors |','|---|---|---|---|---|---|']
for a in assets:
 if not a['rel_path'].endswith('.svg'):continue
 p=root/'figma-reference'/a['rel_path'];tree=ET.fromstring(p.read_text());els=list(tree.iter());sw=sorted({x.get('stroke-width') for x in els if x.get('stroke-width')});colors=sorted({x.get(k) for x in els for k in ['stroke','fill'] if x.get(k) and x.get(k)!='none'});lines.append(f'| `{a["node_id"]}` | `figma-reference/{a["rel_path"]}` | `{tree.get("viewBox")}` | {sum(x.tag.endswith("path") for x in els)} | {", ".join(sw)} | {", ".join(colors)} |')
lines+=['','## SVG controls xuất mới','','| Variant | Node | File | SHA-256 |','|---|---|---|---|']
for name,node in [('checkbox-default','127:8845'),('checkbox-checked','127:8849'),('radio-default','127:8847'),('radio-checked','127:8852')]:
 p=root/f'public/assets/figma/originals/{name}.svg';lines.append(f'| {name} | `{node}` | `{p.relative_to(root)}` | `{sha(p)}` |')
lines+=['','## Còn lại','','- ChatBox: đã khôi phục launcher và close gốc, kích thước 576×700 desktop; more/emotion/link đã có SVG và rotation gốc; lời chào local, thứ tự tên thương hiệu và các trạng thái hội thoại còn khác source; emotion/attachment chỉ là artwork, chưa có picker/upload. Logic trả lời hiện là local rules, phân loại MOCKED, không phải AI backend.','- OTP: đã thêm clock và close gốc. Không dựng countdown giả khi không có challenge từ server; dấu — thể hiện không có mã đang hoạt động.', '- Header contact có override #222222 riêng cho user/bag-2 (`d0415.svg`, `2dc38.svg`), đã map theo currentPage thay vì đổi màu SVG chung.', '- Menu mobile không có frame Figma tương ứng: giữ thích ứng hiện hữu, không coi là original desktop asset.','- `CraftmanshipSection` dùng Lucide nhưng không được import/render trong App; được giữ nguyên theo quy tắc không sửa phần không dùng.','- Không tuyên bố đã xác minh mọi vị trí/hover của 296 icon. Các chỗ chưa map được ghi thiếu mapping; không chế icon thay thế.']
lines+=['','Star vector có bounds 24×23; SVG export gồm stroke bleed 1px mỗi cạnh (26×25). FigmaIcon giữ path/viewBox và margin−1 để giữ layout24×23 cùng stroke2px.','']
(docs/'FIGMA_ICON_AUDIT.md').write_text('\n'.join(lines)+'\n')
# Recoverability and a precise source delta independent of global ignored Git.
changes=[];deleted=[]
with tarfile.open(root/'.codex-baseline/2026-11-02/application-before-repair.tar.gz') as t:
 for m in t.getmembers():
  if not m.isfile() or Path(m.name).name.startswith('._'):continue
  p=root/m.name
  if not p.exists():deleted.append(m.name)
  elif p.read_bytes()!=t.extractfile(m).read():changes.append(m.name)
(docs/'evidence/source-delta.json').write_text(json.dumps({'changedBaselineFiles':changes,'deletedBaselineFiles':deleted},indent=2))
print({'assets':len(rows),'hashesVerified':sum(r['manifestSha256Matches'] for r in rows),'iconInstances':len(iconrows),'changedFiles':len(changes),'deleted':deleted})
