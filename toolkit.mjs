// HTML for the AI toolkit pages (/toolkit and /toolkit-full). Prompts live in content/toolkit.mjs.
// Written in the dark palette like the templates; theme.mjs maps the colours for light mode.
import { PROMPTS, GROUPS, FREE } from "./content/toolkit.mjs";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONO = "font-family: 'DM Mono', monospace";
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
export const word = (n) => WORDS[n] ?? String(n);
const num = (i) => String(i + 1).padStart(2, "0");
const label = (text, color = "#8B93A1") => `<h2 style="margin: 0 0 20px; ${MONO}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em; color: ${color}">${text}</h2>`;
const badge = (g) => `<span style="align-self: flex-start; display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; background: #1F2430; ${MONO}; font-size: 12px; font-weight: 500; color: ${GROUPS[g].color}">${GROUPS[g].label}</span>`;

// Styles and the copy-button script, injected into the page <head> / before </body>.
export const TOOLKIT_CSS = `<style>
.tk-card{animation:tk-up .5s ease both}
.tk-card:nth-child(2){animation-delay:.08s}.tk-card:nth-child(3){animation-delay:.16s}.tk-card:nth-child(4){animation-delay:.24s}.tk-card:nth-child(5){animation-delay:.32s}
@keyframes tk-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.tk-card{animation:none}}
.tk-prompt .br{color:#F1E27B}
.tk-copy:hover{border-color:#B7D26C !important;color:#F3F5F8 !important}
.tk-copy[data-done]{border-color:#B7D26C !important;color:#B7D26C !important}
.tk-locked{transition:border-color .2s ease,transform .2s ease}
.tk-locked:hover{border-color:#BB99F6 !important;transform:translateY(-3px)}
.tk-blur{filter:blur(3px);opacity:.55}
@media (max-width: 640px){.tk-pad{padding:24px 18px !important}.tk-prompt{font-size:13.5px !important;padding:58px 16px 18px !important}.tk-head{flex-direction:column;align-items:flex-start !important}}
@media print{nav,footer,.tk-copy,.tk-get{display:none !important}.tk-card{break-inside:avoid;animation:none}}
</style>`;
export const TOOLKIT_JS = `<script>document.addEventListener("click",function(e){var b=e.target.closest(".tk-copy");if(!b)return;var t=b.getAttribute("data-copy");function done(){b.setAttribute("data-done","");b.textContent="Copied";setTimeout(function(){b.removeAttribute("data-done");b.textContent="Copy prompt"},1800)}try{navigator.clipboard.writeText(t).then(done,function(){})}catch(_){}});</script>`;

const plain = (p) => [...p.prompt, "", ...p.guards.map((g) => "→ " + g)].join("\n");

function promptCard(p, i) {
  const lines = p.prompt.map((l) => (l ? esc(l).replace(/\[([^\]]+)\]/g, '<span class="br">[$1]</span>') : "&nbsp;")).join("<br>");
  const guards = p.guards.map((g) => `<span style="color: #B7D26C">→</span> ${esc(g)}`).join("<br>");
  return `<article id="prompt-${i + 1}" class="tk-card tk-pad" style="padding: 36px; border-radius: 14px; background: #161A20; border: 1px solid #222731; scroll-margin-top: 24px">
<div class="tk-head" style="display: flex; align-items: center; gap: 16px">
<span style="${MONO}; font-size: 40px; font-weight: 500; letter-spacing: -0.05em; line-height: 1; color: ${GROUPS[p.group].color}">${num(i)}</span>
<div style="display: flex; flex-direction: column; gap: 6px; min-width: 0">${badge(p.group)}<h3 style="margin: 0; ${MONO}; font-size: 24px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.25; color: #F3F5F8">${esc(p.title)}</h3></div>
</div>
<p style="margin: 16px 0 0; max-width: 680px; font-size: 17px; color: #AEB5C1">${esc(p.use)}</p>
<div style="position: relative; margin-top: 24px">
<div class="tk-prompt" style="padding: 24px 24px 24px; border-radius: 10px; background: #12161C; border: 1px solid #222731; ${MONO}; font-size: 15px; line-height: 1.7; color: #D9DDE4; overflow-wrap: anywhere">${lines}<br>&nbsp;<br>${guards}</div>
<button type="button" class="tk-copy" data-copy="${esc(plain(p))}" style="position: absolute; top: 12px; right: 12px; min-height: 36px; padding: 0 12px; border-radius: 6px; border: 1px solid #2E343E; background: #161A20; color: #AEB5C1; ${MONO}; font-size: 13px; cursor: pointer">Copy prompt</button>
</div>
<h4 style="margin: 28px 0 10px; ${MONO}; font-size: 13px; font-weight: 500; letter-spacing: 0.02em; color: #F4B8A7">// watch out for</h4>
<ul style="margin: 0; padding: 0 0 0 18px; display: flex; flex-direction: column; gap: 8px; font-size: 16px; color: #AEB5C1">${p.watch.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
</article>`;
}

function lockedCard(p, i) {
  return `<a href="#get" class="tk-card tk-locked" style="display: flex; flex-direction: column; padding: 24px; border-radius: 14px; background: #161A20; border: 1px solid #222731; color: inherit">
<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">${badge(p.group)}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B93A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Locked"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>
<h3 style="margin: 14px 0 0; ${MONO}; font-size: 20px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.3; color: #F3F5F8"><span style="color: #6E7684">${num(i)}</span> ${esc(p.title)}</h3>
<p style="margin: 10px 0 18px; font-size: 15px; color: #AEB5C1">${esc(p.use)}</p>
<div aria-hidden="true" class="tk-blur" style="margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding: 14px; border-radius: 8px; background: #12161C"><span style="height: 8px; width: 88%; border-radius: 4px; background: #2E343E"></span><span style="height: 8px; width: 64%; border-radius: 4px; background: #2E343E"></span><span style="height: 8px; width: 76%; border-radius: 4px; background: #3A414D"></span></div>
</a>`;
}

export const toolkitHero = (heading, text, { cta = true } = {}) => `<!-- TOOLKIT HERO -->
  <section class="page-hero" style="max-width: 1200px; margin: 0 auto; padding: 96px 24px 56px">
${label("// free toolkit for engineering managers", "#B7D26C")}
<h1 style="margin: 0; max-width: 960px; ${MONO}; font-weight: 500; font-size: clamp(34px, 4.2vw, 54px); line-height: 1.24; letter-spacing: -0.05em; color: #F3F5F8">${heading}</h1>
<p style="margin: 24px 0 0; max-width: 720px; font-size: 20px; line-height: 1.55; color: #AEB5C1">${text}</p>
<p style="margin: 28px 0 0; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; ${MONO}; font-size: 14px; color: #6E7684">${cta ? `<a href="#get" class="btn-primary btn-green" style="display: inline-flex; align-items: center; min-height: 48px; padding: 0 22px; border-radius: 6px; background: #B7D26C; color: #0D1117; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 700">Get all ${word(PROMPTS.length)} prompts</a>` : ""}<span>${PROMPTS.length} prompts · copy-ready · works in any AI assistant</span></p>
  </section>`;

// The test underneath every prompt (from the "Half Manager" talk).
export const toolkitRule = () => `<!-- THE RULE -->
  <section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 72px">
${label("// the test underneath every prompt")}
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 20px">
<div class="tk-pad" style="padding: 32px; border-radius: 14px; background: #1A2213; border: 1px solid #3A4A22"><h3 style="margin: 0; ${MONO}; font-size: 20px; font-weight: 500; letter-spacing: -0.03em; color: #B7D26C">Give it to AI</h3><p style="margin: 12px 0 0; font-size: 17px; color: #D6E3B4">The first version already exists somewhere: in notes, tickets, or your own head. A mediocre first draft is fine, because you review it before it reaches anyone.</p></div>
<div class="tk-pad" style="padding: 32px; border-radius: 14px; background: #19162A; border: 1px solid #3A3157"><h3 style="margin: 0; ${MONO}; font-size: 20px; font-weight: 500; letter-spacing: -0.03em; color: #BB99F6">Keep it for yourself</h3><p style="margin: 12px 0 0; font-size: 17px; color: #C9C2E0">There is no first draft of this moment. The person on the other end experiences it once, live, and there's no quiet second pass afterwards.</p></div>
</div>
  </section>`;

export const toolkitPrompts = (list = PROMPTS.slice(0, FREE), title = "// the prompts", offset = 0) => `<!-- PROMPTS -->
  <section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 72px">
${label(title)}
<div style="display: flex; flex-direction: column; gap: 24px">${list.map((p, i) => promptCard(p, i + offset)).join("\n")}</div>
  </section>`;

export const toolkitLocked = () => `<!-- LOCKED -->
  <section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 72px">
${label(`// ${PROMPTS.length - FREE} more in the full toolkit`)}
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 20px">${PROMPTS.slice(FREE).map((p, i) => lockedCard(p, i + FREE)).join("\n")}</div>
  </section>`;

export const toolkitGet = () => `<!-- GET THE TOOLKIT -->
  <section id="get" class="tk-get" style="max-width: 1200px; margin: 0 auto; padding: 0 24px 72px; scroll-margin-top: 24px">
    <div class="pad-box" style="display: flex; flex-wrap: wrap; gap: 32px; align-items: center; padding: 40px; border-radius: 14px; background: #1A2213; border: 1px solid #3A4A22">
      <div style="flex: 999 1 360px; min-width: 0">
        <h2 style="margin: 0; ${MONO}; font-weight: 500; font-size: 26px; letter-spacing: -0.03em; color: #F3F5F8">Get all ${word(PROMPTS.length)} prompts</h2>
        <p style="margin: 8px 0 0; font-size: 16px; color: #D6E3B4">Subscribe to the newsletter and the full toolkit opens as soon as you confirm your email. You'll also get my notes on engineering leadership, drawn from real coaching conversations. Unsubscribe whenever you like.</p>
      </div>
      <form method="POST" action="/api/subscribe" style="flex: 1 1 420px; min-width: 0; display: flex; flex-direction: column">
        <label for="tk-nl" class="sr-only">Your email</label>
        <div class="nl-row" style="display: flex; flex-wrap: nowrap; gap: 8px">
          <input id="tk-nl" name="email" type="email" required autocomplete="email" placeholder="you@company.com" style="flex: 1 1 auto; min-width: 0; min-height: 48px; padding: 0 14px; border-radius: 6px; border: 1px solid #4E6230; background: #0D1117; color: #F3F5F8; font: inherit; font-size: 15px">
          <button type="submit" class="btn-primary btn-green" style="flex: none; min-height: 48px; padding: 0 20px; border: 0; border-radius: 6px; background: #B7D26C; color: #0D1117; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer">Send me the toolkit</button>
        </div>
      <p hidden><label>Leave this empty <input name="company-website"></label></p></form>
    </div>
  </section>`;

export const toolkitBeforeYouPaste = () => `<!-- BEFORE YOU PASTE -->
  <section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 72px">
<div class="tk-pad" style="display: flex; gap: 16px; align-items: flex-start; padding: 28px 32px; border-radius: 14px; background: #12161C; border: 1px solid #222731">
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F1E27B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex: none; margin-top: 3px" aria-hidden="true"><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17.5v.01"/></svg>
<p style="margin: 0; font-size: 16px; color: #AEB5C1"><strong style="font-weight: 600; color: #F3F5F8">Before you paste anything about a person:</strong> check what your company allows you to share with AI tools. Use initials, strip anything identifying, and keep health or personal details out entirely.</p>
</div>
  </section>`;

export const toolkitClose = (after = "") => `<!-- CLOSE -->
  <section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 120px">
<div class="tk-pad" style="padding: 48px 40px; border-radius: 14px; background: #161A20; border: 1px solid #222731">
<p style="margin: 0; max-width: 820px; ${MONO}; font-size: clamp(20px, 2.2vw, 26px); font-weight: 500; line-height: 1.5; letter-spacing: -0.03em; color: #F3F5F8">The part that was never the job: you now know how to hand it off. The part that is the job: delivering hard feedback, the promotion conversation, sitting with someone who's burned out, admitting you were wrong. <mark class="hl hl-violet">That one's still yours.</mark></p>
${after}
</div>
  </section>`;

// A box linking to the full toolkit, for the page people land on after confirming.
export const toolkitUnlocked = () => `<!-- TOOLKIT UNLOCKED -->
  <section style="max-width: 1200px; margin: 0 auto; padding: 0 24px 72px">
<a href="/toolkit-full" class="start-card" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 20px 32px; padding: 32px 36px; border-radius: 14px; background: #1A2213; border: 1px solid #3A4A22; color: inherit">
<div style="flex: 1 1 420px; min-width: 0"><span style="${MONO}; font-size: 13px; font-weight: 500; color: #B7D26C">// unlocked</span><h2 class="start-title" style="margin: 8px 0 0; ${MONO}; font-size: 26px; font-weight: 500; letter-spacing: -0.03em; line-height: 1.3; color: #F3F5F8; transition: color .2s ease">The AI toolkit for engineering managers</h2><p style="margin: 8px 0 0; font-size: 16px; color: #D6E3B4">All ${word(PROMPTS.length)} prompts: feedback, team pulse, performance reviews, promotion cases, hard conversations, hiring and onboarding.</p></div>
<span class="btn-primary btn-green" style="flex: none; display: inline-flex; align-items: center; min-height: 48px; padding: 0 22px; border-radius: 6px; background: #B7D26C; color: #0D1117; font-size: 15px; font-weight: 700">Open the toolkit →</span>
</a>
  </section>`;

export { PROMPTS, FREE };
