(() => {
    const { gsap, ScrollTrigger, ScrollSmoother, SplitText } = window;
    // Sem os plugins, o conteúdo permanece visível e a rolagem continua nativa.
    if (!gsap || !ScrollTrigger || !ScrollSmoother || !SplitText) return;

    // Ajuste aqui a região da tela em que os elementos aparecem.
    // Também aceita data-reveal-start e data-reveal-end em um elemento específico.
    const settings = {
        start: "clamp(top 90%)",
        end: "clamp(top 60%)",
        scrub: true,
        smooth: 1,
        wordStagger: 0.6,
        entranceDuration: 1,
        markers: false
    };

    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

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
            const splits = [];
            let smoother;
            const refresh = gsap.delayedCall(0.15, () => ScrollTrigger.refresh()).pause();

            if (context.conditions.desktop) {
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

            const titles = [...document.querySelectorAll("main :is(h1, h2, h3, h4, h5, h6)")];
            // Fotos de conteúdo, inclusive as que usam background-image.
            // Logos fixos e ícones de ações ficam sempre visíveis.
            const images = [...document.querySelectorAll(
                "main img:not(.whatsapp-button-icon), main .oval-photo, main .doctor-photo, .site-footer .brand-mark img"
            )];
            const initiallyVisible = new Set([...titles, ...images].filter((element) => {
                const rect = element.getBoundingClientRect();
                const top = smoother ? smoother.offset(element, "top top") : rect.top + window.scrollY;
                return top < window.innerHeight * 0.9;
            }));

            const reveal = (target, element, stagger = 0) => {
                const entrance = initiallyVisible.has(element);
                // Garante que palavras ainda não iniciadas pelo stagger também fiquem ocultas.
                gsap.set(target, { opacity: 0 });
                return gsap.fromTo(target, { opacity: 0 }, {
                    opacity: 1,
                    duration: entrance ? settings.entranceDuration : 1,
                    stagger: { amount: stagger },
                    ease: entrance ? "power1.out" : "none",
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
            };

            titles.forEach((title) => {
                splits.push(SplitText.create(title, {
                    type: "lines,words",
                    wordsClass: "reveal-word",
                    linesClass: "reveal-line",
                    autoSplit: true,
                    aria: "auto",
                    onSplit: (split) => {
                        refresh.restart(true);
                        return reveal(split.words, title, settings.wordStagger);
                    }
                }));
            });
            images.forEach((image) => reveal(image, image));

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
                splits.forEach((split) => split.revert());
                smoother?.kill();
                document.documentElement.classList.remove("has-smooth-scroll");
                document.documentElement.classList.remove("has-scroll-animations");
            };
        });
    });
})();
