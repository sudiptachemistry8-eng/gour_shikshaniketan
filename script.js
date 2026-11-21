let language="bn";
let noticeItems=[];
const langBtn=document.getElementById("langBtn");
const searchBox=document.getElementById("noticeSearch");
const categoryBox=document.getElementById("noticeCategory");
const API_URL=window.GOUR_NOTICE_API_URL || "";
function getNoticeData(){
 return new Promise((resolve,reject)=>{
  if(!API_URL){reject(Error("Backend URL not configured"));return;}
  const cb="gourPublicCb"+Date.now(),s=document.createElement("script");
  const timer=setTimeout(()=>{cleanup();reject(Error("Notice server timeout"));},15000);
  function cleanup(){clearTimeout(timer);delete window[cb];s.remove();}
  window[cb]=d=>{cleanup();resolve(d);};
  s.onerror=()=>{cleanup();reject(Error("Notice server unavailable"));};
  s.src=API_URL+(API_URL.includes("?")?"&":"?")+"callback="+cb;
  document.head.appendChild(s);
 });
}
function safeLink(url){try{const u=new URL(url);return ["https:","http:"].includes(u.protocol)?u.href:"";}catch(e){return "";}}
function makeNotice(n){
 const el=document.createElement("article");el.className="notice"+(n.pinned?" pinned":"");
 const meta=document.createElement("div");meta.className="notice-meta";
 const date=document.createElement("time");date.dateTime=n.date||"";date.textContent=n.date||"";
 const cat=document.createElement("span");cat.className="notice-category";
 const cats={general:["সাধারণ","General"],exam:["পরীক্ষা","Examination"],holiday:["ছুটি","Holiday"],admission:["ভর্তি","Admission"],event:["অনুষ্ঠান","Event"]};
 cat.textContent=(cats[n.category||"general"]||cats.general)[language==="bn"?0:1];meta.append(date,cat);el.append(meta);
 if(n.pinned){const pin=document.createElement("span");pin.className="pinned-label";pin.textContent=language==="bn"?"গুরুত্বপূর্ণ":"IMPORTANT";el.append(pin);}
 const title=document.createElement("h3");title.textContent=language==="bn"?(n.title_bn||n.title_en):(n.title_en||n.title_bn);
 const body=document.createElement("p");body.textContent=language==="bn"?(n.body_bn||n.body_en):(n.body_en||n.body_bn);el.append(title,body);
 const imageUrl=safeLink(n.image||"");
 if(imageUrl){const img=document.createElement("img");img.src=imageUrl;img.alt=language==="bn"?"নোটিশের ছবি":"Notice image";img.loading="lazy";img.className="notice-image";el.append(img);}
 const pdfUrl=safeLink(n.file||"");
 if(pdfUrl){const a=document.createElement("a");a.href=pdfUrl;a.textContent=language==="bn"?"PDF / সংযুক্তি দেখুন বা ডাউনলোড করুন":"View / Download PDF";a.target="_blank";a.rel="noopener";a.className="notice-download";el.append(a);}
 return el;
}
function renderNotices(){
 const host=document.getElementById("noticeList"),archive=document.getElementById("noticeArchive"),count=document.getElementById("noticeCount");
 host.innerHTML="";archive.innerHTML="";
 const q=(searchBox?.value||"").trim().toLocaleLowerCase(),category=categoryBox?.value||"all";
 const filtered=noticeItems.filter(n=>{
  const hay=((n.title_bn||"")+" "+(n.title_en||"")+" "+(n.body_bn||"")+" "+(n.body_en||"")).toLocaleLowerCase();
  return (category==="all"||(n.category||"general")===category)&&(!q||hay.includes(q));
 }).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
 const currentYear=String(new Date().getFullYear());
 const current=filtered.filter(n=>(n.date||"").slice(0,4)===currentYear);
 const older=filtered.filter(n=>(n.date||"").slice(0,4)!==currentYear);
 count.textContent=language==="bn"?`মোট ${filtered.length}টি নোটিশ`:`${filtered.length} notice(s)`;
 if(!filtered.length){host.textContent=language==="bn"?"এই অনুসন্ধানে কোনও নোটিশ পাওয়া যায়নি।":"No notices match your search.";return;}
 (current.length?current:filtered).forEach(n=>host.append(makeNotice(n)));
 if(current.length&&older.length){
  const heading=document.createElement("h3");heading.textContent=language==="bn"?"পুরোনো নোটিশ / Archive":"Older Notices / Archive";archive.append(heading);
  const years=[...new Set(older.map(n=>(n.date||"").slice(0,4)||"অন্যান্য"))].sort().reverse();
  years.forEach(y=>{
   const details=document.createElement("details");details.className="archive-year";
   const summary=document.createElement("summary");summary.textContent=y;details.append(summary);
   older.filter(n=>((n.date||"").slice(0,4)||"অন্যান্য")===y).forEach(n=>details.append(makeNotice(n)));
   archive.append(details);
  });
 }
}
function setLanguage(next){language=next;document.documentElement.lang=next;document.querySelectorAll("[data-bn][data-en]").forEach(el=>{el.textContent=el.dataset[next]});langBtn.textContent=next==="bn"?"English":"বাংলা";renderNotices();}
langBtn.addEventListener("click",()=>setLanguage(language==="bn"?"en":"bn"));
searchBox?.addEventListener("input",renderNotices);categoryBox?.addEventListener("change",renderNotices);
document.getElementById("year").textContent=new Date().getFullYear();
getNoticeData().then(d=>{if(!d||!Array.isArray(d.notices))throw Error("Invalid notice response");noticeItems=d.notices;renderNotices();})
.catch(()=>{document.getElementById("noticeList").textContent="নোটিশ লোড করা যায়নি। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।";});
