// PixelForge — main.js
// All behavior in one DOMContentLoaded listener. No jQuery. GSAP is optional and loaded via CDN.

document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  initMobileNav();
  initScrollReveal(reducedMotion);
  initStatCounters(reducedMotion);
  initFAQ();
  initContactForm();
  initPortfolioFilter();
  initPortfolioModal();
  initHeroGSAP(reducedMotion);
  initReadingProgress(reducedMotion);
  initCursorSpotlight(reducedMotion);
  initMagneticButtons(reducedMotion);
  initHeroParallax(reducedMotion);
  initLiveStatus();
  initLocalClock();
  initCopyButtons();
  initYear();
});

/* ------------------------------------------------------------
   Live status pill — "Online" during Ocean Springs business
   hours (Mon–Fri 9am–6pm CT), otherwise "After hours"
   ------------------------------------------------------------ */
function initLiveStatus() {
  const pill = document.querySelector("[data-live-status]");
  if (!pill) return;
  const label = pill.querySelector(".live-status__label");

  const chicagoParts = () => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      weekday: "short",
      hour: "2-digit",
      hour12: false,
    });
    const map = Object.fromEntries(
      fmt.formatToParts(new Date()).map((p) => [p.type, p.value])
    );
    return { weekday: map.weekday, hour: parseInt(map.hour, 10) };
  };

  const update = () => {
    const { weekday, hour } = chicagoParts();
    const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);
    const open = isWeekday && hour >= 9 && hour < 18;
    if (open) {
      pill.classList.remove("live-status--off");
      label.textContent = "Online · usually replies in ~14 min";
    } else {
      pill.classList.add("live-status--off");
      if (isWeekday && hour < 9) {
        label.textContent = "After hours · back at 9am CT";
      } else if (isWeekday && hour >= 18) {
        label.textContent = "Closed for the day · back at 9am CT";
      } else {
        label.textContent = "Weekend · back Monday 9am CT";
      }
    }
  };
  update();
  setInterval(update, 60_000);
}

/* ------------------------------------------------------------
   Local clock — updates every 30s with Ocean Springs (CT) time
   ------------------------------------------------------------ */
function initLocalClock() {
  const target = document.querySelector("[data-clock-time]");
  if (!target) return;
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const update = () => {
    target.textContent = fmt.format(new Date());
  };
  update();
  setInterval(update, 30_000);
}

/* ------------------------------------------------------------
   Click-to-copy buttons (email, phone) — uses Clipboard API
   with a textarea fallback for HTTP / older browsers.
   ------------------------------------------------------------ */
function initCopyButtons() {
  const buttons = document.querySelectorAll(".copy-btn[data-copy]");
  if (!buttons.length) return;

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {}
    }
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(ta);
    return ok;
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const ok = await copyText(btn.getAttribute("data-copy") || "");
      if (!ok) return;
      btn.classList.add("copied");
      clearTimeout(btn._copyTimer);
      btn._copyTimer = setTimeout(() => btn.classList.remove("copied"), 1600);
    });
  });
}

/* ------------------------------------------------------------
   Reading progress bar — thin gradient line at viewport top
   ------------------------------------------------------------ */
function initReadingProgress(reducedMotion) {
  const fill = document.querySelector(".reading-bar__fill");
  if (!fill) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    fill.style.transform = `scaleX(${pct})`;
    ticking = false;
  };
  document.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  update();
}

/* ------------------------------------------------------------
   Cursor-tracked spotlight — sets --mx / --my on hovered card
   ------------------------------------------------------------ */
function initCursorSpotlight(reducedMotion) {
  if (reducedMotion) return;
  if (window.matchMedia("(hover: none)").matches) return;
  document.querySelectorAll("[data-spotlight]").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
}

/* ------------------------------------------------------------
   Magnetic buttons — gentle pull toward cursor on hover
   ------------------------------------------------------------ */
function initMagneticButtons(reducedMotion) {
  if (reducedMotion) return;
  if (window.matchMedia("(hover: none)").matches) return;
  document.querySelectorAll("[data-magnetic]").forEach((btn) => {
    const PULL = 0.22;
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) * PULL;
      const dy = (e.clientY - cy) * PULL;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.transform = "";
    });
  });
}

/* ------------------------------------------------------------
   Hero browser-stack parallax — frames offset at different rates
   ------------------------------------------------------------ */
function initHeroParallax(reducedMotion) {
  if (reducedMotion) return;
  if (window.matchMedia("(hover: none)").matches) return;
  const stack = document.querySelector(".hero-stack");
  if (!stack) return;
  const frames = stack.querySelectorAll(".hero-stack__frame");
  if (!frames.length) return;

  // Listen on the hero section so parallax triggers from a larger area
  const trigger = stack.closest(".hero-v2") || stack;
  let rafId = null;
  let pendingX = 0, pendingY = 0;

  const apply = () => {
    frames.forEach((f, i) => {
      const intensity = (i + 1) * 6; // 6, 12, 18
      f.style.setProperty("--px", (pendingX * intensity) + "px");
      f.style.setProperty("--py", (pendingY * intensity) + "px");
    });
    rafId = null;
  };

  trigger.addEventListener("mousemove", (e) => {
    const r = trigger.getBoundingClientRect();
    pendingX = (e.clientX - r.left - r.width / 2) / r.width;
    pendingY = (e.clientY - r.top - r.height / 2) / r.height;
    if (!rafId) rafId = requestAnimationFrame(apply);
  });
  trigger.addEventListener("mouseleave", () => {
    pendingX = 0; pendingY = 0;
    frames.forEach((f) => {
      f.style.setProperty("--px", "0px");
      f.style.setProperty("--py", "0px");
    });
  });
}

/* ------------------------------------------------------------
   Mobile nav drawer
   ------------------------------------------------------------ */
function initMobileNav() {
  const burger  = document.querySelector("[data-nav-burger]");
  const overlay = document.querySelector(".nav-overlay");
  const drawer  = document.querySelector(".nav-drawer");
  const closeBtn = document.querySelector("[data-nav-close]");

  // Per CLAUDE.md: silently skip if any of the three are missing
  if (!burger || !overlay || !drawer) return;

  const open = () => {
    overlay.classList.add("open");
    drawer.classList.add("open");
    document.body.classList.add("locked");
    burger.setAttribute("aria-expanded", "true");
  };
  const close = () => {
    overlay.classList.remove("open");
    drawer.classList.remove("open");
    document.body.classList.remove("locked");
    burger.setAttribute("aria-expanded", "false");
  };

  burger.addEventListener("click", () => {
    drawer.classList.contains("open") ? close() : open();
  });
  overlay.addEventListener("click", close);
  if (closeBtn) closeBtn.addEventListener("click", close);

  // Close drawer when any nav link inside it is clicked
  drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));

  // Esc closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) close();
  });
}

/* ------------------------------------------------------------
   Scroll reveal — IntersectionObserver + .reveal/.visible
   ------------------------------------------------------------ */
function initScrollReveal(reducedMotion) {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  if (reducedMotion) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }

  // Apply data-delay to transition-delay
  els.forEach((el) => {
    const delay = el.getAttribute("data-delay");
    if (delay) el.style.transitionDelay = delay;
  });

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  els.forEach((el) => obs.observe(el));
}

/* ------------------------------------------------------------
   Stat counters — animates any [data-count] span when it enters
   the viewport. Final value lives in HTML so it stays visible
   if JS never runs.
   ------------------------------------------------------------ */
function initStatCounters(reducedMotion) {
  const spans = document.querySelectorAll("[data-count]");
  if (!spans.length) return;

  const animate = (span) => {
    const target = parseInt(span.getAttribute("data-count"), 10) || 0;
    const suffix = span.getAttribute("data-suffix") || "";

    if (reducedMotion) {
      span.textContent = target + suffix;
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);
      span.textContent = value + suffix;
      if (t < 1) requestAnimationFrame(step);
    };
    span.textContent = "0" + suffix;
    requestAnimationFrame(step);
  };

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.done) {
          entry.target.dataset.done = "1";
          animate(entry.target);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  spans.forEach((s) => obs.observe(s));
}

/* ------------------------------------------------------------
   FAQ accordion — animate height from 0 to scrollHeight px
   Never use height: auto in the transition.
   ------------------------------------------------------------ */
function initFAQ() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer  = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.setAttribute("aria-expanded", "false");

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      if (isOpen) {
        // Closing: set explicit height, force reflow, then go to 0
        answer.style.height = answer.scrollHeight + "px";
        // Force reflow so the transition fires
        void answer.offsetHeight;
        answer.style.height = "0px";
        item.classList.remove("open");
        question.setAttribute("aria-expanded", "false");
      } else {
        // Opening
        answer.style.height = answer.scrollHeight + "px";
        item.classList.add("open");
        question.setAttribute("aria-expanded", "true");

        // Once the transition ends, leave the height in place
        // (do NOT switch to auto — re-clicking measures scrollHeight anyway)
      }
    });
  });
}

/* ------------------------------------------------------------
   Contact form validation — fields by name, errors via data-error
   ------------------------------------------------------------ */
function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector(".form-status");

  const showError = (name, message) => {
    const errEl = form.querySelector(`.field-error[data-error="${name}"]`);
    const input = form.querySelector(`[name="${name}"]`);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add("show");
    }
    if (input) input.classList.add("invalid");
  };
  const clearError = (name) => {
    const errEl = form.querySelector(`.field-error[data-error="${name}"]`);
    const input = form.querySelector(`[name="${name}"]`);
    if (errEl) errEl.classList.remove("show");
    if (input) input.classList.remove("invalid");
  };

  // Clear an error when user edits the field
  form.querySelectorAll("[name]").forEach((el) => {
    el.addEventListener("input", () => clearError(el.name));
    el.addEventListener("change", () => clearError(el.name));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const data = new FormData(form);
    let valid = true;

    const name = (data.get("name") || "").toString().trim();
    if (!name) { showError("name", "Please tell us your name."); valid = false; }

    const email = (data.get("email") || "").toString().trim();
    if (!email) {
      showError("email", "Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("email", "That email doesn't look right.");
      valid = false;
    }

    const budget = (data.get("budget") || "").toString().trim();
    if (!budget) { showError("budget", "Pick a budget range so we can scope the project."); valid = false; }

    const projectType = (data.get("project_type") || "").toString().trim();
    if (!projectType) { showError("project_type", "Choose a project type."); valid = false; }

    const message = (data.get("message") || "").toString().trim();
    if (message.length < 10) { showError("message", "Give us a sentence or two about the project."); valid = false; }

    if (!valid) return;

    // Mock submit — replace with Netlify Forms by adding `netlify` to the <form> tag
    const submitBtn = form.querySelector("[type='submit']");
    const original = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending..."; }

    setTimeout(() => {
      if (status) {
        status.textContent = "Thanks! We've got your message and will get back to you within one business day.";
        status.classList.add("show", "form-status--success");
      }
      form.reset();
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = original; }
    }, 700);
  });
}

/* ------------------------------------------------------------
   Portfolio filter — CSS class toggles only
   ------------------------------------------------------------ */
function initPortfolioFilter() {
  const chips = document.querySelectorAll("[data-filter]");
  const tiles = document.querySelectorAll("[data-tags]");
  if (!chips.length || !tiles.length) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");

      const filter = chip.getAttribute("data-filter");
      tiles.forEach((tile) => {
        const tags = (tile.getAttribute("data-tags") || "").split(/\s+/);
        const show = filter === "all" || tags.includes(filter);
        tile.style.display = show ? "" : "none";
      });
    });
  });
}

/* ------------------------------------------------------------
   Portfolio modal — opens project details
   ------------------------------------------------------------ */
function initPortfolioModal() {
  const overlay = document.querySelector("[data-modal-overlay]");
  if (!overlay) return;

  const modal     = overlay.querySelector(".modal");
  const imgEl     = overlay.querySelector("[data-modal-img]");
  const titleEl   = overlay.querySelector("[data-modal-title]");
  const tagsEl    = overlay.querySelector("[data-modal-tags]");
  const bodyEl    = overlay.querySelector("[data-modal-body]");
  const closeBtn  = overlay.querySelector("[data-modal-close]");

  const open = (data) => {
    if (imgEl)   imgEl.src = data.img || "";
    if (titleEl) titleEl.textContent = data.title || "";
    if (bodyEl)  bodyEl.textContent  = data.body  || "";
    if (tagsEl) {
      tagsEl.innerHTML = "";
      (data.tags || []).forEach((t) => {
        const span = document.createElement("span");
        span.className = "modal__tag";
        span.textContent = t;
        tagsEl.appendChild(span);
      });
    }
    overlay.classList.add("open");
    document.body.classList.add("locked");
  };
  const close = () => {
    overlay.classList.remove("open");
    document.body.classList.remove("locked");
  };

  document.querySelectorAll("[data-project]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      open({
        img:   trigger.getAttribute("data-img"),
        title: trigger.getAttribute("data-title"),
        body:  trigger.getAttribute("data-body"),
        tags:  (trigger.getAttribute("data-tag-list") || "").split("|").filter(Boolean),
      });
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("open")) close();
  });
}

/* ------------------------------------------------------------
   Hero GSAP — staggered word entry on home page
   Uses gsap.from() so content stays visible if GSAP fails to
   load. The animation enhances; it never gates visibility.
   ------------------------------------------------------------ */
function initHeroGSAP(reducedMotion) {
  const headline = document.querySelector("[data-hero-headline]");
  if (!headline) return;

  // No GSAP, or reduced motion: nothing to do. CSS defaults keep things visible.
  if (reducedMotion || typeof window.gsap === "undefined") return;

  const words = headline.querySelectorAll(".word");
  if (words.length) {
    gsap.from(words, {
      yPercent: 40,
      rotate: 3,
      duration: 0.75,
      ease: "power3.out",
      stagger: 0.06,
      clearProps: "all",
    });
  }

  // Animate hero subline + buttons after headline
  const reveals = document.querySelectorAll("[data-hero-fade]");
  if (reveals.length) {
    gsap.from(reveals, {
      y: 16,
      duration: 0.6,
      ease: "power2.out",
      stagger: 0.08,
      delay: 0.2,
      clearProps: "all",
    });
  }
}

/* ------------------------------------------------------------
   Footer year
   ------------------------------------------------------------ */
function initYear() {
  const el = document.querySelector("[data-year]");
  if (el) el.textContent = new Date().getFullYear();
}
