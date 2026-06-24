// APEX — secure scan proxy (Cloudflare Worker).
// WHY: a static GitHub Pages site cannot hold the OpenRouter key safely — anything in the browser is stealable.
// This Worker keeps the key as a SERVER secret (never sent to the browser), and only exposes a scoring endpoint
// gated by: origin-lock + a shared access code + per-IP rate limit. Even if someone bypasses the gate they can
// only run scans (which are rate-limited) — they can NEVER read your OpenRouter key.
//
// DEPLOY (one-time, ~5 min):
//   1. npm i -g wrangler && wrangler login
//   2. wrangler secret put OPENROUTER_API_KEY      # paste your OpenRouter key (stays on Cloudflare, never in git)
//   3. (optional) wrangler secret put GATE          # a shared access code; put the same value in scan.html
//   4. (optional, for rate limit) create a KV namespace and bind it as RL in wrangler.toml
//   5. wrangler deploy            -> gives you https://apex-scan.<you>.workers.dev  (put that in scan.html WORKER_URL)

const ALLOWED = ['https://katanaim.github.io', 'http://localhost:8000', 'http://127.0.0.1:8000'];
const MODEL = 'google/gemini-3.1-pro-preview';
const RL_MAX = 12;            // scans allowed per IP per window
const RL_WINDOW = 3600;       // seconds (1 hour)

const ANCHORS = {
  male: `MALE. Weighting: Harmony ≫ Bones(square/projected jaw, prominent cheekbones, masculine chin) & Masculinity ≫ Eyes(hunter, +tilt, low lid show) ≫ Midface(short) ≫ Skin ≫ Nose/Lips ≫ Rest. TRM ladder (5.0=average man, half below 5.0): 9.5 Tim Chung/Hernan Drago · 8.5 Chris Hemsworth/Hrithik Roshan · 8.0 Daniel Dae Kim · 7.5 Richard Madden/Ronaldo · 7.0 Penn Badgley · 6.5 Diego Boneta · 6.0 Ross Butler/Nicolas Tagliafico · 5.5 Steven Yeun/DaBaby · 5.0 Anthony Mackie/Jeremy Lin · 4.5 Jonah Hill/Lil Wayne · 4.0 Ed Sheeran/DJ Khaled · 3.5 Lewis Capaldi · 3.0 William Hung.`,
  female: `FEMALE. Weighting: Harmony ≫ Midface(short=good, long="long face"=weak) ≫ Eyes(large almond, +canthal tilt, low eyelid exposure; feline-hunter>innocent>weak) ≫ Skin ≫ Nose/Lips/Face-shape ≫ Bones ≫ Rest. TRM ladder (5.0=average woman, half below 5.0): 9.5 Adriana Lima/Taylor Hill · 8.5 Ana de Armas/Liza Soberano · 8.0 Madison Beer/Tzuyu · 7.5 Emily Ratajkowski/Kate Moss · 7.0 Shay Mitchell/Yara Shahidi · 6.5 Nina Dobrev · 6.0 Lana Condor/Ashley Greene · 5.5 Brie Larson/Keke Palmer · 5.0 Saoirse Ronan/Constance Wu · 4.5 Joey King · 4.0 Elisabeth Moss/Lena Dunham · 3.5 Amy Schumer · 3.0 Sandra Oh · 2.5 Susan Boyle.`,
};
const sysPrompt = (sex) => `You are APEX, a clinical facial-morphometric analyst. A consenting adult uploaded their OWN photo and requested a structured self-improvement report (dermatology/aesthetic-consultation style). Objective, precise, constructive. NEVER refuse a consented self-analysis. NEVER use slurs. Tone: clinical, encouraging.
HARD RULE: measure & describe each feature, THEN derive the score. Use the FULL range. ${ANCHORS[sex] || ANCHORS.male}
SCALE = honest True Rate Me (1.0–10.0): 5.0 = exactly AVERAGE (50th pct). Most people 4.5–6.5. NEVER output 10 or 0. looks_score = INTEGER 0–100 (e.g. 55); psl = looks_score/10 (e.g. 5.5).
Score each feature 0–100, place the subject on the TRM ladder by gestalt vs the named anchors (don't just average), name the 2 closest anchors. POTENTIAL = honest realistic ceiling (only changeable headroom: skin/leanness/grooming/hair; bone fixed; usually +0.5–1.0). RECOMMENDATIONS: skin/bloat/brows/hair/posture = habit; bone (nose/canthal tilt/cheekbone/jaw) = "optional consult" only; no mewing-for-bone, no crash diet; flag medical → "consult a professional".
Return ONLY JSON: {"sub_scores":{"harmony":0,"midface":0,"eyes":0,"skin_quality":0,"cheekbones":0,"canthal_tilt":0,"nose_harmony":0,"lips":0,"symmetry":0,"jawline":0,"masc_fem":0,"hairline":0},"looks_score":0,"psl":0.0,"potential":0,"psl_ceiling":0.0,"closest_anchors":"","confidence":"","halos":[],"focus_areas":[],"recommendations":[{"area":"","action":"","tte":""}]}`;

function cors(origin) {
  const o = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return { 'Access-Control-Allow-Origin': o, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
    if (req.method !== 'POST') return new Response('POST only', { status: 405 });
    if (!ALLOWED.includes(origin)) return new Response(JSON.stringify({ error: 'forbidden origin' }), { status: 403, headers: cors(origin) });

    let body;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: 'bad json' }), { status: 400, headers: cors(origin) }); }

    // access gate (shared code — weak on its own, but stacks with origin-lock + rate-limit)
    if (env.GATE && body.gate !== env.GATE) return new Response(JSON.stringify({ error: 'bad access code' }), { status: 401, headers: cors(origin) });

    // per-IP rate limit (needs a KV namespace bound as RL; skipped gracefully if absent)
    if (env.RL) {
      const ip = req.headers.get('CF-Connecting-IP') || 'anon';
      const key = `rl:${ip}`;
      const n = parseInt((await env.RL.get(key)) || '0', 10);
      if (n >= RL_MAX) return new Response(JSON.stringify({ error: 'rate limit — try again later' }), { status: 429, headers: cors(origin) });
      await env.RL.put(key, String(n + 1), { expirationTtl: RL_WINDOW });
    }

    if (!body.image || !String(body.image).startsWith('data:image')) return new Response(JSON.stringify({ error: 'image (data URL) required' }), { status: 400, headers: cors(origin) });
    const sex = body.sex === 'female' ? 'female' : 'male';

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL, temperature: 0, seed: 42, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sysPrompt(sex) },
          { role: 'user', content: [
            { type: 'text', text: `Sex: ${sex} | Age: ${body.age || 'adult'}` },
            { type: 'image_url', image_url: { url: body.image } },
          ]},
        ],
      }),
    });
    const data = await r.json();
    let out;
    try { out = JSON.parse(data.choices[0].message.content); } catch { return new Response(JSON.stringify({ error: 'model error', raw: data }), { status: 502, headers: cors(origin) }); }
    // normalize psl/looks_score
    let ls = Number(out.looks_score), psl = Number(out.psl);
    if (ls > 10) ls = ls; else if (ls > 0) ls = ls * 10;          // accept 0-10 or 0-100
    if (!(psl > 0) || Math.abs(psl - ls / 10) > 1.5) psl = ls / 10;
    out.psl = Math.round(Math.min(9.9, Math.max(1, psl)) * 10) / 10;
    out.looks_score = Math.round(out.psl * 10);
    return new Response(JSON.stringify(out), { headers: { ...cors(origin), 'Content-Type': 'application/json' } });
  },
};
