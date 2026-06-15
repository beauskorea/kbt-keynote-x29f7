// GET /api/doc — 현재 공유 문서(최신 버전) 본문 반환
const OWNER = process.env.GH_OWNER || "beauskorea";
const REPO  = process.env.GH_REPO  || "kbt-keynote-x29f7";
const BRANCH= process.env.GH_BRANCH|| "main";
const FILE  = "store/doc.html";

function gh(t){ return { Authorization:"Bearer "+t, Accept:"application/vnd.github+json", "User-Agent":"kbt-editor" }; }

module.exports = async function (req, res) {
  const t = process.env.GH_TOKEN;
  if (!t) return res.status(503).json({ error: "no_token" });
  try {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}?ref=${BRANCH}`, { headers: gh(t) });
    if (r.status === 404) return res.status(200).json({ html: null, sha: null });
    if (!r.ok) return res.status(502).json({ error: "gh_" + r.status });
    const d = await r.json();
    const html = Buffer.from(d.content, "base64").toString("utf8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ html: html, sha: d.sha });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
