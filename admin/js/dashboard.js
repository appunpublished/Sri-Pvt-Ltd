import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore, collection, getDocs, getDoc, doc, setDoc, addDoc, updateDoc, deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const C = window.SITE_CONFIG || {};
const state = {app:null,auth:null,db:null,collections:{services:[],projectCosts:[],cities:[],testimonials:[]},settings:{},seo:{},media:[]};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function status(msg,error=false){
  const el=$("#status"); el.textContent=msg; el.className="status-bar show"+(error?" error":"");
  clearTimeout(status.t); status.t=setTimeout(()=>el.className="status-bar",3500);
}

const configs = {
  services:{title:"Service",fields:[["name","Service Name","text",1],["icon","Icon","text",0],["iconImage","Service Image URL","text",0],["desc","Description","textarea",1],["published","Published","checkbox",0]]},
  projectCosts:{title:"Project Package",fields:[["name","Package Name","text",1],["price","Price","text",1],["note","Price Note","text",0],["desc","Description","textarea",1],["icon","Icon","text",0],["published","Published","checkbox",0]]},
  cities:{title:"City",fields:[["name","City Name","text",1],["icon","Icon","text",0],["published","Published","checkbox",0]]},
  testimonials:{title:"Testimonial",fields:[["name","Client Name","text",1],["role","Client Designation","text",0],["rating","Rating 1–5","number",1],["text","Testimonial","textarea",1],["image","Client Image URL","text",0],["published","Published","checkbox",0]]}
};

async function readCollection(name){
  const snap=await getDocs(collection(state.db,name));
  return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order??999)-(b.order??999));
}

async function loadAll(){
  state.collections.services=await readCollection("services");
  state.collections.projectCosts=await readCollection("projectCosts");
  state.collections.cities=await readCollection("cities");
  state.collections.testimonials=await readCollection("testimonials");
  const main=await getDoc(doc(state.db,"siteSettings","main"));
  const seo=await getDoc(doc(state.db,"siteSettings","seo"));
  state.settings=main.exists()?main.data():{};
  state.seo=seo.exists()?seo.data():{};
  try{state.media=await readCollection("media");}catch{state.media=[];}
  renderAll(); fillSettings(); fillSeo(); renderMedia();
}

function renderAll(){
  $("#countServices").textContent=state.collections.services.length;
  $("#countPricing").textContent=state.collections.projectCosts.length;
  $("#countCities").textContent=state.collections.cities.length;
  $("#countTestimonials").textContent=state.collections.testimonials.length;
  $("#systemStatus").innerHTML=[
    ["Firebase","Connected",true],["Authentication","Authorised",true],
    ["Firestore","Connected",true],["Cloudinary",C.cloudinary?.enabled?"Configured":"Not configured",!!C.cloudinary?.enabled]
  ].map(x=>`<div class="system-row"><span>${esc(x[0])}</span><span class="${x[2]?"ok":"warn"}">${esc(x[1])}</span></div>`).join("");

  renderList("services","#servicesList","#serviceSearch","#serviceMeta");
  renderList("projectCosts","#pricingList","#pricingSearch","#pricingMeta");
  renderList("cities","#citiesList","#citySearch","#cityMeta");
  renderList("testimonials","#testimonialsList","#testimonialSearch","#testimonialMeta");
}

function renderList(col,target,searchSel,metaSel){
  const q=($(searchSel)?.value||"").toLowerCase().trim();
  const arr=state.collections[col].filter(x=>JSON.stringify(x).toLowerCase().includes(q));
  $(metaSel).textContent=`${arr.length} of ${state.collections[col].length}`;
  $(target).innerHTML=arr.length?arr.map(item=>`
    <article class="content-row">
      <span class="drag">⋮⋮</span>
      <div class="content-main"><strong>${esc(item.name||"Untitled")}</strong><p>${esc(item.desc||item.text||item.price||"")}</p><span class="pill ${item.published===false?"hidden":""}">${item.published===false?"Hidden":"Published"}</span></div>
      <div class="row-actions"><button data-a="edit" data-id="${esc(item.id)}">Edit</button><button class="delete" data-a="delete" data-id="${esc(item.id)}">Delete</button></div>
    </article>`).join(""):`<div class="empty">No items found.</div>`;
  $$(target+" [data-a]").forEach(b=>b.addEventListener("click",()=>itemAction(col,b.dataset.a,b.dataset.id)));
}

async function itemAction(col,action,id){
  const item=state.collections[col].find(x=>x.id===id);
  if(!item)return;
  if(action==="edit"){openModal(col,item);return;}
  if(confirm("Delete this item? This cannot be undone.")){await deleteDoc(doc(state.db,col,id));status("Item deleted.");await loadAll();}
}


const SERVICE_ICONS = [
  ["⌂","Residential / Home"],["▦","Commercial / Building"],["⚒","Renovation / Tools"],
  ["▱","Interior Design"],["☷","Project Management"],["⚿","Turnkey / Key"],
  ["◈","Architecture / Design"],["▥","Civil Construction"],["▰","Infrastructure"],
  ["♧","Landscape"],["◫","Electrical"],["♨","Plumbing"],["◉","Quality / Inspection"],["◆","Custom Service"]
];

function serviceIconPicker(item={}) {
  const current = item.icon || "⌂";
  return `
    <div class="service-icon-editor">
      <div class="icon-editor-label">Service Icon</div>
      <div class="icon-picker">
        ${SERVICE_ICONS.map(([icon,label]) => `
          <button type="button" class="icon-choice ${current===icon?'selected':''}" data-icon="${esc(icon)}" title="${esc(label)}">
            <span>${esc(icon)}</span><small>${esc(label)}</small>
          </button>`).join("")}
      </div>
      <input type="hidden" name="icon" id="serviceIconValue" value="${esc(current)}">
      <div class="or-divider"><span>OR</span></div>
      <label>Service Image URL
        <input name="iconImage" id="serviceIconImage" type="url" value="${esc(item.iconImage||"")}" placeholder="Upload below or paste a Cloudinary URL">
      </label>
      <div class="service-upload-row">
        <label class="secondary upload-service-image" for="serviceImageFile">Upload Service Image</label>
        <input id="serviceImageFile" type="file" accept="image/jpeg,image/png,image/webp">
        <span id="serviceImageStatus"></span>
      </div>
      <small class="field-help">Images are automatically center-cropped, resized to 256 × 256 and converted to WebP before upload.</small>
    </div>`;
}


async function prepareAboutImage(file) {
  if (!file) return null;
  if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
    throw new Error("Only JPG, PNG and WebP images are allowed.");
  }
  if (file.size > 12 * 1024 * 1024) throw new Error("Original image must be 12 MB or smaller.");

  const bitmap = await createImageBitmap(file);
  const targetW = 1200, targetH = 800;
  const targetRatio = targetW / targetH;
  const sourceRatio = bitmap.width / bitmap.height;

  let sx = 0, sy = 0, sw = bitmap.width, sh = bitmap.height;
  if (sourceRatio > targetRatio) {
    sw = Math.round(bitmap.height * targetRatio);
    sx = Math.round((bitmap.width - sw) / 2);
  } else {
    sh = Math.round(bitmap.width / targetRatio);
    sy = Math.round((bitmap.height - sh) / 2);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, targetW, targetH);

  return new Promise((resolve,reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("Could not process image.")),
      "image/webp", .88)
  );
}

async function uploadCloudinaryProcessed(file, folder, processor, statusId, filename) {
  if (!C.cloudinary?.enabled) throw new Error("Cloudinary is not configured.");
  const statusEl = statusId ? $("#" + statusId) : null;
  if (statusEl) statusEl.textContent = "Processing…";

  const blob = await processor(file);
  const body = new FormData();
  body.append("file", blob, filename);
  body.append("upload_preset", C.cloudinary.uploadPreset);
  body.append("folder", (C.cloudinary.folder || "website") + "/" + folder);

  if (statusEl) statusEl.textContent = "Uploading…";
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${C.cloudinary.cloudName}/image/upload`,
    {method:"POST", body}
  );
  const data = await response.json();
  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Cloudinary upload failed.");
  }
  if (statusEl) statusEl.textContent = "Uploaded";
  return data.secure_url;
}

async function prepareServiceImage(file) {
  if (!file) return null;
  if (!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Only JPG, PNG and WebP images are allowed.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Original image must be 12 MB or smaller.");
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = Math.round((bitmap.width - side) / 2);
  const sy = Math.round((bitmap.height - side) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, 256, 256);
  return new Promise((resolve,reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Could not process image.")), "image/webp", .88));
}

async function uploadServiceImage(file) {
  return uploadCloudinaryProcessed(
    file, "services", prepareServiceImage, "serviceImageStatus", "service-icon.webp"
  );
}

function openModal(col,item=null){
  const cfg=configs[col];
  $("#modalTitle").textContent=item?`Edit ${cfg.title}`:`Add ${cfg.title}`;
  $("#modalEyebrow").textContent=cfg.title.toUpperCase();
  $("#modalBg").dataset.col=col;
  $("#modalBg").dataset.id=item?.id||"";
  $("#itemForm").innerHTML=cfg.fields.map(([key,label,type,req])=>{
    if(col==="services" && key==="icon") return serviceIconPicker(item||{});
    if(col==="services" && key==="iconImage") return "";
    if(type==="checkbox") return `<label class="check"><input name="${key}" type="checkbox" ${item?.[key]!==false?"checked":""}> ${esc(label)}</label>`;
    return `<label>${esc(label)}${type==="textarea"
      ? `<textarea name="${key}" rows="4" ${req?"required":""}>${esc(item?.[key]||"")}</textarea>`
      : `<input name="${key}" type="${type}" value="${esc(item?.[key]||"")}" ${req?"required":""}>`}</label>`;
  }).join("");
  $("#modalBg").classList.add("open");

  if(col==="services"){
    $$(".icon-choice").forEach(btn => btn.onclick=()=>{
      $$(".icon-choice").forEach(x=>x.classList.remove("selected"));
      btn.classList.add("selected");
      $("#serviceIconValue").value=btn.dataset.icon;
    });
    $("#serviceImageFile").onchange=async e=>{
      const file=e.target.files?.[0];
      if(!file)return;
      try{
        const url=await uploadServiceImage(file);
        $("#serviceIconImage").value=url;
      }catch(err){
        $("#serviceImageStatus").textContent=err.message;
        status(err.message,true);
      }
    };
  }
}

function closeModal(){$("#modalBg").classList.remove("open")}
$("#modalClose").onclick=closeModal;$("#modalCancel").onclick=closeModal;
$("#modalBg").onclick=e=>{if(e.target===$("#modalBg"))closeModal()};

$("#itemForm").onsubmit=async e=>{
  e.preventDefault();const col=$("#modalBg").dataset.col,id=$("#modalBg").dataset.id,fd=new FormData(e.target),data={};
  configs[col].fields.forEach(([key,,type])=>{
    if(key==="iconImage" && col==="services") {
      data[key]=String($("#serviceIconImage")?.value||"").trim();
      return;
    }
    if(type==="checkbox")data[key]=fd.has(key);
    else if(type==="number")data[key]=Math.max(1,Math.min(5,Number(fd.get(key)||5)));
    else data[key]=String(fd.get(key)||"").trim();
  });
  data.order=id?(state.collections[col].find(x=>x.id===id)?.order??0):state.collections[col].length;
  data.updatedAt=serverTimestamp();
  if(id)await updateDoc(doc(state.db,col,id),data);else{data.createdAt=serverTimestamp();await addDoc(collection(state.db,col),data);}
  closeModal();status(id?"Changes saved.":"Item added.");await loadAll();
};

function fillSettings(){
  const s=state.settings||{},map={
    companyName:s.name,phone:s.phone,whatsapp:s.whatsapp,email:s.email,address:s.address,addressUrl:s.addressUrl,workingHours:s.workingHours,mapQuery:s.mapQuery,mapUrl:s.mapUrl,
    heroEyebrow:s.heroEyebrow,heroHeading:s.heroHeading,heroDescription:s.heroDescription,heroImage:s.heroImage,aboutImage:s.aboutImage,
    experienceYears:s.experienceYears,aboutText:s.aboutText,facebook:s.social?.facebook,instagram:s.social?.instagram,linkedin:s.social?.linkedin,youtube:s.social?.youtube
  };
  Object.entries(map).forEach(([id,v])=>{if($("#"+id))$("#"+id).value=v||""});
  renderAboutImagePreview();
}
function renderAboutImagePreview(){
  const url = String($("#aboutImage")?.value || "").trim();
  const box = $("#aboutImagePreview");
  if (!box) return;
  box.innerHTML = url ? `<img src="${esc(url)}" alt="About image preview">` : "";
}
$("#aboutImage")?.addEventListener("input", renderAboutImagePreview);
$("#aboutImageFile")?.addEventListener("change", async e=>{
  const file = e.target.files?.[0];
  if (!file) return;
  try{
    const url = await uploadCloudinaryProcessed(
      file, "about", prepareAboutImage, "aboutImageStatus", "about.webp"
    );
    $("#aboutImage").value = url;
    renderAboutImagePreview();
  }catch(err){
    $("#aboutImageStatus").textContent = err.message;
    status(err.message, true);
  }
});
$("#saveSettings").onclick=async()=>{
  const data={name:$("#companyName").value.trim(),phone:$("#phone").value.trim(),whatsapp:$("#whatsapp").value.trim(),email:$("#email").value.trim(),
    address:$("#address").value.trim(),addressUrl:$("#addressUrl").value.trim(),workingHours:$("#workingHours").value.trim(),mapQuery:$("#mapQuery").value.trim(),mapUrl:$("#mapUrl").value.trim(),
    heroEyebrow:$("#heroEyebrow").value.trim(),heroHeading:$("#heroHeading").value.trim(),heroDescription:$("#heroDescription").value.trim(),
    heroImage:$("#heroImage").value.trim(),aboutImage:$("#aboutImage").value.trim(),experienceYears:$("#experienceYears").value.trim(),aboutText:$("#aboutText").value.trim(),
    social:{facebook:$("#facebook").value.trim(),instagram:$("#instagram").value.trim(),linkedin:$("#linkedin").value.trim(),youtube:$("#youtube").value.trim()},updatedAt:serverTimestamp()};
  await setDoc(doc(state.db,"siteSettings","main"),data,{merge:true});state.settings={...state.settings,...data};status("Website settings saved.");
};

function fillSeo(){const s=state.seo||{};$("#seoTitle").value=s.title||"";$("#seoDescription").value=s.description||"";$("#seoKeywords").value=s.keywords||"";$("#seoCanonical").value=s.canonical||C.site?.url||"";$("#seoOgImage").value=s.ogImage||""}
$("#saveSeo").onclick=async()=>{
  const data={title:$("#seoTitle").value.trim(),description:$("#seoDescription").value.trim(),keywords:$("#seoKeywords").value.trim(),canonical:$("#seoCanonical").value.trim(),ogImage:$("#seoOgImage").value.trim(),updatedAt:serverTimestamp()};
  await setDoc(doc(state.db,"siteSettings","seo"),data,{merge:true});state.seo={...state.seo,...data};status("SEO settings saved.");
};

async function uploadImage(file){
  if(!C.cloudinary?.enabled){status("Cloudinary is not configured.",true);return}
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){status("Only JPG, PNG and WebP are allowed.",true);return}
  if(file.size>8*1024*1024){status("Maximum image size is 8 MB.",true);return}
  const progress=$("#uploadProgress"),bar=$("#uploadProgress span"),result=$("#uploadResult");
  progress.style.display="block";bar.style.width="8%";result.textContent="Uploading...";
  try{
    const body=new FormData();body.append("file",file);body.append("upload_preset",C.cloudinary.uploadPreset);body.append("folder",C.cloudinary.folder||"website");
    const r=await fetch(`https://api.cloudinary.com/v1_1/${C.cloudinary.cloudName}/image/upload`,{method:"POST",body});
    bar.style.width="85%";const j=await r.json();if(!r.ok||!j.secure_url)throw new Error(j.error?.message||"Upload failed");
    bar.style.width="100%";
    const asset={name:j.original_filename||file.name,url:j.secure_url,publicId:j.public_id,width:j.width,height:j.height,format:j.format,size:j.bytes,createdAt:serverTimestamp()};
    try{await addDoc(collection(state.db,"media"),asset)}catch(e){console.warn("Media metadata not saved",e)}
    result.innerHTML=`<div class="upload-preview"><img src="${esc(j.secure_url)}" alt="Uploaded image"></div><input id="uploadedUrl" readonly value="${esc(j.secure_url)}"><button type="button" class="secondary copy" id="copyUrl">Copy URL</button>`;
    $("#copyUrl").onclick=async()=>{await navigator.clipboard.writeText(j.secure_url);$("#copyUrl").textContent="Copied"};
    status("Image uploaded successfully.");state.media=await readCollection("media");renderMedia();
  }catch(e){console.error(e);result.textContent=e.message||"Upload failed";status("Cloudinary upload failed.",true)}
}
$("#imageUpload").onchange=e=>{if(e.target.files[0])uploadImage(e.target.files[0])};

function renderMedia(){
  $("#mediaMeta").textContent=`${state.media.length} image${state.media.length===1?"":"s"}`;
  $("#mediaGrid").innerHTML=state.media.length?state.media.map(x=>`
    <article class="media-card"><img src="${esc(x.url)}" alt="${esc(x.name||"Website image")}"><div class="media-card-body"><strong>${esc(x.name||"Image")}</strong><small>${esc(x.format||"image")} • ${x.width||"?"}×${x.height||"?"}</small><br><button class="secondary" data-copy="${esc(x.url)}">Copy URL</button></div></article>`).join(""):`<div class="empty">No uploaded images yet.</div>`;
  $$("#mediaGrid [data-copy]").forEach(b=>b.onclick=async()=>{await navigator.clipboard.writeText(b.dataset.copy);b.textContent="Copied"});
}

$("#addService").onclick=()=>openModal("services");$("#addPricing").onclick=()=>openModal("projectCosts");$("#addCity").onclick=()=>openModal("cities");$("#addTestimonial").onclick=()=>openModal("testimonials");
["#serviceSearch","#pricingSearch","#citySearch","#testimonialSearch"].forEach((s,i)=>$(s).oninput=renderAll);

$$("[data-section]").forEach(a=>a.addEventListener("click",e=>{
  e.preventDefault();const id=a.dataset.section;
  $$(".admin-section").forEach(s=>s.classList.toggle("active",s.id===id));
  $$(".sidebar nav a").forEach(x=>x.classList.toggle("active",x.dataset.section===id));
  $("#pageTitle").textContent={dashboard:"Dashboard",settings:"Website Settings",services:"Services",pricing:"Project Cost",cities:"Cities",testimonials:"Testimonials",media:"Media Library",seo:"SEO Settings"}[id]||"Dashboard";
  $("#sidebar").classList.remove("open");history.replaceState(null,"","#"+id);
}));
$("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");
$("#logout").onclick=async()=>{await signOut(state.auth);location.href="index.html"};

async function boot(){
  if(!C.firebase?.enabled){status("Firebase is disabled in config.js.",true);return}
  try{
    state.app=initializeApp(C.firebase);state.auth=getAuth(state.app);state.db=getFirestore(state.app);
    onAuthStateChanged(state.auth,async user=>{
      if(!user){location.href="index.html";return}
      const admin=await getDoc(doc(state.db,"admins",user.uid));
      if(!admin.exists()||admin.data().active!==true){await signOut(state.auth);alert("This account is not authorised.");location.href="index.html";return}
      $("#adminUser").textContent=user.email||"Administrator";await loadAll();
    });
  }catch(e){console.error(e);status("Firebase initialisation failed.",true)}
}
const initial=location.hash.slice(1);const valid=["dashboard","settings","services","pricing","cities","testimonials","media","seo"];
if(initial&&valid.includes(initial)){$$(".admin-section").forEach(s=>s.classList.toggle("active",s.id===initial));$$(".sidebar nav a").forEach(a=>a.classList.toggle("active",a.dataset.section===initial));$("#pageTitle").textContent=initial[0].toUpperCase()+initial.slice(1)}
boot();
