// Performance: Cache DOM queries to avoid repeated lookups
const DOM = {
  backToTop: document.getElementById("backToTop"),
  navLinks: document.querySelectorAll(".nav-link"),
  form: document.getElementById("contact-form"),
  status: document.getElementById("form-status"),
  mainNav: document.getElementById("mainNav"),
  carouselContainer: document.getElementById("carouselContainer"),
  track: document.getElementById("track"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  indicators: document.getElementById("indicators")
};
// Form validation messages
const REQUIRED_MESSAGES = {
  name: "Please enter your name.",
  company: "Please enter your company name.",
  email: "Please enter your email address.",
  phone: "Please enter your phone number.",
  country: "Please select your country.",
  service: "Please select the service you need."
};
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3u1P8AGFBjqnHwt7TBc0m5CxB35BeTp8EOMXouf3Vj6_JNv6psU3tzqgA3V0EZzSd/exec';
// ============ UTILITY FUNCTIONS ============
const setStatus = (message, type = "") => {
  if (!DOM.status) return;
  DOM.status.textContent = message;
  DOM.status.className = ["form-status", type ? `form-status--${type}` : ""].filter(Boolean).join(" ");
};
const getValidationMessage = (control) => {
  const value = control.value.trim();
  if (control.required && !value) {
    return REQUIRED_MESSAGES[control.name] || "This field is required.";
  }
  const validations = {
    name: (v) => v.length >= 2 ? "" : "Name must be at least 2 characters.",
    company: (v) => v.length >= 2 ? "" : "Company name must be at least 2 characters.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Please enter a valid email address.",
    phone: (v) => {
      const digits = v.replace(/\D/g, "");
      const hasValidCharacters = /^[+()\d\s.-]+$/.test(v);
      return (!hasValidCharacters || digits.length < 7 || digits.length > 15) ? "Please enter a valid phone number." : "";
    }
  };
  return validations[control.name]?.(value) || "";
};
const validateField = (control) => {
  const message = getValidationMessage(control);
  const error = document.getElementById(`${control.id}-error`);
  const hasValue = Boolean(control.value.trim());
  control.setCustomValidity(message);
  control.classList.toggle("is-invalid", Boolean(message));
  control.classList.toggle("is-valid", !message && hasValue);
  control.setAttribute("aria-invalid", message ? "true" : "false");
  if (error) {
    error.textContent = message;
  }
  return !message;
};
// ============ FORM INITIALIZATION ============
function initializeForm() {
  if (!DOM.form || !DOM.status) return;
  const formControls = Array.from(DOM.form.querySelectorAll("input, select, textarea"));
  // Create error messages for each field
  formControls.forEach(control => {
    const error = document.createElement("div");
    error.className = "field-error";
    error.id = `${control.id}-error`;
    error.setAttribute("aria-live", "polite");
    control.insertAdjacentElement("afterend", error);
    control.setAttribute("aria-describedby", error.id);
    // Event listeners with passive flag for better performance
    control.addEventListener("blur", () => validateField(control));
    control.addEventListener("change", () => validateField(control));
    control.addEventListener("input", () => {
      if (DOM.status.classList.contains("form-status--success")) {
        setStatus("");
      }
      if (DOM.form.classList.contains("was-validated") || control.classList.contains("is-invalid")) {
        validateField(control);
      }
    });
  });
  // Form submission
  DOM.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const isValid = formControls.map(validateField).every(Boolean);
    if (!isValid) {
      const firstInvalid = formControls.find(control => !control.checkValidity());
      DOM.form.classList.add("was-validated");
      setStatus("Please fix the highlighted fields before submitting.", "error");
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }
    DOM.form.classList.remove("was-validated");
    setStatus("Submitting...");
    const submitBtn = DOM.form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    // Collect form data
    const formData = {
      name: document.getElementById('name').value,
      company: document.getElementById('company').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      country: document.getElementById('country').value,
      service: document.getElementById('service').value,
      details: document.getElementById('details').value
    };
    const url = SCRIPT_URL + "?" + new URLSearchParams(formData);
    fetch(url, { method: "GET", mode: "no-cors" })
      .then(() => {
        setStatus('Thank you! We have received your enquiry and will be in touch soon.', 'success');
        DOM.form.reset();
        if (submitBtn) submitBtn.disabled = false;
        setTimeout(() => {
          setStatus("");
        }, 5000);
      })
      .catch(() => {
        setStatus('Something went wrong. Please try again.', 'error');
        if (submitBtn) submitBtn.disabled = false;
      });
  });
}
// ============ BACK TO TOP BUTTON ============
function initializeBackToTop() {
  if (!DOM.backToTop) return;
  const handleScroll = () => {
    DOM.backToTop.classList.toggle("show", window.scrollY > 500);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  DOM.backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
// ============ NAVIGATION ============
function initializeNavigation() {
  if (DOM.navLinks.length === 0) return;
  DOM.navLinks.forEach(link => {
    link.addEventListener("click", () => {
      if (DOM.mainNav?.classList.contains("show") && window.bootstrap) {
        bootstrap.Collapse.getOrCreateInstance(DOM.mainNav).hide();
      }
    });
  });
}
// ============ CAROUSEL - OPTIMIZED ============
function initializeCarousel() {
  if (!DOM.track || !DOM.carouselContainer || !DOM.prevBtn || !DOM.nextBtn || !DOM.indicators) {
    return;
  }
  const items = Array.from(DOM.track.children);
  const totalItems = items.length;
  const autoScrollInterval = 4000;
  let currentPosition = 0;
  let visibleItems = 1;
  let autoScrollTimer = null;
  let isAnimating = false;
  // Performance: Request animation frame for smooth scrolling
  const clampPosition = () => {
    const maxPosition = Math.max(0, totalItems - visibleItems);
    currentPosition = Math.min(Math.max(0, currentPosition), maxPosition);
    return maxPosition;
  };
  const getVisibleItems = () => {
    const firstItem = items[0];
    if (!firstItem) return 1;
    const itemWidth = firstItem.getBoundingClientRect().width;
    const wrapperWidth = DOM.carouselContainer.querySelector('.carousel-wrapper').getBoundingClientRect().width;
    if (!itemWidth || !wrapperWidth) return 1;
    return Math.max(1, Math.round(wrapperWidth / itemWidth));
  };
  const renderIndicators = () => {
    DOM.indicators.innerHTML = '';
    const slideCount = Math.max(1, Math.ceil(totalItems / visibleItems));
    for (let i = 0; i < slideCount; i++) {
      const indicator = document.createElement('button');
      indicator.type = 'button';
      indicator.className = 'indicator' + (i === Math.floor(currentPosition / visibleItems) ? ' active' : '');
      indicator.setAttribute('aria-label', `Go to client slide ${i + 1}`);
      indicator.addEventListener('click', () => {
        goToSlide(i);
        resetAutoScroll();
      });
      DOM.indicators.appendChild(indicator);
    }
  };
  const updateIndicators = () => {
    const activeIndex = Math.floor(currentPosition / visibleItems);
    const indicators = DOM.indicators.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === activeIndex);
    });
  };
  const updateCarousel = () => {
    visibleItems = getVisibleItems();
    const maxPosition = clampPosition();
    const itemOffset = items[currentPosition] ? items[currentPosition].offsetLeft : 0;
    DOM.track.style.transform = `translateX(${-itemOffset}px)`;
    DOM.prevBtn.disabled = totalItems <= visibleItems;
    DOM.nextBtn.disabled = totalItems <= visibleItems;
    renderIndicators();
    updateIndicators();
    if (currentPosition > maxPosition) {
      currentPosition = maxPosition;
    }
  };
  const nextSlide = () => {
    if (isAnimating) return;
    const maxPosition = clampPosition();
    currentPosition = currentPosition < maxPosition ? currentPosition + 1 : 0;
    updateCarousel();
  };
  const prevSlide = () => {
    if (isAnimating) return;
    const maxPosition = clampPosition();
    currentPosition = currentPosition > 0 ? currentPosition - 1 : maxPosition;
    updateCarousel();
  };
  const goToSlide = (index) => {
    if (isAnimating) return;
    currentPosition = index * visibleItems;
    clampPosition();
    updateCarousel();
  };
  const startAutoScroll = () => {
    clearInterval(autoScrollTimer);
    if (totalItems > visibleItems) {
      autoScrollTimer = setInterval(nextSlide, autoScrollInterval);
    }
  };
  const resetAutoScroll = () => {
    startAutoScroll();
  };
  // Event listeners with passive flag
  DOM.nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAutoScroll();
  }, { passive: true });
  DOM.prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAutoScroll();
  }, { passive: true });
  DOM.carouselContainer.addEventListener('mouseenter', () => {
    clearInterval(autoScrollTimer);
  }, { passive: true });
  DOM.carouselContainer.addEventListener('mouseleave', () => {
    startAutoScroll();
  }, { passive: true });
  window.addEventListener('resize', () => {
    updateCarousel();
    resetAutoScroll();
  }, { passive: true });
  // Initial setup
  updateCarousel();
  startAutoScroll();
}
// ============ INITIALIZATION ============
// Only initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    initializeBackToTop();
    initializeNavigation();
    initializeCarousel();
  });
} else {
  // DOM is already loaded
  initializeForm();
  initializeBackToTop();
  initializeNavigation();
  initializeCarousel();
}
// Performance: Clean up on page unload
window.addEventListener('beforeunload', () => {
  // Remove event listeners if needed
}, { passive: true });
/**
 * Open a FAQ item with animation
 */
function openFAQ(faqItem) {
  const answer = faqItem.querySelector('.faq-answer');
  const question = faqItem.querySelector('.faq-question');
  if (answer) {
    answer.style.display = 'block';
    answer.style.opacity = '0';
    answer.style.transform = 'translateY(-10px)';
    requestAnimationFrame(() => {
      answer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      answer.style.opacity = '1';
      answer.style.transform = 'translateY(0)';
    });
  }
  faqItem.classList.add('open');
  question.setAttribute('aria-expanded', 'true');
}
/**
* Close a FAQ item with animation
*/
function closeFAQ(faqItem) {
  const answer = faqItem.querySelector('.faq-answer');
  const question = faqItem.querySelector('.faq-question');
  if (answer) {
    answer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    answer.style.opacity = '0';
    answer.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (!faqItem.classList.contains('open')) {
        answer.style.display = 'none';
      }
    }, 300);
  }
  faqItem.classList.remove('open');
  question.setAttribute('aria-expanded', 'false');
}
/**
 * FAQ Accordion
 * Only one FAQ can remain open at a time.
 */
document.querySelectorAll('.faq-question').forEach((question) => {
  question.addEventListener('click', () => {
    const currentItem = question.closest('.faq-item');
    const isOpen = currentItem.classList.contains('open');
    // Close all other FAQ items
    document.querySelectorAll('.faq-item.open').forEach((item) => {
      if (item !== currentItem) {
        closeFAQ(item);
      }
    });
    // Toggle current FAQ
    if (isOpen) {
      closeFAQ(currentItem);
    } else {
      openFAQ(currentItem);
    }
  });
});