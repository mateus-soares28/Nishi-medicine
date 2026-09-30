(() => {
    const { gsap, ScrollTrigger, ScrollSmoother } = window;
    // Sem os plugins, o conteúdo permanece visível e a rolagem continua nativa.
    if (!gsap || !ScrollTrigger) return;

    // Ajuste aqui a região da tela em que os elementos aparecem.
    // Também aceita data-reveal-start e data-reveal-end em um elemento específico.
    const settings = {
        start: "clamp(top 90%)",
        end: "clamp(top 60%)",
        scrub: true,
        smooth: 1,
        entranceDuration: 0.8,
        edgeOffset: 32,
        markers: false
    };

    gsap.registerPlugin(ScrollTrigger);
    if (ScrollSmoother) gsap.registerPlugin(ScrollSmoother);

    const opening = document.querySelector("#preloader");
    const pageReady = !opening || opening.classList.contains("is-finished")
        ? Promise.resolve()
        : new Promise((resolve) => document.addEventListener("nishi:ready", resolve, { once: true }));

    Promise.all([pageReady, document.fonts.ready]).then(() => {
        const media = gsap.matchMedia();

        media.add({
            reduceMotion: "(prefers-reduced-motion: reduce)",
            desktop: "(min-width: 1121px) and (pointer: fine)",
            all: "(min-width: 0px)"
        }, (context) => {
            if (context.conditions.reduceMotion) return;

            document.documentElement.classList.add("has-scroll-animations");
            const events = new AbortController();
            let smoother;
            const refresh = gsap.delayedCall(0.15, () => ScrollTrigger.refresh()).pause();

            if (context.conditions.desktop && ScrollSmoother) {
                document.documentElement.classList.add("has-smooth-scroll");
                smoother = ScrollSmoother.create({
                    wrapper: "#smooth-wrapper",
                    content: "#smooth-content",
                    smooth: settings.smooth,
                    smoothTouch: false,
                    effects: false,
                    onUpdate: () => document.dispatchEvent(new Event("nishi:scroll-update"))
                });
            }

            // Cartões e molduras entram inteiros para não recortar suas imagens.
            // Descendentes não recebem uma segunda animação sobre a do pai.
            const selector = [
                "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "strong", "small",
                "b", "em", "address", "img:not(.whatsapp-button-icon)",
                ".actions", ".process-step", ".therapy-card", ".therapy-more",
                ".therapy-page-card", ".clinic-photo", ".impact-item figure",
                ".oval-photo", ".doctor-photo", ".feature", ".google-rating",
                ".review-card", ".contact-form", ".map-frame", ".brand", ".footer-line"
            ].join(", ");
            const targets = [...document.querySelectorAll("main > section, .site-footer")]
                .flatMap((section) => [...section.querySelectorAll(selector)]
                    .filter((element) => !element.parentElement.closest(selector)));

            // Mede o layout antes de aplicar qualquer deslocamento.
            const entries = targets.map((element, index) => {
                const rect = element.getBoundingClientRect();
                const center = rect.left + rect.width / 2;
                const centered = Math.abs(center - window.innerWidth / 2) < window.innerWidth * 0.1;
                const direction = element.dataset.revealFrom || (centered
                    ? (index % 2 === 0 ? "left" : "right")
                    : (center < window.innerWidth / 2 ? "left" : "right"));
                return {
                    element,
                    direction,
                    entrance: rect.top < window.innerHeight * 0.9 && rect.bottom > 0,
                    x: Number(gsap.getProperty(element, "x")) || 0,
                    opacity: Number(gsap.getProperty(element, "opacity"))
                };
            });

            entries.forEach(({ element, direction, entrance, x, opacity }) => {
                element.classList.add("scroll-reveal-target");
                const fromX = () => {
                    const rect = element.getBoundingClientRect();
                    const currentX = Number(gsap.getProperty(element, "x")) || 0;
                    // Desconta a transformação atual para recalcular também no resize.
                    const left = rect.left - currentX + x;
                    return x + (direction === "left"
                        ? -(left + rect.width + settings.edgeOffset)
                        : window.innerWidth - left + settings.edgeOffset);
                };
                const tween = gsap.fromTo(element, { x: fromX, opacity: 0 }, {
                    x,
                    opacity,
                    duration: entrance ? settings.entranceDuration : 1,
                    ease: "power2.out",
                    clearProps: "transform,opacity",
                    // A primeira dobra aparece sem exigir que o visitante role.
                    // As demais animações avançam e retrocedem junto com o scroll.
                    ...(entrance ? {} : {
                        scrollTrigger: {
                            trigger: element,
                            start: element.dataset.revealStart || settings.start,
                            end: element.dataset.revealEnd || settings.end,
                            scrub: settings.scrub,
                            markers: settings.markers,
                            invalidateOnRefresh: true
                        }
                    })
                });
                // Foco por teclado revela imediatamente links e campos acessados.
                element.addEventListener("focusin", () => {
                    tween.scrollTrigger?.kill(false);
                    tween.kill();
                    gsap.set(element, { clearProps: "transform,opacity" });
                }, { signal: events.signal });
            });

            document.querySelectorAll("#smooth-content img").forEach((image) => {
                image.addEventListener("load", () => refresh.restart(true), { signal: events.signal });
            });
            window.addEventListener("load", () => refresh.restart(true), { once: true, signal: events.signal });
            ScrollTrigger.refresh();

            // Recalcula links diretos depois da criação dos wrappers e dos títulos.
            if (window.location.hash) {
                const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
                if (target) scrollToSection(target, "auto");
            }

            return () => {
                events.abort();
                refresh.kill();
                targets.forEach((element) => element.classList.remove("scroll-reveal-target"));
                smoother?.kill();
                document.documentElement.classList.remove("has-smooth-scroll");
                document.documentElement.classList.remove("has-scroll-animations");
            };
        });
    });
})();
