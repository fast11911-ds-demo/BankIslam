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
     This is the button referenced in the onboarding brief. In production,
     replace triggerOnboardingWorkflow() below with a call to your backend,
     which in turn calls the Docusign Workflow Builder "trigger workflow"
     endpoint (workflow ID + applicant payload). Never call Docusign's API
     directly from client-side JS — the access token must stay server-side.
  */
  const startBtn = document.getElementById('startOnboardBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');

  if (startBtn && modalOverlay) {
    startBtn.addEventListener('click', () => {
      triggerOnboardingWorkflow();
      modalOverlay.classList.add('open');
    });
  }
  if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', () => modalOverlay.classList.remove('open'));
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('open');
    });
  }

  function triggerOnboardingWorkflow() {
    // --- DEMO STUB ---
    // Swap this console.log for a real fetch to your backend endpoint, e.g.:
    //
    // fetch('/api/onboarding/start', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ product: 'Retail Banking Onboarding', channel: 'web-mockup-demo' })
    // })
    //   .then(res => res.json())
    //   .then(data => console.log('Workflow instance started:', data))
    //   .catch(err => console.error('Failed to start onboarding workflow:', err));
    //
    // Your backend then calls Docusign Workflow Builder's trigger-workflow
    // API (POST /v1/workflows/{workflowId}/trigger) using a server-held
    // access token — see js/main.js comment block and README.md.
    console.log('[demo] Start Onboarding clicked — would trigger Docusign Workflow Builder workflow here.');
  }
});
