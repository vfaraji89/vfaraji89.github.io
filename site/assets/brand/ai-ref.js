/* Visits that arrive from an AI assistant (a cited link in ChatGPT, Perplexity, Claude, Gemini,
   Copilot and the like) are counted as their own event, ai_referral, so the "AI answers" channel can
   be read in Google Analytics. Detected from the referrer or the utm_source the assistant adds.
   It only queues an event: nothing reaches Google unless the visitor said yes to analytics. */
(function () {
  if (typeof window.gtag !== 'function') return;
  var L = [
    [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|^openai$/, 'ChatGPT'], [/(^|\.)perplexity\.ai$/, 'Perplexity'], [/(^|\.)claude\.ai$/, 'Claude'],
    [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, 'Gemini'], [/(^|\.)copilot\.microsoft\.com$|(^|\.)copilot\.cloud\.microsoft$/, 'Copilot'],
    [/(^|\.)you\.com$/, 'You.com'], [/(^|\.)phind\.com$/, 'Phind'], [/(^|\.)meta\.ai$/, 'Meta AI'], [/(^|\.)deepseek\.com$/, 'DeepSeek'],
    [/(^|\.)grok\.com$/, 'Grok'], [/(^|\.)chat\.mistral\.ai$/, 'Le Chat'], [/(^|\.)kagi\.com$/, 'Kagi'], [/(^|\.)poe\.com$/, 'Poe']
  ];
  var u = '', h = '';
  try { u = (new URLSearchParams(location.search).get('utm_source') || '').toLowerCase().replace(/^https?:\/\//, '').split('/')[0]; } catch (e) {}
  try { h = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (e) {}
  for (var i = 0; i < L.length; i++) {
    if ((h && L[i][0].test(h)) || (u && L[i][0].test(u))) { window.gtag('event', 'ai_referral', { ai_source: L[i][1], landing_page: location.pathname }); return; }
  }
})();
