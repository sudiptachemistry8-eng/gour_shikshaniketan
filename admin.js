(() => {
  "use strict";
  const STORAGE_KEY = "gour-notice-admin-draft-v1";
  const allowedCategories = new Set(["general", "exam", "holiday", "admission", "event"]);
  const $ = id => document.getElementById(id);
  const form = $("noticeForm");
  let notices = [];

  const today = () => new Date().toISOString().slice(0, 10);
  const cleanText = value => String(value || "").trim();
  const safeNotice = value => {
    if (!value || typeof value !== "object") return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value.date || "") ? value.date : today();
    const titleBn = cleanText(value.title_bn);
    const bodyBn = cleanText(value.body_bn);
    if (!titleBn || !bodyBn) return null;
    return { date, category: allowedCategories.has(value.category) ? value.category : "general", pinned: Boolean(value.pinned), title_bn: titleBn.slice(0,180), title_en: cleanText(value.title_en).slice(0,180), body_bn: bodyBn.slice(0,2000), body_en: cleanText(value.body_en).slice(0,2000), file: cleanText(value.file).slice(0,500) };
  };
  const sortNotices = () => notices.sort((a,b) => Number(b.pinned)-Number(a.pinned) || b.date.localeCompare(a.date));
  const say = (text, error=false) => { const s=$("status"); s.textContent=text; s.className="status"+(error?" error":""); };
  const saveDraft = () => { localStorage.setItem(STORAGE_KEY, JSON.stringify(notices)); };
  const resetForm = () => { form.reset(); $("noticeId").value=""; $("date").value=today(); $("formTitle").textContent="নতুন নোটিশ"; $("deleteNotice").hidden=true; };
  function renderList(){
    const list=$("noticeList"); list.replaceChildren(); sortNotices(); $("noticeTotal").textContent=notices.length;
    if(!notices.length){ const p=document.createElement("p");p.textContent="এখনও কোনও নোটিশ নেই।";list.append(p);return; }
    notices.forEach((n,index) => { const b=document.createElement("button"); b.type="button"; b.className="notice-entry"; const title=document.createElement("b"); title.textContent=(n.pinned?"★ ":"")+n.title_bn; const meta=document.createElement("small");meta.textContent=`${n.date} · ${n.category}`; b.append(title,meta); b.addEventListener("click",()=>loadNotice(index));list.append(b); });
  }
  function loadNotice(index){ const n=notices[index]; $("noticeId").value=index; $("date").value=n.date; $("category").value=n.category; $("pinned").checked=n.pinned; $("titleBn").value=n.title_bn; $("titleEn").value=n.title_en; $("bodyBn").value=n.body_bn; $("bodyEn").value=n.body_en; $("file").value=n.file; $("formTitle").textContent="নোটিশ সম্পাদনা"; $("deleteNotice").hidden=false; say("নোটিশটি সম্পাদনার জন্য খোলা হয়েছে।"); }
  function readForm(){ return safeNotice({date:$("date").value,category:$("category").value,pinned:$("pinned").checked,title_bn:$("titleBn").value,title_en:$("titleEn").value,body_bn:$("bodyBn").value,body_en:$("bodyEn").value,file:$("file").value}); }
  form.addEventListener("submit", event => { event.preventDefault(); const item=readForm(); if(!item){say("বাংলা শিরোনাম ও বিবরণ আবশ্যক।",true);return;} const id=$("noticeId").value; if(id === "") notices.push(item); else notices[Number(id)]=item; saveDraft();renderList();resetForm();say("খসড়ায় সংরক্ষণ হয়েছে। প্রকাশ করতে notices.json ডাউনলোড করুন।"); });
  $("newNotice").addEventListener("click",resetForm); $("resetForm").addEventListener("click",resetForm);
  $("deleteNotice").addEventListener("click",()=>{ const id=$("noticeId").value; if(id!==""&&confirm("এই নোটিশটি খসড়া থেকে মুছবেন?")){notices.splice(Number(id),1);saveDraft();renderList();resetForm();say("নোটিশটি খসড়া থেকে মুছে ফেলা হয়েছে। প্রকাশ করতে নতুন notices.json ডাউনলোড করুন।");} });
  $("clearDraft").addEventListener("click",()=>{ if(confirm("সব লোকাল খসড়া মুছে ফেলবেন?")){notices=[];localStorage.removeItem(STORAGE_KEY);renderList();resetForm();say("লোকাল খসড়া মুছে ফেলা হয়েছে।");} });
  $("downloadJson").addEventListener("click",()=>{ sortNotices(); const blob=new Blob([JSON.stringify(notices,null,2)+"\n"],{type:"application/json"}); const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="notices.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);say("notices.json ডাউনলোড হয়েছে। এবার GitHub-এ পুরনো ফাইলটি Replace করে Commit করুন।"); });
  $("importJson").addEventListener("change", async event=>{ const file=event.target.files[0];if(!file)return;try{const parsed=JSON.parse(await file.text());if(!Array.isArray(parsed))throw new Error();const valid=parsed.map(safeNotice).filter(Boolean);if(valid.length!==parsed.length)throw new Error();notices=valid;saveDraft();renderList();resetForm();say(`${notices.length}টি নোটিশ আমদানি হয়েছে।`);}catch{say("সঠিক notices.json ফাইল নির্বাচন করুন।",true);}event.target.value=""; });
  async function initialize(){
    try { const saved=localStorage.getItem(STORAGE_KEY); if(saved){const parsed=JSON.parse(saved);notices=Array.isArray(parsed)?parsed.map(safeNotice).filter(Boolean):[];say("আপনার আগের লোকাল খসড়া খোলা হয়েছে।");} else { const response=await fetch("notices.json",{cache:"no-store"}); if(!response.ok)throw new Error(); const parsed=await response.json(); notices=Array.isArray(parsed)?parsed.map(safeNotice).filter(Boolean):[];say("বর্তমান notices.json লোড হয়েছে।"); } }
    catch { notices=[];say("বর্তমান notices.json লোড হয়নি। প্রয়োজন হলে JSON আমদানি করুন।",true); }
    renderList();resetForm();
  }
  initialize();
})();
