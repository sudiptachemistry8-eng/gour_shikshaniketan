const $ = id => document.getElementById(id);
let notices = [];
let apiUrl = "";
let token = "";

function status(t) { $("status").textContent = t; }

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = "gourAdminCb" + Date.now();
    const s = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(Error("Backend উত্তর দিচ্ছে না। URL ও Deployment পরীক্ষা করুন।"));
    }, 15000);
    function cleanup() {
      clearTimeout(timer);
      delete window[cb];
      s.remove();
    }
    window[cb] = d => { cleanup(); resolve(d); };
    s.onerror = () => { cleanup(); reject(Error("Backend সংযোগ হয়নি।")); };
    s.src = url + (url.includes("?") ? "&" : "?") + "action=notices&callback=" + cb;
    document.head.appendChild(s);
  });
}

function getConfig() {
  apiUrl = $("api").value.trim();
  token = $("token").value.trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(apiUrl))
    throw Error("সঠিক Apps Script /exec URL দিন।");
  if (!token) throw Error("Admin Token দিন।");
}

async function load() {
  getConfig();
  status("নোটিশ লোড হচ্ছে…");
  const d = await jsonp(apiUrl);
  if (!d || !Array.isArray(d.notices)) throw Error("Backend থেকে সঠিক নোটিশ তালিকা পাওয়া যায়নি।");
  notices = d.notices;
  render();
  status("সংযুক্ত। মোট " + notices.length + "টি নোটিশ।");
}

function render() {
  const host = $("list");
  host.innerHTML = "";
  if (!notices.length) {
    host.textContent = "কোনও নোটিশ নেই।";
    return;
  }
  notices.forEach((n, i) => {
    const box = document.createElement("article");
    box.className = "notice";
    const h = document.createElement("b");
    h.textContent = (n.title_bn || n.title_en || "শিরোনামহীন") + " — " + (n.date || "");
    const p = document.createElement("p");
    p.textContent = n.body_bn || n.body_en || "";
    const e = document.createElement("button");
    e.type = "button";
    e.textContent = "Edit";
    e.onclick = () => edit(i);
    const d = document.createElement("button");
    d.type = "button";
    d.textContent = "Delete";
    d.className = "secondary";
    d.onclick = () => {
      if (confirm("এই নোটিশ মুছবেন?")) {
        notices.splice(i, 1);
        render();
        publishToBackend();
      }
    };
    box.append(h, p, e, d);
    host.append(box);
  });
}

function reset() {
  HTMLFormElement.prototype.reset.call($("noticeForm"));
  $("editId").value = "";
  $("date").value = new Date().toISOString().slice(0, 10);
  $("formHeading").textContent = "নতুন নোটিশ";
}

function edit(i) {
  const n = notices[i];
  $("editId").value = i;
  $("date").value = n.date || "";
  $("category").value = n.category || "general";
  $("title_bn").value = n.title_bn || "";
  $("body_bn").value = n.body_bn || "";
  $("title_en").value = n.title_en || "";
  $("body_en").value = n.body_en || "";
  $("file").value = n.file || "";
  $("image").value = n.image || "";
  $("pinned").checked = !!n.pinned;
  $("formHeading").textContent = "নোটিশ সম্পাদনা";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/*
 * POST is sent as a real HTML form to the hidden iframe.
 * The Apps Script doPost() returns a postMessage response.
 */
function postForm() {
  return new Promise((resolve, reject) => {
    const frame = $("gasResult");
    const form = document.createElement("form");
    form.method = "POST";
    form.action = apiUrl;
    form.target = "gasResult";
    form.acceptCharset = "UTF-8";

    const fields = {
      action: "save",
      token: token,
      notices: JSON.stringify(notices)
    };
    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });

    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        cleanup();
        reject(Error("৩০ সেকেন্ডেও Backend-এর উত্তর আসেনি। Apps Script → Executions-এ doPost এসেছে কি না দেখুন।"));
      }
    }, 30000);

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      form.remove();
    }

    function onMessage(event) {
      const data = event.data;
      if (!data || data.type !== "GOUR_NOTICE_RESULT") return;
      done = true;
      cleanup();
      if (data.ok) resolve(data.message || "নোটিশ সফলভাবে সংরক্ষিত হয়েছে।");
      else reject(Error(data.message || "নোটিশ সংরক্ষণ করা যায়নি।"));
    }

    window.addEventListener("message", onMessage);
    document.body.appendChild(form);
    status("Google Apps Script-এ নোটিশ পাঠানো হচ্ছে…");
    form.submit();
  });
}

async function publishToBackend() {
  const btn = $("publishBtn");
  try {
    getConfig();
    btn.disabled = true;
    status("নোটিশ প্রকাশের অনুরোধ পাঠানো হচ্ছে…");
    const message = await postForm();
    status(message);
    await load();
  } catch (e) {
    status("প্রকাশ করা যায়নি: " + e.message);
    alert("নোটিশ প্রকাশ করা যায়নি:\n" + e.message);
  } finally {
    btn.disabled = false;
  }
}

async function saveNotice() {
  try {
    getConfig();
    const date = $("date").value;
    const title = $("title_bn").value.trim();
    const body = $("body_bn").value.trim();
    if (!date) throw Error("তারিখ নির্বাচন করুন।");
    if (!title) throw Error("বাংলা শিরোনাম লিখুন।");
    if (!body) throw Error("বাংলা বিবরণ লিখুন।");

    const editValue = $("editId").value;
    const item = {
      id: editValue === "" ? "n" + Date.now() : notices[Number(editValue)].id,
      date,
      category: $("category").value,
      title_bn: title,
      body_bn: body,
      title_en: $("title_en").value.trim(),
      body_en: $("body_en").value.trim(),
      file: $("file").value.trim(),
      image: $("image").value.trim(),
      pinned: $("pinned").checked
    };

    if (editValue === "") notices.unshift(item);
    else notices[Number(editValue)] = item;

    render();
    await publishToBackend();
    reset();
  } catch (e) {
    status("তথ্য পরীক্ষা করুন: " + e.message);
    alert(e.message);
  }
}

$("connect").addEventListener("click", () => load().catch(e => status("সমস্যা: " + e.message)));
$("refresh").addEventListener("click", () => load().catch(e => status("সমস্যা: " + e.message)));
$("reset").addEventListener("click", reset);
$("publishBtn").addEventListener("click", saveNotice);
reset();
