// ============================================================
// Bank Islam — Retail Onboarding Demo
// Shared interactions: mobile nav, dropdowns, Start Onboarding CTA
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Mobile nav toggle ---- */
  const navToggle = document.getElementById('navToggle');
  const navList = document.getElementById('navList');
  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ---- Dropdown menus (Retail Banking / Business Banking) ---- */
  document.querySelectorAll('.dd > .nav-top').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const li = btn.closest('li');
      const wasOpen = li.classList.contains('open');
      document.querySelectorAll('.dd.open').forEach(el => {
        el.classList.remove('open');
        el.querySelector('.nav-top')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        li.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dd')) {
      document.querySelectorAll('.dd.open').forEach(el => el.classList.remove('open'));
    }
  });

  /* ---- Start Onboarding CTA ----
     Calls the backend at /api/start-onboarding, which in turn calls the
     Docusign Workflow Builder "trigger workflow" endpoint server-side.
     The modal reflects the live result of that call (loading/success/error).
  */
  const startBtn = document.getElementById('startOnboardBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalDialog = document.getElementById('modalDialog');
  const modalClose = document.getElementById('modalClose');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalRetryAction = document.getElementById('modalRetryAction');
  const modalEmbedWrap = document.getElementById('modalEmbedWrap');
  const modalEmbedFrame = document.getElementById('modalEmbedFrame');
  const modalEmbedFallbackLink = document.getElementById('modalEmbedFallbackLink');

  const ICON_CHECK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_LOADING = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2.4" stroke-dasharray="30 12" stroke-linecap="round"/></svg>';
  const ICON_ERROR = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16.5h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4"/></svg>';

  if (startBtn && modalOverlay) {
    startBtn.addEventListener('click', () => {
      triggerOnboardingWorkflow();
    });
  }
  if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', () => closeModal());
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }
  if (modalRetryAction) {
    modalRetryAction.addEventListener('click', () => triggerOnboardingWorkflow());
  }

  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove('open');
    resetModalEmbed();
  }

  function resetModalEmbed() {
    if (modalDialog) modalDialog.classList.remove('modal-embed');
    if (modalEmbedWrap) modalEmbedWrap.style.display = 'none';
    if (modalEmbedFrame) modalEmbedFrame.src = '';
  }

  function showModalLoading() {
    resetModalEmbed();
    if (modalIcon) modalIcon.innerHTML = ICON_LOADING;
    if (modalTitle) modalTitle.textContent = 'Starting your application…';
    if (modalBody) modalBody.innerHTML = '<p>Please wait while we start your onboarding workflow.</p>';
    if (modalRetryAction) modalRetryAction.style.display = 'none';
    if (modalOverlay) modalOverlay.classList.add('open');
  }

function showModalSuccess(data) {
  if (modalIcon) modalIcon.innerHTML = ICON_CHECK;
  if (modalTitle) modalTitle.textContent = 'Your application is ready';
  if (modalBody) modalBody.innerHTML = '<p>Continue below to complete your onboarding.</p>';
  if (modalRetryAction) modalRetryAction.style.display = 'none';

  // Docusign's docs are inconsistent about casing for this field across
  // endpoints, so check the common variants defensively.
  const instanceUrl =
    (data && (data.workflow_instance_url || data.workflowInstanceUrl || data.instance_url || data.url)) || null;

  if (instanceUrl) {
    if (modalDialog) modalDialog.classList.add('modal-embed');
    if (modalEmbedFrame) modalEmbedFrame.src = instanceUrl;
    if (modalEmbedFallbackLink) modalEmbedFallbackLink.href = instanceUrl;
    if (modalEmbedWrap) modalEmbedWrap.style.display = '';
  } else {
    // No usable URL in the response — surface that clearly instead of
    // silently showing an empty success modal.
    if (modalBody) {
      modalBody.innerHTML =
        '<p>The workflow started, but no application link was returned. Check the API response shape.</p>';
    }
    console.warn('[start-onboarding] Unexpected response shape, no instance URL found:', data);
  }
}

  function showModalError(message) {
    if (modalIcon) modalIcon.innerHTML = ICON_ERROR;
    if (modalTitle) modalTitle.textContent = 'Something went wrong';
    if (modalBody) modalBody.innerHTML = `<p>${message || 'We could not start your onboarding workflow. Please try again.'}</p>`;
    if (modalRetryAction) modalRetryAction.style.display = '';
  }

  function triggerOnboardingWorkflow() {
    showModalLoading();

    fetch('/api/start-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Web applicant' }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Unknown error');
        showModalSuccess(data);
      })
      .catch((err) => {
        console.error('Failed to start onboarding workflow:', err);
        showModalError(err.message);
      });
  }
});
