/**
 * NexGuild Verification Widget
 * Drop this script tag on any partner site to enable proof-code generation.
 *
 * Usage:
 *   <script src="https://www.nexguild.in/nexguild-verify.js"
 *           data-site-slug="starscoopdaily"
 *           data-countdown="45"
 *           data-scroll="0.3"></script>
 *
 * The page URL must include ?nexguild_user_id={userId} — NexGuild appends
 * this automatically when a contributor clicks the task link.
 */
(function () {
  'use strict';

  var script            = document.currentScript;
  var NEXGUILD_API      = 'https://www.nexguild.in';
  var SITE_SLUG         = (script && script.getAttribute('data-site-slug'))  || 'starscoopdaily';
  var COUNTDOWN_SECONDS = parseInt((script && script.getAttribute('data-countdown')) || '45', 10);
  var SCROLL_THRESHOLD  = parseFloat((script && script.getAttribute('data-scroll'))  || '0.3');

  var params = new URLSearchParams(window.location.search);
  var userId = params.get('nexguild_user_id');

  // Only activate when a NexGuild user is visiting via a task link
  if (!userId) return;

  // ── Styles ────────────────────────────────────────────────────────────────
  var css = document.createElement('style');
  css.textContent = [
    '#ng-widget{',
      'position:fixed;bottom:20px;right:20px;width:272px;',
      'background:#0d2b26;border:1.5px solid rgba(2,180,145,.4);',
      'border-radius:14px;padding:14px 16px 16px;',
      'box-shadow:0 8px 32px rgba(0,0,0,.45);',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'font-size:13px;color:#e2f7f3;z-index:2147483647;',
      'transition:opacity .3s;',
    '}',
    '#ng-widget-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}',
    '#ng-widget-title{font-weight:700;font-size:12px;color:#02b491;letter-spacing:.03em;text-transform:uppercase;}',
    '#ng-widget-close{',
      'cursor:pointer;background:none;border:none;color:#6b9e96;',
      'font-size:16px;line-height:1;padding:0 2px;',
    '}',
    '#ng-widget-close:hover{color:#e2f7f3;}',
    '#ng-status{font-size:12px;color:#9dc9c0;margin-bottom:10px;line-height:1.5;}',
    '#ng-countdown{',
      'font-size:28px;font-weight:800;color:#02b491;text-align:center;',
      'letter-spacing:-.02em;margin:8px 0;',
    '}',
    '#ng-code-box{',
      'background:#0f3d36;border:1.5px dashed rgba(2,180,145,.5);',
      'border-radius:10px;padding:10px 14px;text-align:center;margin:8px 0;',
    '}',
    '#ng-code-label{font-size:11px;color:#6b9e96;margin-bottom:4px;}',
    '#ng-code-value{',
      'font-size:24px;font-weight:900;color:#fff;letter-spacing:.25em;',
      'font-family:"Courier New",Courier,monospace;',
    '}',
    '#ng-btn-row{display:flex;gap:8px;margin-top:10px;}',
    '.ng-btn{',
      'flex:1;padding:7px 10px;border-radius:8px;border:none;cursor:pointer;',
      'font-size:12px;font-weight:700;transition:opacity .15s;',
    '}',
    '.ng-btn:hover{opacity:.85;}',
    '#ng-btn-copy{background:#02b491;color:#fff;}',
    '#ng-btn-back{background:rgba(2,180,145,.15);color:#02b491;border:1px solid rgba(2,180,145,.35);}',
    '#ng-scroll-note{font-size:11px;color:#6b9e96;text-align:center;padding:4px 0;}',
  ].join('');
  document.head.appendChild(css);

  // ── Widget HTML ──────────────────────────────────────────────────────────
  var widget = document.createElement('div');
  widget.id  = 'ng-widget';
  widget.innerHTML = [
    '<div id="ng-widget-header">',
      '<span id="ng-widget-title">🔒 NexGuild Task Active</span>',
      '<button id="ng-widget-close" title="Dismiss">✕</button>',
    '</div>',
    '<div id="ng-status">Scroll down to start the timer.</div>',
    '<div id="ng-scroll-note">Scroll ↓ to activate</div>',
    '<div id="ng-countdown" style="display:none"></div>',
    '<div id="ng-code-box" style="display:none">',
      '<div id="ng-code-label">Your verification code</div>',
      '<div id="ng-code-value"></div>',
    '</div>',
    '<div id="ng-btn-row" style="display:none">',
      '<button class="ng-btn" id="ng-btn-copy">Copy Code</button>',
      '<button class="ng-btn" id="ng-btn-back">Return to NexGuild</button>',
    '</div>',
  ].join('');
  document.body.appendChild(widget);

  // ── Element refs ─────────────────────────────────────────────────────────
  var elStatus    = document.getElementById('ng-status');
  var elScrollNote = document.getElementById('ng-scroll-note');
  var elCountdown = document.getElementById('ng-countdown');
  var elCodeBox   = document.getElementById('ng-code-box');
  var elCodeValue = document.getElementById('ng-code-value');
  var elBtnRow    = document.getElementById('ng-btn-row');
  var elBtnCopy   = document.getElementById('ng-btn-copy');
  var elBtnBack   = document.getElementById('ng-btn-back');
  var elClose     = document.getElementById('ng-widget-close');

  // ── State ────────────────────────────────────────────────────────────────
  var state           = 'waiting_scroll';
  var remaining       = COUNTDOWN_SECONDS;
  var generatedCode   = null;
  var timerInterval   = null;
  var scrollHandled   = false;

  // ── Scroll detection ──────────────────────────────────────────────────────
  function getScrollRatio() {
    var el     = document.documentElement;
    var scrolled = window.scrollY || el.scrollTop;
    var total    = (el.scrollHeight - el.clientHeight) || 1;
    return scrolled / total;
  }

  function onScroll() {
    if (scrollHandled || state !== 'waiting_scroll') return;
    if (getScrollRatio() >= SCROLL_THRESHOLD) {
      scrollHandled = true;
      window.removeEventListener('scroll', onScroll);
      startCountdown();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  // Check immediately in case the page is short and already scrolled
  onScroll();

  // ── Countdown ────────────────────────────────────────────────────────────
  function startCountdown() {
    state = 'countdown';
    elScrollNote.style.display = 'none';
    elCountdown.style.display  = 'block';
    elStatus.textContent = 'Keep reading… your code is being generated.';
    renderCountdown();

    timerInterval = setInterval(function () {
      remaining--;
      renderCountdown();
      if (remaining <= 0) {
        clearInterval(timerInterval);
        fetchCode();
      }
    }, 1000);
  }

  function renderCountdown() {
    elCountdown.textContent = remaining + 's';
  }

  // ── Code fetch ──────────────────────────────────────────────────────────
  function fetchCode() {
    state = 'fetching';
    elCountdown.textContent = '⏳';
    elStatus.textContent = 'Generating your code…';

    var url = NEXGUILD_API + '/api/tasks/proof-code/generate'
      + '?user_id='   + encodeURIComponent(userId)
      + '&site_slug=' + encodeURIComponent(SITE_SLUG);

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.code) {
          showCode(data.code, data.expires_in_seconds);
        } else {
          showError();
        }
      })
      .catch(showError);
  }

  // ── UI states ────────────────────────────────────────────────────────────
  function showCode(code, expiresIn) {
    state         = 'done';
    generatedCode = code;

    elCountdown.style.display = 'none';
    elCodeBox.style.display   = 'block';
    elBtnRow.style.display    = 'flex';
    elCodeValue.textContent   = code;

    var mins = Math.ceil((expiresIn || 3600) / 60);
    elStatus.textContent = 'Code valid for ~' + mins + ' min. Enter it in your NexGuild task.';
  }

  function showError() {
    state = 'error';
    elCountdown.style.display = 'none';
    elStatus.textContent = 'Could not generate code. Please refresh the page and try again.';
  }

  // ── Button handlers ───────────────────────────────────────────────────────
  elBtnCopy.addEventListener('click', function () {
    if (!generatedCode) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generatedCode).then(function () {
        elBtnCopy.textContent = 'Copied!';
        setTimeout(function () { elBtnCopy.textContent = 'Copy Code'; }, 2000);
      });
    } else {
      // Fallback for older browsers
      var ta = document.createElement('textarea');
      ta.value = generatedCode;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      elBtnCopy.textContent = 'Copied!';
      setTimeout(function () { elBtnCopy.textContent = 'Copy Code'; }, 2000);
    }
  });

  elBtnBack.addEventListener('click', function () {
    window.location.href = 'https://www.nexguild.in/dashboard/tasks';
  });

  elClose.addEventListener('click', function () {
    // Hide widget but keep code accessible if already generated
    if (state === 'done') {
      widget.style.opacity = '0.3';
      widget.style.pointerEvents = 'none';
      // Show a small sticky badge instead
      var badge = document.createElement('div');
      badge.style.cssText = [
        'position:fixed;bottom:20px;right:20px;',
        'background:#0d2b26;border:1.5px solid rgba(2,180,145,.4);',
        'border-radius:8px;padding:6px 12px;',
        'font-family:-apple-system,sans-serif;font-size:12px;font-weight:700;',
        'color:#02b491;cursor:pointer;z-index:2147483647;',
        'box-shadow:0 4px 12px rgba(0,0,0,.3);',
      ].join('');
      badge.textContent = 'Code: ' + generatedCode;
      badge.title = 'Click to restore NexGuild widget';
      badge.addEventListener('click', function () {
        widget.style.opacity = '1';
        widget.style.pointerEvents = 'auto';
        document.body.removeChild(badge);
      });
      document.body.appendChild(badge);
    } else {
      widget.remove();
    }
  });
})();
