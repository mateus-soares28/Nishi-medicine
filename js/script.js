const whatsappNumber = "554730251234";

const preloader = document.querySelector("#preloader");
const preloaderVideo = preloader?.querySelector("video");
const preloaderSkip = preloader?.querySelector(".preloader-skip");
const preloaderDuration = 4400;

document.body.classList.add("is-loading");

const finishPreloader = () => {
    if (!preloader || preloader.classList.contains("is-finished")) return;

    preloader.classList.add("is-finished");
    document.body.classList.remove("is-loading");
    preloaderVideo?.pause();
    window.setTimeout(() => preloader.remove(), 760);
};

preloaderVideo?.addEventListener("loadeddata", () => {
    preloaderVideo.playbackRate = 1.8;
    preloaderVideo.play().catch(() => {});
}, { once: true });

preloaderSkip?.addEventListener("click", finishPreloader);
window.setTimeout(finishPreloader, preloaderDuration);

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

menuToggle?.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});

const getHeaderHeight = () => document.querySelector(".site-header")?.offsetHeight || 0;

const scrollToSection = (target, behavior = "smooth") => {
    const top = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
    window.scrollTo({ top, behavior });
};

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        mainNav?.classList.remove("open");
        menuToggle?.setAttribute("aria-expanded", "false");
        history.pushState(null, "", link.getAttribute("href"));
        scrollToSection(target);
    });
});

window.addEventListener("load", () => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target) scrollToSection(target, "auto");
});

const navLinks = document.querySelectorAll(".main-nav a");
const sections = [...navLinks]
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

const setActiveLink = () => {
    const marker = getHeaderHeight() + 80;
    const current = sections.reduce((active, section) => {
        const top = section.getBoundingClientRect().top;
        return top <= marker ? section : active;
    }, sections[0]);

    navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`);
    });
};

window.addEventListener("scroll", setActiveLink, { passive: true });
setActiveLink();

let reviewIndex = 0;
const reviewCards = document.querySelectorAll(".review-card");
const dots = document.querySelectorAll(".pager b");

const paintReviews = () => {
    dots.forEach((dot, index) => {
        dot.style.background = index === reviewIndex ? "var(--gold)" : "transparent";
    });
};

document.querySelectorAll(".slider-btn").forEach((button) => {
    button.addEventListener("click", () => {
        const dir = Number(button.dataset.dir);
        reviewIndex = (reviewIndex + dir + dots.length) % dots.length;
        paintReviews();

        if (window.innerWidth <= 760 && reviewCards[reviewIndex % reviewCards.length]) {
            reviewCards[reviewIndex % reviewCards.length].scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        }
    });
});

paintReviews();

const clinicImages = [
    "./assets/img/clinica1.webp",
    "./assets/img/clinica2.webp",
    "./assets/img/clinica3.webp",
    "./assets/img/clinica4.webp",
    "./assets/img/clinica5.webp"
];
const collagePhotos = [...document.querySelectorAll(".clinic-photo")];
const collageToggle = document.querySelector(".collage-toggle");
let collageIndex = 0;

collageToggle?.addEventListener("click", () => {
    collageIndex = (collageIndex + 3) % clinicImages.length;

    collagePhotos.forEach((photo, index) => {
        const image = photo.querySelector("img");
        photo.classList.add("is-changing");
        window.setTimeout(() => {
            image.src = clinicImages[(collageIndex + index) % clinicImages.length];
            photo.classList.remove("is-changing");
        }, 140);
    });
});

const form = document.querySelector("#whatsappForm");
const status = document.querySelector(".form-status");

form?.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const nome = String(data.get("nome")).trim();
    const telefone = String(data.get("telefone")).trim();
    const email = String(data.get("email")).trim();
    const assunto = String(data.get("assunto")).trim();
    const mensagem = String(data.get("mensagem")).trim();

    if (!nome || !telefone || !email || !assunto || !mensagem) {
        status.textContent = "Preencha todos os campos obrigatórios.";
        return;
    }

    const text = [
        "Olá, Nishi Medicina Oriental.",
        "Quero enviar uma mensagem pelo site.",
        "",
        `Nome: ${nome}`,
        `Telefone/WhatsApp: ${telefone}`,
        `E-mail: ${email}`,
        `Assunto: ${assunto}`,
        `Mensagem: ${mensagem}`
    ].join("\n");

    status.textContent = "Abrindo WhatsApp...";
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    form.reset();
});
