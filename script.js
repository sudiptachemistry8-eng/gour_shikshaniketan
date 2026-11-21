let language="bn";
let noticeItems=[];
const langBtn=document.getElementById("langBtn");
const searchBox=document.getElementById("noticeSearch");
const categoryBox=document.getElementById("noticeCategory");
function renderNotices(){
 const host=document.getElementById("noticeList");
 const count=document.getElementById("noticeCount");
 host.innerHTML="";
 const q=(searchBox?.value||"").trim().toLocaleLowerCase();
 const category=categoryBox?.value||"all";
 const filtered=noticeItems.filter(n=>{
  const title=(n.title_bn||"")+" "+(n.title_en||"");
  const body=(n.body_bn||"")+" "+(n.body_en||"");
  return (category==="all"||(n.category||"general")===category) && (!q||(title+" "+body).toLocaleLowerCase().includes(q));
 }).sort((a,b)=>b.date.localeCompare(a.date));
 count.textContent=language==="bn"?`মোট ${filtered.length}টি নোটিশ`:`${filtered.length} notice(s)`;
 if(!filtered.length){host.textContent=language==="bn"?"এই অনুসন্ধানে কোনও নোটিশ পাওয়া যায়নি।":"No notices match your search.";return;}
 filtered.forEach(n=>{
  const el=document.createElement("article");el.className="notice"+(n.pinned?" pinned":"");
  const meta=document.createElement("div");meta.className="notice-meta";
  const date=document.createElement("time");date.dateTime=n.date;date.textContent=n.date;
  const cat=document.createElement("span");cat.className="notice-category";
  const cats={general:["সাধারণ","General"],exam:["পরীক্ষা","Examination"],holiday:["ছুটি","Holiday"],admission:["ভর্তি","Admission"],event:["অনুষ্ঠান","Event"]};
  cat.textContent=(cats[n.category||"general"]||cats.general)[language==="bn"?0:1];
  meta.append(date,cat);el.append(meta);
  if(n.pinned){const pin=document.createElement("span");pin.className="pinned-label";pin.textContent=language==="bn"?"গুরুত্বপূর্ণ":"IMPORTANT";el.append(pin);}
  const title=document.createElement("h3");title.textContent=language==="bn"?(n.title_bn||n.title_en):(n.title_en||n.title_bn);
  const body=document.createElement("p");body.textContent=language==="bn"?(n.body_bn||n.body_en):(n.body_en||n.body_bn);
  el.append(title,body);
  if(n.file){const a=document.createElement("a");a.href=n.file;a.textContent=language==="bn"?"নোটিশ দেখুন / ডাউনলোড":"View / Download notice";a.target="_blank";a.rel="noopener";el.append(a);}
  host.append(el);
 });
}
function setLanguage(next){language=next;document.documentElement.lang=next;document.querySelectorAll("[data-bn][data-en]").forEach(el=>{el.textContent=el.dataset[next]});langBtn.textContent=next==="bn"?"English":"বাংলা";renderNotices();}
langBtn.addEventListener("click",()=>setLanguage(language==="bn"?"en":"bn"));
searchBox?.addEventListener("input",renderNotices);
categoryBox?.addEventListener("change",renderNotices);
document.getElementById("year").textContent=new Date().getFullYear();
fetch("notices.json").then(r=>{if(!r.ok)throw new Error("Could not load notices");return r.json();}).then(items=>{noticeItems=Array.isArray(items)?items:[];renderNotices();}).catch(()=>{document.getElementById("noticeList").textContent="নোটিশ আপডেটের কাজ চলছে। অনুগ্রহ করে পরে দেখুন।";});
