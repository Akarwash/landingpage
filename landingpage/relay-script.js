/* Relay — landing page interactivity
   1. Sticky-nav hairline on scroll
   2. Mobile nav toggle
   3. Scroll-reveal (IntersectionObserver), respects prefers-reduced-motion
   Smooth scrolling is handled by CSS scroll-behavior + anchor links. */
(function () {
  "use strict";

  /* ---- 1. Nav hairline on scroll ---- */
  var nav = document.querySelector(".nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- 2. Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    // close menu after clicking a link
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- 3. Scroll reveal ----
     Uses a rect-based check (run on load + scroll + resize) so above-the-fold
     content is never left permanently hidden if IntersectionObserver does not
     fire. Respects prefers-reduced-motion. */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = [].slice.call(document.querySelectorAll(".reveal"));

  if (reduce) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    /* Failsafe (defined first so revealCheck can schedule it): in some
       environments CSS transitions are throttled/paused, which would leave a
       revealed element stuck at opacity 0. Scheduled ~900ms after a reveal —
       long enough that a live browser's 0.7s transition has finished (so it is
       skipped), but it rescues genuinely stuck elements with inline styles
       (which always paint). */
    var allReveal = [].slice.call(document.querySelectorAll(".reveal"));
    var finalize = function () {
      allReveal.forEach(function (el) {
        if (el.classList.contains("is-visible") &&
            parseFloat(getComputedStyle(el).opacity) < 0.99) {
          el.style.transition = "none";
          el.style.opacity = "1";
          el.style.transform = "none";
        }
      });
    };

    var revealCheck = function () {
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var remaining = [];
      var revealedAny = false;
      revealEls.forEach(function (el) {
        var top = el.getBoundingClientRect().top;
        if (top < vh * 0.92) {
          el.classList.add("is-visible");
          revealedAny = true;
        } else {
          remaining.push(el);
        }
      });
      revealEls = remaining;
      if (revealedAny) { setTimeout(finalize, 900); }
      if (!revealEls.length) {
        window.removeEventListener("scroll", revealCheck);
        window.removeEventListener("resize", revealCheck);
      }
    };
    window.addEventListener("scroll", revealCheck, { passive: true });
    window.addEventListener("resize", revealCheck);
    // Initial passes: now, next frame, and a short fallback timeout.
    revealCheck();
    requestAnimationFrame(revealCheck);
    setTimeout(revealCheck, 250);
  }
})();
