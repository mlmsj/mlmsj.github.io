import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { addTextWatermarkWithFont,addPageNumbersWithFont } from '../src/pdfTextCore';
const fontBytes=await readFile('public/fonts/NotoSansSC-GB2312.ttf');const source=await PDFDocument.create();for(let i=0;i<3;i++)source.addPage([420,595]);const input=await source.save();const out='../evidence/post-fix';await mkdir(out,{recursive:true});
const cases=[
 {text:'office ffi affinity',size:28,angle:0,position:'center'},
 {text:'中文 English 2026 (示例) [A]!',size:12,angle:0,position:'center'},
 {text:'affinity office ffi',size:8,angle:-45,position:'top-left'},
 {text:'affinity office ffi',size:48,angle:45,position:'top-right'},
 {text:'中英文 office (123)',size:28,angle:-45,position:'bottom-left'},
 {text:'中英文 office (123)',size:28,angle:45,position:'bottom-right'},
 {text:'office affinity 中文 (123)',size:48,angle:45,position:'center'},
 {text:'ABCDEFGHIJKLMNOPQRSTUVWXYZ',size:12,angle:0,position:'center'},
 {text:'旋转测试 90',size:28,angle:90,position:'center'},
 {text:'旋转测试 -90',size:28,angle:-90,position:'center'},
] as const;
function bounds(item:any){const [a,b,c,d,x,y]=item.transform;const size=Math.hypot(a,b),cos=a/size,sin=b/size,w=item.width;return [[0,-size*.2],[0,size],[w,-size*.2],[w,size]].map(([u,v])=>[x+u*cos-v*sin,y+u*sin+v*cos]);}
async function inspect(bytes:Uint8Array){const task=getDocument({data:Uint8Array.from(bytes),useSystemFonts:true});try{const p=await task.promise;let arr=[];for(let i=1;i<=p.numPages;i++)arr.push((await(await p.getPage(i)).getTextContent()).items.filter(x=>'str'in x));return arr}finally{await task.destroy()}}
for(let idx=0;idx<cases.length;idx++){const c=cases[idx],doc=await PDFDocument.load(input);await addTextWatermarkWithFont(doc,{text:c.text,fontSize:c.size,angle:c.angle,position:c.position,opacity:.5,fontBytes,selectedPages:new Set([1,3])});const bytes=await doc.save();await writeFile(`${out}/mark-${idx}.pdf`,bytes);const pages=await inspect(bytes);if(pages[1].length)throw Error('unselected page changed');for(const n of [0,2]){const item=pages[n][0] as any;if(!item||item.str!==c.text)throw Error(`text mismatch ${idx}: ${item?.str}`);const b=bounds(item);if(b.some(([x,y])=>x < -.1 || x>420.1 || y<-.1 || y>595.1))throw Error(`outside page ${idx} ${JSON.stringify(b)}`);if(c.position==='center'){let xs=b.map(x=>x[0]),ys=b.map(x=>x[1]);if(Math.abs((Math.min(...xs)+Math.max(...xs))/2-210)>.15||Math.abs((Math.min(...ys)+Math.max(...ys))/2-297.5)>.15)throw Error(`not centered ${idx}`);}}console.log('PASS',idx,JSON.stringify(c));}
for(const position of ['header-left','header-center','header-right','footer-left','footer-center','footer-right']){const doc=await PDFDocument.load(input);await addPageNumbersWithFont(doc,{fontBytes,selectedPages:new Set([1,3]),start:1,position,format:'cn',fontSize:48});const bytes=await doc.save();await writeFile(`${out}/${position}.pdf`,bytes);const pages=await inspect(bytes);if((pages[0][0] as any)?.str!=='第 1 页'||pages[1].length||(pages[2][0] as any)?.str!=='第 2 页')throw Error('page selection or text');for(const p of [pages[0],pages[2]])if(bounds(p[0]).some(([x,y])=>x<-.1||x>420.1||y<-.1||y>595.1))throw Error('number out of bounds '+position);console.log('PASS numbering',position)}
for(const c of [{text:'ABCDEFGHIJKLMNOPQRSTUVWXYZ ABCDEFGHIJKLMNOPQRSTUVWXYZ',angle:0,offsetX:0},{text:'正常水印',angle:0,offsetX:500},{text:'缺字 🧪',angle:0,offsetX:0}]){const doc=await PDFDocument.load(input);let error='';try{await addTextWatermarkWithFont(doc,{...c,opacity:.5,fontSize:48,fontBytes,selectedPages:new Set([1])})}catch(e){error=String(e)}if(!error.includes(c.text.includes('🧪')?'不支持':'超出页面'))throw Error('expected rejection '+error);console.log('PASS rejection',c.text.slice(0,15),error)}
const invalidDoc=await PDFDocument.load(input);let error='';try{await addTextWatermarkWithFont(invalidDoc,{text:'visible',angle:0,opacity:.5,fontSize:0,fontBytes,selectedPages:new Set([1])})}catch(e){error=String(e)}if(!error.includes('字号无效'))throw Error('zero font size accepted');console.log('PASS zero font size rejected');
