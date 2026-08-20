import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const C = window.SITE_CONFIG || {};
const defaults = {
  services: [
    ["Residential Construction","⌂",""],
    ["Commercial Construction","▦",""],
    ["Renovation & Remodeling","⚒",""],
    ["Interior Design","▱",""],
    ["Project Management","☷",""],
    ["Turnkey Solutions","⚿",""]
  ],
  pricing: [
    ["Basic Project","Ideal for small construction and residential projects.","₹ 10,00,000"],
    ["Standard Project","Perfect for medium scale residential & commercial projects.","₹ 25,00,000"],
    ["Premium Project","High quality construction with premium materials and design.","₹ 50,00,000"],
    ["Custom Project","Fully customized projects as per your requirements.","Contact Us"]
  ],
  cities: ["Delhi NCR","Mumbai","Bengaluru","Hyderabad","Pune","Chennai"],
  testimonials: [
    ["Client Name","Residential Client","Excellent workmanship, transparent communication and timely progress.",5],
    ["Client Name","Commercial Client","Professional project coordination and attention to quality.",5],
    ["Client Name","Homeowner","A dependable team that understood our requirements and delivered.",5]
  ]
};

const esc = (v="") => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function render(data) {
  document.querySelector("#pricingGrid").innerHTML = data.pricing.map(x => `
    <article class="cost-card">
      <div class="cost-icon">◇</div>
      <h3>${esc(x[0])}</h3>
      <p>${esc(x[1])}</p>
      <strong>${esc(x[2])}</strong>
      <small>${x[2] === "Contact Us" ? "Get a Custom Quote" : "Starting From"}</small>
      <a class="btn ${x[2] === "Contact Us" ? "btn-outline" : "btn-orange"}" href="#contact">Get Quote</a>
    </article>`).join("");

  document.querySelector("#servicesGrid").innerHTML = data.services.map(x => `
    <article class="service-card">
      <div class="icon">${x[2] ? `<img src="${esc(x[2])}" alt="${esc(x[0])}" loading="lazy">` : esc(x[1])}</div>
      <h3>${esc(x[0])}</h3>
    </article>`).join("");

  document.querySelector("#citiesGrid").innerHTML = data.cities.map(x => `
    <article class="city-card"><div class="icon">⌖</div><div>${esc(x)}</div></article>`).join("");

  document.querySelector("#testimonialsGrid").innerHTML = data.testimonials.map(x => `
    <article class="testimonial-card">
      <span class="quote-mark">“</span>
      <p>${esc(x[2])}</p>
      <div class="stars">${"★".repeat(Math.max(1,Math.min(5,Number(x[3])||5)))}</div>
      <strong>${esc(x[0])}</strong><small>${esc(x[1])}</small>
    </article>`).join("");

  document.querySelector("#contactService").innerHTML =
    '<option value="">Select Service</option>' +
    data.services.map(x => `<option value="${esc(x[0])}">${esc(x[0])}</option>`).join("");
}

function applySiteSettings(s) {
  const site = {...(C.site || {}), ...(s || {})};
  document.querySelector("#experienceYears").textContent = site.experienceYears || site.experience || "10+";
  document.querySelector("#phoneLink").textContent = site.phone || "";
  document.querySelector("#phoneLink").href = "tel:" + String(site.phone || "").replace(/[^\d+]/g,"");
  document.querySelector("#emailLink").textContent = site.email || "";
  document.querySelector("#emailLink").href = "mailto:" + (site.email || "");
  document.querySelector("#addressText").textContent = site.address || "";
  document.querySelector("#footerCompany").textContent = site.name || "SRI PVT LTD";
  document.querySelector("#currentYear").textContent = new Date().getFullYear();

  if (site.mapQuery) document.querySelector("#mapFrame").src = "https://www.google.com/maps?q=" + encodeURIComponent(site.mapQuery) + "&output=embed";
  if (site.heroEyebrow) document.querySelector("#heroEyebrow").textContent = site.heroEyebrow;
  if (site.heroDescription) document.querySelector("#heroDescription").textContent = site.heroDescription;
  if (site.heroImage) document.querySelector("#heroImage").src = site.heroImage;
  if (site.aboutImage) document.querySelector("#aboutImage").src = site.aboutImage;
  if (site.aboutText) document.querySelector("#aboutText").textContent = site.aboutText;

  if (site.heroHeading) {
    const parts = String(site.heroHeading).split("|");
    document.querySelector("#heroHeading").innerHTML =
      parts.length > 1 ? `${esc(parts[0])}<br><span>${esc(parts.slice(1).join("|"))}</span>` : esc(site.heroHeading);
  }

  const socials = site.social || {};
  [["facebook","socialFacebook"],["instagram","socialInstagram"],["linkedin","socialLinkedin"],["youtube","socialYoutube"]]
    .forEach(([key,id]) => { if (socials[key]) document.querySelector("#"+id).href = socials[key]; });

  const wa = document.querySelector("#whatsappFloat");
  wa.href = "https://wa.me/" + String(site.whatsapp || "").replace(/\D/g,"") +
    "?text=" + encodeURIComponent("Hello, I would like to enquire about your construction services.");
}

async function loadFirebaseContent() {
  if (!C.firebase?.enabled) return;

  try {
    const app = initializeApp(C.firebase);
    const db = getFirestore(app);
    const data = {services:[],pricing:[],cities:[],testimonials:[]};

    for (const [collectionName,key] of [
      ["services","services"],["projectCosts","pricing"],["cities","cities"],["testimonials","testimonials"]
    ]) {
      try {
        const snap = await getDocs(query(collection(db, collectionName), where("published","==",true)));
        const docs = snap.docs.map(d => ({id:d.id,...d.data()})).sort((a,b) => (a.order??999)-(b.order??999));
        if (!docs.length) continue;
        if (key === "services") data.services = docs.map(d => [d.name || "Service", d.icon || "◇", d.iconImage || ""]);
        if (key === "pricing") data.pricing = docs.map(d => [d.name || "Project", d.desc || "", d.price || "Contact Us"]);
        if (key === "cities") data.cities = docs.map(d => d.name).filter(Boolean);
        if (key === "testimonials") data.testimonials = docs.map(d => [d.name || "Client", d.role || "Client", d.text || "", d.rating || 5]);
      } catch (e) { console.warn("Collection read failed:", collectionName, e); }
    }

    const settingsSnap = await getDoc(doc(db,"siteSettings","main"));
    if (settingsSnap.exists()) applySiteSettings(settingsSnap.data());

    render({
      services: data.services.length ? data.services : defaults.services,
      pricing: data.pricing.length ? data.pricing : defaults.pricing,
      cities: data.cities.length ? data.cities : defaults.cities,
      testimonials: data.testimonials.length ? data.testimonials : defaults.testimonials
    });
  } catch (e) {
    console.warn("Firebase unavailable; using fallback content.", e);
  }
}

applySiteSettings({});
render(defaults);

document.querySelector("#menuToggle").addEventListener("click", () => {
  const nav = document.querySelector("#primaryNav");
  const open = nav.classList.toggle("open");
  document.querySelector("#menuToggle").setAttribute("aria-expanded", open);
});
document.querySelectorAll("#primaryNav a").forEach(a => a.addEventListener("click", () => {
  document.querySelector("#primaryNav").classList.remove("open");
  document.querySelector("#menuToggle").setAttribute("aria-expanded","false");
}));

document.querySelector("#contactForm").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const number = String(C.site?.whatsapp || "").replace(/\D/g,"");
  const text =
`New Website Enquiry
Name: ${f.get("name")}
Email: ${f.get("email")}
Phone: ${f.get("phone")}
Service: ${f.get("service") || "Not specified"}
Message: ${f.get("message") || "Not specified"}`;
  window.open("https://wa.me/" + number + "?text=" + encodeURIComponent(text), "_blank", "noopener");
});

loadFirebaseContent();
