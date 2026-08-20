import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const CACHE_KEY = "sri-site-cache-v2";
const CACHE_TTL = 5 * 60 * 1000;

const C = window.SITE_CONFIG || {};
const defaults = {
  services: [
    ["Architectural Design","⌂","","Thoughtfully designed spaces that combine aesthetics, functionality and efficient planning, tailored to your vision, lifestyle and site requirements."],
    ["Interior Design","▱","","Sophisticated interiors designed around comfort, functionality and personality, with carefully planned materials, lighting, finishes and spatial details."],
    ["Construction Services","▦","","End-to-end construction solutions delivered with quality materials, skilled execution, disciplined project management and a strong focus on safety and durability."],
    ["3D Visualization","◈","","Realistic 3D views and walkthroughs that bring your design to life, helping you understand spaces, finishes and proportions before construction begins."],
    ["Structural Design","▥","","Safe, stable and efficient structural solutions engineered for strength, durability and long-term performance while complementing the architectural design."],
    ["2D Drawings & Plans","◇","","Precise architectural drawings and detailed plans that translate design concepts into clear documentation for approvals, coordination and execution."],
    ["Front Elevation Design","◆","","Distinctive building elevations that create a strong visual identity through balanced proportions, contemporary materials, textures, lighting and architectural details."],
    ["Landscape Design","♧","","Beautiful and functional outdoor environments planned with thoughtful planting, pathways, lighting and hardscape elements to complement the architecture."],
    ["Vastu Consultation","◎","","Vastu-based planning guidance integrated with modern architectural principles to create balanced, practical and harmonious spaces."],
    ["Site Supervision & Project Management","◉","","Professional site coordination and supervision focused on quality, workmanship, safety, timelines and smooth execution from start to completion."],
    ["Interior Furniture Layout","◫","","Efficient furniture planning that optimizes space, movement, comfort and functionality while maintaining a cohesive interior design aesthetic."],
    ["Technical Consultancy","☷","","Practical technical expertise for planning, design coordination, construction decisions and project execution, helping clients make informed choices at every stage."]
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

  document.querySelector("#servicesGrid").innerHTML = data.services.map((x, i) => `
    <div class="service-item">
      <article class="service-card" tabindex="0" role="button" data-service-index="${i}" aria-label="View details for ${esc(x[0])}">
        <div class="icon">${x[2] ? `<img class="service-image" src="${esc(x[2])}" alt="${esc(x[0])}" loading="lazy" decoding="async">` : esc(x[1])}</div>
        <h3>${esc(x[0])}</h3>
        <span class="service-card-more">View Details</span>
      </article>
      <p class="service-description">${esc(x[3] || "Professional service delivered with quality, precision and attention to your project requirements.")}</p>
    </div>`).join("");

  document.querySelectorAll("#servicesGrid .service-card").forEach(card => {
    const open = () => openServiceModal(data.services[Number(card.dataset.serviceIndex)]);
    card.addEventListener("click", open);
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  });

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


let activeService = null;

function openServiceModal(service) {
  if (!service) return;
  activeService = service;

  const modal = document.querySelector("#serviceModal");
  const title = document.querySelector("#serviceModalTitle");
  const description = document.querySelector("#serviceModalDescription");
  const image = document.querySelector("#serviceModalImage");
  const placeholder = document.querySelector("#serviceModalPlaceholder");

  title.textContent = service[0] || "Service";
  description.textContent = service[3] || "Professional service delivered with quality, precision and attention to your project requirements.";

  if (service[2]) {
    image.src = service[2];
    image.alt = service[0] || "Service image";
    image.hidden = false;
    placeholder.hidden = true;
  } else {
    image.removeAttribute("src");
    image.alt = "";
    image.hidden = true;
    placeholder.hidden = false;
    placeholder.textContent = service[1] || "◆";
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  document.querySelector("#serviceModalClose").focus();
}

function closeServiceModal() {
  const modal = document.querySelector("#serviceModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  activeService = null;
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

function getCachedSiteData() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!cached || !cached.data) return null;
    return cached;
  } catch { return null; }
}

function setCachedSiteData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({time: Date.now(), data}));
  } catch {}
}

function renderSiteData(data) {
  render({
    services: data.services?.length ? data.services : defaults.services,
    pricing: data.pricing?.length ? data.pricing : defaults.pricing,
    cities: data.cities?.length ? data.cities : defaults.cities,
    testimonials: data.testimonials?.length ? data.testimonials : defaults.testimonials
  });
}

async function loadFirebaseContent() {
  if (!C.firebase?.enabled) return;

  const cached = getCachedSiteData();
  if (cached?.data) {
    if (cached.data.settings) applySiteSettings(cached.data.settings);
    renderSiteData(cached.data);
  }

  try {
    const app = initializeApp(C.firebase);
    const db = getFirestore(app);

    const [servicesSnap, pricingSnap, citiesSnap, testimonialsSnap, settingsSnap] =
      await Promise.all([
        getDocs(query(collection(db,"services"), where("published","==",true))),
        getDocs(query(collection(db,"projectCosts"), where("published","==",true))),
        getDocs(query(collection(db,"cities"), where("published","==",true))),
        getDocs(query(collection(db,"testimonials"), where("published","==",true))),
        getDoc(doc(db,"siteSettings","main"))
      ]);

    const ordered = snap => snap.docs
      .map(d => ({id:d.id,...d.data()}))
      .sort((a,b) => (a.order ?? 999) - (b.order ?? 999));

    const services = ordered(servicesSnap).map(d => [
      d.name || "Service",
      d.icon || "◇",
      d.iconImage || "",
      d.desc || "Professional service delivered with quality, precision and attention to your project requirements."
    ]);

    const pricing = ordered(pricingSnap).map(d => [
      d.name || "Project", d.desc || "", d.price || "Contact Us"
    ]);

    const cities = ordered(citiesSnap).map(d => d.name).filter(Boolean);

    const testimonials = ordered(testimonialsSnap).map(d => [
      d.name || "Client", d.role || "Client", d.text || "", d.rating || 5
    ]);

    const settings = settingsSnap.exists() ? settingsSnap.data() : {};
    applySiteSettings(settings);

    const data = {services, pricing, cities, testimonials, settings};
    setCachedSiteData(data);
    renderSiteData(data);
  } catch (e) {
    console.warn("Firebase unavailable; cached/fallback content used.", e);
    if (!cached?.data) render(defaults);
  }
}

applySiteSettings({});
const initialCache = getCachedSiteData();
if (initialCache?.data) {
  if (initialCache.data.settings) applySiteSettings(initialCache.data.settings);
  renderSiteData(initialCache.data);
} else {
  render(defaults);
}


document.querySelector("#serviceModalClose")?.addEventListener("click", closeServiceModal);
document.querySelector("#serviceModal [data-service-close]")?.addEventListener("click", closeServiceModal);
document.querySelector("#serviceModal")?.addEventListener("click", e => { if (e.target.id === "serviceModal") closeServiceModal(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.querySelector("#serviceModal")?.classList.contains("open")) {
    closeServiceModal();
  }
});
document.querySelector("#serviceModalCta")?.addEventListener("click", closeServiceModal);

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
