(() => {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const year = document.getElementById("year");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 12);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && header) {
    toggle.addEventListener("click", () => {
      const open = header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    header.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const initFlipbook = (root) => {
    const pages = Array.from(root.querySelectorAll(".flip-page"));
    const counter = root.querySelector("[data-flip-counter]");
    if (!pages.length) return;

    let index = 0;

    const render = () => {
      pages.forEach((page, i) => {
        page.classList.remove(
          "is-active",
          "is-behind-1",
          "is-behind-2",
          "is-behind-3",
          "is-flipped",
          "is-stacked"
        );

        if (i < index) {
          page.classList.add("is-flipped");
          return;
        }

        page.classList.add("is-stacked");
        if (i === index) {
          page.classList.add("is-active");
        } else if (i === index + 1) {
          page.classList.add("is-behind-1");
        } else if (i === index + 2) {
          page.classList.add("is-behind-2");
        } else if (i === index + 3) {
          page.classList.add("is-behind-3");
        }
      });

      if (counter) {
        counter.textContent = `${index + 1} / ${pages.length}`;
      }
    };

    root.querySelectorAll("[data-flip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const step = Number(btn.getAttribute("data-flip")) || 0;
        index = (index + step + pages.length) % pages.length;
        render();
      });
    });

    root.querySelector(".flipbook-stage")?.addEventListener("click", () => {
      index = (index + 1) % pages.length;
      render();
    });

    render();
  };

  document.querySelectorAll("[data-flipbook]").forEach(initFlipbook);

  const LEGAL_DOCS = {
    privacy: {
      url: "privacy.html",
      title: "Политика конфиденциальности",
    },
    offer: {
      url: "offer.html",
      title: "Договор публичной оферты",
    },
  };

  const consentRoot = document.querySelector("[data-tariff-consent]");
  const payButtons = document.querySelectorAll("[data-pay-open]");
  const consentInputs = () => Array.from(document.querySelectorAll("[data-consent]"));
  const legalModal = document.getElementById("legal-modal");
  let activeLegalKey = "";

  const hasLegalConsent = () => {
    const inputs = consentInputs();
    return inputs.length > 0 && inputs.every((input) => input.checked);
  };

  const syncPayButtons = () => {
    const ok = hasLegalConsent();
    payButtons.forEach((btn) => {
      btn.disabled = !ok;
      btn.setAttribute("aria-disabled", ok ? "false" : "true");
      btn.classList.toggle("is-locked", !ok);
    });
    document.querySelectorAll("[data-pay-blocker]").forEach((el) => {
      el.hidden = ok;
    });
  };

  const highlightConsent = () => {
    if (!consentRoot) return;
    consentRoot.classList.add("is-attention");
    consentRoot.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => consentRoot.classList.remove("is-attention"), 1600);
  };

  const closeLegal = () => {
    if (!legalModal) return;
    legalModal.hidden = true;
    activeLegalKey = "";
    if (!document.getElementById("pay-modal") || document.getElementById("pay-modal").hidden) {
      document.body.style.overflow = "";
    }
  };

  const openLegal = async (key) => {
    const doc = LEGAL_DOCS[key];
    if (!doc || !legalModal) return;

    activeLegalKey = key;
    const title = legalModal.querySelector("#legal-title");
    const body = legalModal.querySelector("[data-legal-body]");
    if (title) title.textContent = doc.title;
    if (body) body.innerHTML = "<p>Загружаем документ…</p>";

    legalModal.hidden = false;
    document.body.style.overflow = "hidden";

    try {
      const res = await fetch(doc.url);
      if (!res.ok) throw new Error("fetch failed");
      const html = await res.text();
      const parsed = new DOMParser().parseFromString(html, "text/html");
      const content = parsed.querySelector(".legal-doc");
      if (body) body.innerHTML = content ? content.outerHTML : html;
    } catch (err) {
      closeLegal();
      window.open(doc.url, "_blank", "noopener");
    }
  };

  consentInputs().forEach((input) => {
    input.addEventListener("change", syncPayButtons);
  });

  document.querySelectorAll("[data-legal-open]").forEach((btn) => {
    btn.addEventListener("click", () => openLegal(btn.getAttribute("data-legal-open") || ""));
  });

  document.querySelectorAll("[data-legal-close]").forEach((el) => {
    el.addEventListener("click", closeLegal);
  });

  legalModal?.querySelector("[data-legal-accept]")?.addEventListener("click", () => {
    const input = document.querySelector(`[data-consent="${activeLegalKey}"]`);
    if (input) {
      input.checked = true;
      syncPayButtons();
    }
    closeLegal();
  });

  document.querySelectorAll("[data-pay-blocker]").forEach((el) => {
    el.addEventListener("click", highlightConsent);
  });

  syncPayButtons();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && legalModal && !legalModal.hidden) {
      closeLegal();
    }
  });

  const PAYMENT = {
    phone: "79173541792",
    phoneDisplay: "+7 917 354-17-92",
    bank: "СберБанк",
  };

  const payModal = document.getElementById("pay-modal");
  if (payModal) {
    const state = {
      tariff: "",
      title: "",
      price: 0,
      orderId: "",
      name: "",
      email: "",
      phone: "",
      purpose: "",
    };

    const steps = {
      form: payModal.querySelector('[data-pay-step="form"]'),
      pay: payModal.querySelector('[data-pay-step="pay"]'),
      done: payModal.querySelector('[data-pay-step="done"]'),
    };

    const setStep = (name) => {
      Object.entries(steps).forEach(([key, el]) => {
        if (!el) return;
        el.hidden = key !== name;
      });
    };

    const fillTexts = () => {
      payModal.querySelectorAll("[data-pay-tariff-name]").forEach((el) => {
        el.textContent = state.title;
      });
      payModal.querySelectorAll("[data-pay-amount]").forEach((el) => {
        el.textContent = `${state.price.toLocaleString("ru-RU")} ₽`;
      });
      payModal.querySelectorAll("[data-pay-phone]").forEach((el) => {
        el.textContent = PAYMENT.phoneDisplay;
      });
      payModal.querySelectorAll("[data-pay-email]").forEach((el) => {
        el.textContent = state.email;
      });
      payModal.querySelectorAll("[data-pay-order]").forEach((el) => {
        el.textContent = state.orderId;
      });
      payModal.querySelectorAll("[data-pay-purpose]").forEach((el) => {
        el.textContent = state.purpose;
      });
    };

    const openPay = (btn) => {
      if (!hasLegalConsent()) {
        highlightConsent();
        return;
      }
      state.tariff = btn.getAttribute("data-tariff") || "";
      state.title = btn.getAttribute("data-title") || "Тариф";
      state.price = Number(btn.getAttribute("data-price")) || 0;
      state.orderId = "";
      state.name = "";
      state.email = "";
      state.phone = "";
      state.purpose = "";
      const form = document.getElementById("pay-form");
      if (form) form.reset();
      fillTexts();
      setStep("form");
      payModal.hidden = false;
      document.body.style.overflow = "hidden";
    };

    const closePay = () => {
      payModal.hidden = true;
      document.body.style.overflow = "";
    };

    const copyText = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (err) {
        const area = document.createElement("textarea");
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
    };

    const buildReceipt = () => {
      const now = new Date();
      const when = now.toLocaleString("ru-RU");
      const html = `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Электронный чек ${state.orderId}</title>
<style>body{font-family:Georgia,serif;max-width:560px;margin:40px auto;padding:24px;color:#2a1814;background:#fffaf7}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin-top:16px}td{padding:8px 0;border-bottom:1px solid #e8d7cf}.muted{color:#6a4a44;font-size:14px}</style></head><body>
<h1>Электронный чек</h1>
<p class="muted">Курс «Карта психосоматики тела»</p>
<table>
<tr><td>Номер заказа</td><td><strong>${state.orderId}</strong></td></tr>
<tr><td>Дата</td><td>${when}</td></tr>
<tr><td>Покупатель</td><td>${state.name}</td></tr>
<tr><td>Email</td><td>${state.email}</td></tr>
<tr><td>Телефон</td><td>${state.phone}</td></tr>
<tr><td>Тариф</td><td>${state.title}</td></tr>
<tr><td>Сумма</td><td><strong>${state.price.toLocaleString("ru-RU")} ₽</strong></td></tr>
<tr><td>Получатель</td><td>${PAYMENT.bank}, ${PAYMENT.phoneDisplay}</td></tr>
<tr><td>Назначение</td><td>${state.purpose}</td></tr>
</table>
<p class="muted">Чек сформирован автоматически на сайте курса. Сохраните файл для своих записей.</p>
</body></html>`;
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      return URL.createObjectURL(blob);
    };

    document.querySelectorAll("[data-pay-open]").forEach((btn) => {
      btn.addEventListener("click", () => openPay(btn));
    });

    payModal.querySelectorAll("[data-pay-close]").forEach((el) => {
      el.addEventListener("click", closePay);
    });

    payModal.querySelector("[data-pay-back]")?.addEventListener("click", () => setStep("form"));

    document.getElementById("pay-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      state.name = String(data.get("name") || "").trim();
      state.email = String(data.get("email") || "").trim();
      state.phone = String(data.get("phone") || "").trim();
      state.orderId = `KT-${Date.now().toString().slice(-8)}`;
      state.purpose = `Курс Карта психосоматики, тариф ${state.title}, заказ ${state.orderId}`;
      fillTexts();
      setStep("pay");
    });

    payModal.querySelector("[data-copy]")?.addEventListener("click", (event) => {
      const value = event.currentTarget.getAttribute("data-copy") || PAYMENT.phone;
      copyText(value);
    });

    payModal.querySelector("[data-copy-amount]")?.addEventListener("click", () => {
      copyText(String(state.price));
    });

    payModal.querySelector("[data-copy-purpose]")?.addEventListener("click", () => {
      copyText(state.purpose);
    });

    payModal.querySelector("[data-pay-confirm]")?.addEventListener("click", () => {
      const receiptUrl = buildReceipt();
      const link = payModal.querySelector("[data-pay-receipt]");
      if (link) {
        link.href = receiptUrl;
        link.download = `check-${state.orderId}.html`;
      }

      const mail = payModal.querySelector("[data-pay-email-link]");
      if (mail) {
        const subject = encodeURIComponent(`Электронный чек ${state.orderId} — Карта психосоматики тела`);
        const body = encodeURIComponent(
          `Здравствуйте, ${state.name}!\n\nВаш электронный чек по оплате курса.\n\nЗаказ: ${state.orderId}\nТариф: ${state.title}\nСумма: ${state.price.toLocaleString("ru-RU")} ₽\nПолучатель: ${PAYMENT.bank}, ${PAYMENT.phoneDisplay}\nНазначение: ${state.purpose}\n\nСпасибо за оплату!`
        );
        mail.href = `mailto:${encodeURIComponent(state.email)}?subject=${subject}&body=${body}`;
      }

      fillTexts();
      setStep("done");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !payModal.hidden && (!legalModal || legalModal.hidden)) closePay();
    });
  }

  document.querySelectorAll("[data-program]").forEach((root) => {
    const items = Array.from(root.querySelectorAll(".program-day"));
    const glows = Array.from(root.querySelectorAll(".program-gl"));
    const cap = root.querySelector("[data-program-cap]");
    const prog = root.querySelector("[data-program-progress]");
    const seen = new Set();
    let top = -1;

    const paint = (cur) => {
      const allOn = cur >= 0 && items[cur]?.classList.contains("is-all");
      glows.forEach((glow) => {
        const day = Number(glow.getAttribute("data-day"));
        glow.classList.toggle("is-cur", cur >= 0 && (allOn ? day === 5 : day === cur));
        glow.classList.remove("is-lit");
      });
      if (cap) {
        cap.style.opacity = cur >= 0 ? "1" : "0";
        if (cur >= 0) {
          cap.textContent = `День ${cur + 1}: ${items[cur].getAttribute("data-zone-name") || ""}`;
        }
      }
      if (prog) prog.textContent = `Карта: открыто зон ${seen.size} из ${items.length}`;
    };

    const toggle = (index) => {
      const wasOpen = items[index].classList.contains("is-open");
      items.forEach((item, i) => {
        const open = i === index && !wasOpen;
        if (item.classList.contains("is-open")) item.classList.add("is-seen");
        item.classList.toggle("is-open", open);
        item.querySelector(".program-day-trigger")?.setAttribute("aria-expanded", open ? "true" : "false");
      });
      if (!wasOpen) {
        items[index].classList.add("is-seen");
        seen.add(index);
        top = Math.max(top, index);
      }
      items.forEach((item, i) => item.classList.toggle("is-done", i < top));
      paint(wasOpen ? -1 : index);
    };

    items.forEach((item, i) => {
      item.querySelector(".program-day-trigger")?.addEventListener("click", () => toggle(i));
    });

    toggle(0);
  });

  const diplomaLightbox = document.getElementById("diploma-lightbox");
  if (diplomaLightbox) {
    const gallery = document.querySelector("[data-diploma-gallery]");
    const buttons = gallery ? Array.from(gallery.querySelectorAll("[data-diploma-open]")) : [];
    const image = diplomaLightbox.querySelector("img");
    const title = diplomaLightbox.querySelector("[id='diploma-lightbox-title']");
    let index = 0;

    const show = (nextIndex) => {
      if (!buttons.length) return;
      index = (nextIndex + buttons.length) % buttons.length;
      const btn = buttons[index];
      const img = btn.querySelector("img");
      image.src = img?.currentSrc || img?.src || "";
      image.alt = img?.alt || "";
      if (title) title.textContent = btn.querySelector("span")?.textContent || img?.alt || "";
    };

    const open = (startIndex) => {
      show(startIndex);
      diplomaLightbox.hidden = false;
      document.body.style.overflow = "hidden";
    };

    const close = () => {
      diplomaLightbox.hidden = true;
      document.body.style.overflow = "";
    };

    buttons.forEach((btn, i) => {
      btn.addEventListener("click", () => open(i));
    });
    diplomaLightbox.querySelectorAll("[data-diploma-close]").forEach((el) => {
      el.addEventListener("click", close);
    });
    diplomaLightbox.querySelector("[data-diploma-prev]")?.addEventListener("click", () => show(index - 1));
    diplomaLightbox.querySelector("[data-diploma-next]")?.addEventListener("click", () => show(index + 1));
    document.addEventListener("keydown", (event) => {
      if (diplomaLightbox.hidden) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") show(index - 1);
      if (event.key === "ArrowRight") show(index + 1);
    });
  }

  document.querySelectorAll("[data-h-slider]").forEach((root) => {
    const track = root.querySelector("[data-h-track]");
    const prev = root.querySelector("[data-h-prev]");
    const next = root.querySelector("[data-h-next]");
    if (!track) return;

    const scrollByCard = (dir) => {
      const card = track.children[0];
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const amount = card ? card.getBoundingClientRect().width + gap : 300;
      track.scrollBy({ left: dir * amount, behavior: "smooth" });
    };

    const updateProgress = () => {
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      const atStart = track.scrollLeft <= 4;
      const atEnd = track.scrollLeft >= max - 4;
      if (prev) prev.hidden = atStart;
      if (next) next.hidden = atEnd || max <= 4;

      const photo = track.querySelector(".signal-photo");
      if (photo) {
        const rootRect = root.getBoundingClientRect();
        const photoRect = photo.getBoundingClientRect();
        root.style.setProperty("--arrow-top", `${photoRect.top - rootRect.top + photoRect.height / 2}px`);
      }
    };

    prev?.addEventListener("click", () => scrollByCard(-1));
    next?.addEventListener("click", () => scrollByCard(1));
    track.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    track.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", updateProgress, { once: true });
    });
    updateProgress();
  });

  document.querySelectorAll("[data-body-map]").forEach((root) => {
    const stage = root.querySelector(".body-map-stage");
    const spots = Array.from(root.querySelectorAll(".body-hotspot"));
    const pills = Array.from(root.querySelectorAll("[data-pill]"));
    const swap = root.querySelector("[data-body-swap]");
    const labelEl = root.querySelector("[data-body-label]");
    const titleEl = root.querySelector("[data-body-title]");
    const textEl = root.querySelector("[data-body-text]");
    const countEl = root.querySelector("[data-body-count]");
    const cta = root.querySelector("[data-body-cta]");
    const prev = root.querySelector("[data-body-prev]");
    const next = root.querySelector("[data-body-next]");
    if (!spots.length || !textEl) return;

    const tags = Array.from(root.querySelectorAll(".body-map-tag"));
    const rabbit = root.querySelector("[data-body-rabbit]");
    const visited = new Set();
    let index = 1;
    let animating = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DISCOUNT_KEY = "karta-rabbit-discount";
    const formatRub = (value) => `${Number(value).toLocaleString("ru-RU")} ₽`;

    const rabbitModal = document.querySelector("[data-rabbit-modal]");
    const closeRabbitModal = () => {
      if (!rabbitModal) return;
      rabbitModal.hidden = true;
      if (document.getElementById("pay-modal")?.hidden !== false) {
        document.body.style.overflow = "";
      }
    };
    const openRabbitModal = () => {
      if (!rabbitModal) return;
      rabbitModal.hidden = false;
      document.body.style.overflow = "hidden";
      rabbitModal.querySelector(".btn[data-rabbit-close]")?.focus();
    };
    rabbitModal?.querySelectorAll("[data-rabbit-close]").forEach((el) => {
      el.addEventListener("click", closeRabbitModal);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && rabbitModal && !rabbitModal.hidden) {
        closeRabbitModal();
      }
    });

    const paintDiscount = () => {
      document.querySelectorAll("[data-pay-open]").forEach((btn) => {
        const base = Number(btn.getAttribute("data-price-base") || btn.getAttribute("data-price")) || 0;
        btn.setAttribute("data-price-base", String(base));
        const next = Math.round(base * 0.95);
        btn.setAttribute("data-price", String(next));
        const card = btn.closest(".tariff-card");
        if (!card) return;
        card.classList.add("has-discount");
        const priceEl = card.querySelector(".tariff-card-price");
        if (priceEl && !priceEl.querySelector(".tariff-price-old")) {
          const old = document.createElement("span");
          old.className = "tariff-price-old";
          old.textContent = formatRub(base);
          priceEl.replaceChildren(old, document.createTextNode(formatRub(next)));
        }
        if (!card.querySelector(".tariff-discount-flag")) {
          const flag = document.createElement("span");
          flag.className = "tariff-discount-flag";
          flag.textContent = "Скидка 5%";
          priceEl?.insertAdjacentElement("beforebegin", flag);
        }
      });
    };

    const applyRabbitDiscount = () => {
      sessionStorage.setItem(DISCOUNT_KEY, "1");
      paintDiscount();
      openRabbitModal();
    };

    if (sessionStorage.getItem(DISCOUNT_KEY) === "1") {
      paintDiscount();
    }

    const escapeHtml = (value) =>
      value.replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char]));

    const markedCopy = (copy, mark) => {
      const safe = escapeHtml(copy || "");
      if (!mark) return safe;
      const needle = escapeHtml(mark);
      const at = safe.indexOf(needle);
      if (at === -1) return safe;
      return `${safe.slice(0, at)}<span class="hl">${needle}</span>${safe.slice(at + needle.length)}`;
    };

    const render = (spot) => {
      if (labelEl) labelEl.textContent = spot.getAttribute("data-label") || "";
      if (titleEl) titleEl.textContent = spot.getAttribute("data-title") || "";
      textEl.innerHTML = markedCopy(spot.getAttribute("data-copy") || "", spot.getAttribute("data-hl") || "");
    };

    const paint = () => {
      spots.forEach((item, i) => {
        const on = i === index;
        item.classList.toggle("is-active", on);
        item.setAttribute("aria-pressed", on ? "true" : "false");
      });
      const zone = spots[index].getAttribute("data-zone");
      pills.forEach((pill) => {
        const id = pill.getAttribute("data-pill");
        pill.classList.toggle("is-active", id === zone);
        pill.classList.toggle("is-seen", visited.has(id));
      });
      tags.forEach((tag) => {
        tag.classList.toggle("is-on", tag.getAttribute("data-tag") === zone);
      });
      if (rabbit) {
        const showRabbit = zone === "heart";
        rabbit.classList.toggle("is-in", showRabbit);
        rabbit.setAttribute("aria-hidden", showRabbit ? "false" : "true");
      }
      if (countEl) countEl.textContent = `${index + 1} / ${spots.length}`;
      if (cta) cta.hidden = visited.size < spots.length;
    };

    const setZone = (nextIndex, { animate = true, scroll = false } = {}) => {
      const total = spots.length;
      const nextSpotIndex = (nextIndex + total) % total;
      const spot = spots[nextSpotIndex];
      if (!spot || animating) return;
      index = nextSpotIndex;
      visited.add(spot.getAttribute("data-zone"));

      const apply = () => {
        render(spot);
        paint();
        if (scroll && window.matchMedia("(max-width: 960px)").matches) {
          root.querySelector(".body-map-panel")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
        }
      };

      if (!animate || reduceMotion || !swap) {
        apply();
        return;
      }

      animating = true;
      swap.classList.remove("is-enter");
      swap.classList.add("is-leave");
      window.setTimeout(() => {
        apply();
        swap.classList.remove("is-leave");
        swap.classList.add("is-enter");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            swap.classList.remove("is-enter");
            animating = false;
          });
        });
      }, 180);
    };

    spots.forEach((spot, i) => {
      spot.addEventListener("click", () => setZone(i, { scroll: true }));
    });
    rabbit?.addEventListener("click", (event) => {
      event.stopPropagation();
      applyRabbitDiscount();
    });
    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        const i = spots.findIndex((spot) => spot.getAttribute("data-zone") === pill.getAttribute("data-pill"));
        if (i >= 0) setZone(i, { scroll: true });
      });
    });
    prev?.addEventListener("click", () => setZone(index - 1));
    next?.addEventListener("click", () => setZone(index + 1));

    setZone(1, { animate: false });
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => {
      el.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => observer.observe(el));

  window.setTimeout(() => {
    document.querySelectorAll(".reveal, .reveal-stagger").forEach((el) => {
      if (el.classList.contains("results-list")) return;
      el.classList.add("is-visible");
    });
  }, 900);

  window.setTimeout(() => {
    document.querySelectorAll(".results-list.reveal-stagger").forEach((el) => {
      el.classList.add("is-visible");
    });
  }, 8000);

  const smSvg = document.getElementById("smSvg");
  if (smSvg) {
    const DONE = 3;
    const PTS = [[36, 200], [96, 130], [160, 180], [215, 105], [268, 160], [318, 95], [364, 40]];
    const LAB = ["Эмоции", "Органы", "Спина", "Цикл", "Вес", "Лечение", "Итог"];
    const P = (i) => PTS[Math.max(0, Math.min(PTS.length - 1, i))];
    let h = "";
    for (let i = 0; i < PTS.length - 1; i += 1) {
      const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      const done = i < DONE - 1;
      h += `<path class="seg ${done ? "done s" + (i + 1) : "todo"}" pathLength="1" d="M${p1} C${c1} ${c2} ${p2}"/>`;
    }
    PTS.forEach(([x, y], i) => {
      const done = i < DONE;
      const cur = i === DONE - 1;
      const last = i === PTS.length - 1;
      const r = last ? 20 : 17;
      const anchor = last ? "text-anchor=\"end\"" : "";
      h += `<g class="n ${done ? "done" : ""} ${cur ? "cur" : ""} ${last ? "last" : ""}">
        ${cur ? `<circle class="pulse" cx="${x}" cy="${y}" r="${r}"/>` : ""}
        <circle class="base" cx="${x}" cy="${y}" r="${r}"/>
        <text class="num" x="${x}" y="${y + 5}">${done && !cur ? "✓" : i + 1}</text>
        <text class="lab" x="${last ? x + 8 : x}" y="${y + r + 18}" ${anchor}>${LAB[i]}</text></g>`;
    });
    smSvg.innerHTML = h;
  }
})();
