const whatsappNumber = "5547991197855";

const preloader = document.querySelector("#preloader");
const preloaderVideo = preloader?.querySelector("video");
const preloaderSkip = preloader?.querySelector(".preloader-skip");
const preloaderDuration = 2000;

if (preloader) document.body.classList.add("is-loading");

const finishPreloader = () => {
    if (!preloader || preloader.classList.contains("is-finished")) return;

    preloader.classList.add("is-finished");
    document.body.classList.remove("is-loading");
    preloaderVideo?.pause();
    document.dispatchEvent(new Event("nishi:ready"));
    window.setTimeout(() => preloader.remove(), 760);
};

preloaderVideo?.addEventListener("loadeddata", () => {
    preloaderVideo.playbackRate = 1.8;
    preloaderVideo.play().catch(() => {});
}, { once: true });

preloaderSkip?.addEventListener("click", finishPreloader);
window.setTimeout(finishPreloader, preloaderDuration);

// Fundos decorativos carregam apenas no celular e nas seções visíveis.
(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const backgrounds = new Map();
    const source = new URL("../assets/img/video-nuvens.mp4", document.currentScript.src).href;

    const updatePlayback = ({ video, visible }) => {
        if (visible && !document.hidden && !reducedMotion.matches) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(({ target, isIntersecting }) => {
            const background = backgrounds.get(target);
            if (!background) return;
            background.visible = isIntersecting;
            if (isIntersecting && !background.video.hasAttribute("src")) {
                background.video.src = source;
            }
            updatePlayback(background);
        });
    });

    const syncBackgrounds = () => {
        if (!mobile.matches) {
            observer.disconnect();
            backgrounds.forEach(({ layer, video }, section) => {
                video.pause();
                video.removeAttribute("src");
                video.load();
                layer.remove();
                section.classList.remove("has-mobile-clouds");
            });
            backgrounds.clear();
            return;
        }

        document.querySelectorAll("main > section").forEach((section) => {
            if (backgrounds.has(section)) return;
            const layer = document.createElement("div");
            layer.className = "mobile-clouds";
            layer.setAttribute("aria-hidden", "true");
            const video = document.createElement("video");
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.defaultMuted = true;
            video.playsInline = true;
            video.preload = "none";
            video.tabIndex = -1;
            video.setAttribute("muted", "");
            video.setAttribute("playsinline", "");
            const background = { layer, video, visible: false };
            video.addEventListener("loadeddata", () => updatePlayback(background));
            layer.append(video);
            section.prepend(layer);
            section.classList.add("has-mobile-clouds");
            backgrounds.set(section, background);
            observer.observe(section);
        });
    };

    mobile.addEventListener("change", syncBackgrounds);
    reducedMotion.addEventListener("change", () => backgrounds.forEach(updatePlayback));
    document.addEventListener("visibilitychange", () => backgrounds.forEach(updatePlayback));
    syncBackgrounds();
})();

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const compactNavigation = window.matchMedia("(max-width: 1120px)");

const setMenuOpen = (isOpen, restoreFocus = false) => {
    if (!menuToggle || !mainNav) return;
    isOpen = isOpen && compactNavigation.matches;
    mainNav.classList.toggle("open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
    if (restoreFocus && compactNavigation.matches) menuToggle.focus({ preventScroll: true });
};

compactNavigation.addEventListener("change", () => {
    setMenuOpen(false);
});

menuToggle?.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

mainNav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenuOpen(false, true);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mainNav?.classList.contains("open")) {
        setMenuOpen(false, true);
    }
});

document.addEventListener("click", (event) => {
    if (!mainNav?.contains(event.target) && !menuToggle?.contains(event.target)) {
        setMenuOpen(false);
    }
});

document.addEventListener("focusin", (event) => {
    if (!mainNav?.contains(event.target) && !menuToggle?.contains(event.target)) {
        setMenuOpen(false);
    }
});

const getHeaderHeight = () => document.querySelector(".site-header")?.offsetHeight || 0;

const scrollToSection = (target, behavior = "smooth") => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) behavior = "auto";
    const smoother = window.ScrollSmoother?.get();
    if (smoother) {
        smoother.scrollTo(target, behavior === "smooth", `top ${getHeaderHeight()}px`);
        return;
    }
    const top = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight();
    window.scrollTo({ top, behavior: behavior === "auto" ? "instant" : behavior });
};

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        setMenuOpen(false);
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
    .filter((link) => link.getAttribute("href")?.startsWith("#"))
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

const setActiveLink = () => {
    if (!sections.length) return;
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
document.addEventListener("nishi:scroll-update", setActiveLink);
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

const clinicMedia = [
    { type: "image", src: "./assets/img/clinica1.jpg", alt: "Recepção da Nishi Medicina Oriental" },
    { type: "image", src: "./assets/img/clinica2.jpg", alt: "Área externa da clínica Nishi" },
    { type: "image", src: "./assets/img/clinica3.jpg", alt: "Sala de atendimento da Nishi Medicina Oriental" },
    { type: "image", src: "./assets/img/clinica4.jpg", alt: "Detalhes do ambiente da clínica Nishi" },
    { type: "video", src: "./assets/img/clinicavideo.mp4", poster: "./assets/img/clinica4.jpg", label: "Vídeo dos ambientes da clínica Nishi" }
];
const collagePhotos = [...document.querySelectorAll(".clinic-photo")];
const collageToggle = document.querySelector(".collage-toggle");
let collageIndex = 0;

const createClinicMedia = (item) => {
    if (item.type === "video") {
        const video = document.createElement("video");
        video.src = item.src;
        video.poster = item.poster;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.defaultMuted = true;
        video.preload = "metadata";
        video.playsInline = true;
        video.setAttribute("muted", "");
        video.setAttribute("aria-label", item.label);
        video.addEventListener("canplay", () => video.play().catch(() => {}), { once: true });
        return video;
    }

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.alt;
    image.decoding = "async";
    return image;
};

collageToggle?.addEventListener("click", () => {
    collageIndex = (collageIndex + collagePhotos.length) % clinicMedia.length;
    collageToggle.disabled = true;

    collagePhotos.forEach((photo, index) => {
        photo.querySelector("video")?.pause();
        photo.classList.add("is-changing");
        window.setTimeout(() => {
            const item = clinicMedia[(collageIndex + index) % clinicMedia.length];
            photo.replaceChildren(createClinicMedia(item));
            photo.classList.remove("is-changing");
        }, 140);
    });

    window.setTimeout(() => {
        collageToggle.disabled = false;
        collageToggle.setAttribute("aria-label", "Mostrar próxima seleção de imagens e vídeo da clínica");
    }, 220);
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
