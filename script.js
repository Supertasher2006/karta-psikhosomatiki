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

  document.querySelectorAll("[data-accordion]").forEach((root) => {
    const items = Array.from(root.querySelectorAll(".accordion-item"));
    items.forEach((item) => {
      item.addEventListener("toggle", () => {
        if (!item.open) return;
        items.forEach((other) => {
          if (other !== item) other.open = false;
        });
      });
    });
  });

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
      window.requestAnimationFrame(updateProgress);
    };

    const folio = root.querySelector("[data-h-folio]");
    const rail = root.querySelector(".signals-rail");

    const updateProgress = () => {
      const max = track.scrollWidth - track.clientWidth;
      const t = max > 1 ? Math.min(1, Math.max(0, track.scrollLeft / max)) : 0;
      if (rail) rail.style.setProperty("--p", String(t));
      if (folio) {
        const card = track.children[0];
        const styles = window.getComputedStyle(track);
        const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
        const amount = card ? card.getBoundingClientRect().width + gap : 1;
        const index = Math.min(
          track.children.length,
          Math.max(1, Math.round(track.scrollLeft / amount) + 1)
        );
        folio.textContent = `${String(index).padStart(2, "0")} / ${String(track.children.length).padStart(2, "0")}`;
      }
    };

    prev?.addEventListener("click", () => scrollByCard(-1));
    next?.addEventListener("click", () => scrollByCard(1));
    track.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
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
})();
