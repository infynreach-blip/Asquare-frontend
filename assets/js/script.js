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

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzh0Ck4Lw45YUVJ_Oe9NveODb7YlTY7nMuZlMexoU80UZ46kKxIhxMWw6ECpvh9LgYz/exec';

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

    // Collect form data using URLSearchParams for POST request
    const formData = new URLSearchParams({
      name: document.getElementById('name').value,
      company: document.getElementById('company').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      country: document.getElementById('country').value,
      service: document.getElementById('service').value,
      details: document.getElementById('details').value
    });

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    })
      .then(() => {
        setStatus('Thank you! We have received your enquiry and will be in touch soon.', 'success');
        DOM.form.reset();
        formControls.forEach(control => {
          control.classList.remove("is-valid", "is-invalid");
        });
        if (submitBtn) submitBtn.disabled = false;
        setTimeout(() => {
          setStatus("");
        }, 5000);
      })
      .catch((error) => {
        console.error('Submission error:', error);
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
  if (!DOM.mainNav || DOM.navLinks.length === 0) return;
  DOM.navLinks.forEach(link => {
    if (link.classList.contains("dropdown-toggle")) return;

    link.addEventListener("click", () => {
      if (window.innerWidth < 1200 && DOM.mainNav.classList.contains("show") && window.bootstrap?.Collapse) {
        window.bootstrap.Collapse.getOrCreateInstance(DOM.mainNav).hide();
      }
    });
  });
}

// ============ CAROUSEL - OPTIMIZED ============
function initializeCarousel() {
  if (!DOM.track || !DOM.carouselContainer || !DOM.prevBtn || !DOM.nextBtn || !DOM.indicators) {
    return;
  }
  const carouselWrapper = DOM.carouselContainer.querySelector('.carousel-wrapper');
  if (!carouselWrapper) return;

  const items = Array.from(DOM.track.children);
  const totalItems = items.length;
  const autoScrollInterval = 4000;
  let currentPosition = 0;
  let visibleItems = 1;
  let autoScrollTimer = null;
  let isAnimating = false;
  let dragState = null;

  const clampPosition = () => {
    const maxPosition = Math.max(0, totalItems - visibleItems);
    currentPosition = Math.min(Math.max(0, currentPosition), maxPosition);
    return maxPosition;
  };

  const getVisibleItems = () => {
    const firstItem = items[0];
    if (!firstItem) return 1;
    const itemWidth = firstItem.getBoundingClientRect().width;
    const wrapperWidth = carouselWrapper.getBoundingClientRect().width;
    if (!itemWidth || !wrapperWidth) return 1;
    const gap = parseFloat(window.getComputedStyle(DOM.track).columnGap) || 0;
    return Math.max(1, Math.floor((wrapperWidth + gap) / (itemWidth + gap)));
  };

  const getActiveIndicatorIndex = () => {
    const slideCount = Math.max(1, Math.ceil(totalItems / visibleItems));
    const isAtEnd = currentPosition >= totalItems - visibleItems;
    return Math.min(isAtEnd ? slideCount - 1 : Math.floor(currentPosition / visibleItems), slideCount - 1);
  };

  const renderIndicators = () => {
    DOM.indicators.innerHTML = '';
    const slideCount = Math.max(1, Math.ceil(totalItems / visibleItems));
    for (let i = 0; i < slideCount; i++) {
      const indicator = document.createElement('button');
      indicator.type = 'button';
      indicator.className = 'indicator' + (i === getActiveIndicatorIndex() ? ' active' : '');
      indicator.setAttribute('aria-label', `Go to client slide ${i + 1}`);
      indicator.addEventListener('click', () => {
        goToSlide(i);
        resetAutoScroll();
      });
      DOM.indicators.appendChild(indicator);
    }
  };

  const updateIndicators = () => {
    const activeIndex = getActiveIndicatorIndex();
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
    if (!dragState?.isDragging) startAutoScroll();
  }, { passive: true });

  carouselWrapper.addEventListener('pointerdown', (event) => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || totalItems <= visibleItems) return;
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: items[currentPosition]?.offsetLeft || 0,
      isDragging: false,
      isVertical: false
    };
    clearInterval(autoScrollTimer);
    carouselWrapper.setPointerCapture(event.pointerId);
  });

  carouselWrapper.addEventListener('pointermove', (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId || dragState.isVertical) return;
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.isDragging && Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 8) return;
    if (!dragState.isDragging && Math.abs(deltaY) > Math.abs(deltaX)) {
      dragState.isVertical = true;
      return;
    }

    dragState.isDragging = true;
    carouselWrapper.classList.add('is-dragging');
    DOM.track.style.transform = `translateX(${-dragState.startOffset + deltaX}px)`;
  });

  const finishPointerGesture = (event, canceled = false) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;

    const { startX, isDragging } = dragState;
    const deltaX = event.clientX - startX;
    if (isDragging) {
      const itemWidth = items[0]?.getBoundingClientRect().width || 1;
      const threshold = Math.max(32, itemWidth * 0.15);

      if (!canceled && Math.abs(deltaX) >= threshold) {
        const maxPosition = clampPosition();
        const range = maxPosition + 1;
        const steps = Math.max(1, Math.round(Math.abs(deltaX) / (itemWidth * 0.6)));
        const direction = deltaX < 0 ? 1 : -1;
        currentPosition = (currentPosition + direction * steps % range + range) % range;
      }

      carouselWrapper.classList.remove('is-dragging');
      updateCarousel();
    }

    dragState = null;
    if (carouselWrapper.hasPointerCapture(event.pointerId)) {
      carouselWrapper.releasePointerCapture(event.pointerId);
    }
    startAutoScroll();
  };

  carouselWrapper.addEventListener('pointerup', (event) => finishPointerGesture(event));
  carouselWrapper.addEventListener('pointercancel', (event) => finishPointerGesture(event, true));
  carouselWrapper.addEventListener('lostpointercapture', (event) => finishPointerGesture(event, true));

  window.addEventListener('resize', () => {
    updateCarousel();
    resetAutoScroll();
  }, { passive: true });

  updateCarousel();
  startAutoScroll();
}

// ============ FAQ ACCORDION ============
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

function initializeFAQ() {
  document.querySelectorAll('.faq-question').forEach((question) => {
    question.addEventListener('click', () => {
      const currentItem = question.closest('.faq-item');
      const isOpen = currentItem.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach((item) => {
        if (item !== currentItem) {
          closeFAQ(item);
        }
      });

      if (isOpen) {
        closeFAQ(currentItem);
      } else {
        openFAQ(currentItem);
      }
    });
  });
}

// ============ INITIALIZATION ============
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeForm();
    initializeBackToTop();
    initializeNavigation();
    initializeCarousel();
    initializeFAQ();
  });
} else {
  initializeForm();
  initializeBackToTop();
  initializeNavigation();
  initializeCarousel();
  initializeFAQ();
}

window.addEventListener('beforeunload', () => {
  // Clean up if needed
}, { passive: true });
document.addEventListener("DOMContentLoaded", function () {
    const partnersCarousel = new Swiper(".partners-carousel", {
        slidesPerView: 2,
        spaceBetween: 12,
        speed: 600,
        loop: true,
        grabCursor: true,

        autoplay: {
            delay: 1000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },

        navigation: {
            nextEl: ".partners-next",
            prevEl: ".partners-prev"
        },

        pagination: {
            el: ".partners-pagination",
            clickable: true
        },

        breakpoints: {
            576: {
                slidesPerView: 3,
                spaceBetween: 16
            },
            768: {
                slidesPerView: 4,
                spaceBetween: 18
            },
            992: {
                slidesPerView: 5,
                spaceBetween: 20
            },
            1200: {
                slidesPerView: 6,
                spaceBetween: 24
            },
            1400: {
                slidesPerView: 7,
                spaceBetween: 24
            }
        },

        a11y: {
            enabled: true
        }
    });
});
