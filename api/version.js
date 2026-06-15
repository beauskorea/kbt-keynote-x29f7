// GET /api/version?sha=XXX — 특정 버전(커밋) 시점의 문서 내용 반환 (읽기 전용, 미리보기용)
const OWNER = process.env.GH_OWNER || "beauskorea";
const REPO  = process.env.GH_REPO  || "kbt-keynote-x29f7";
const FILE  = "store/doc.html";

function gh(t){ return { Authorization:"Bearer "+t, Accept:"application/vnd.github+json", "User-Agent":"kbt-editor" }; }

module.exports = async function (req, res) {
  const t = process.env.GH_TOKEN;
  if (!t) return res.status(503).json({ error: "no_token" });
  const sha = (req.query && req.query.sha) || (req.url.split("sha=")[1] || "").split("&")[0];
  if (!sha) return res.status(400).json({ error: "no_sha" });
  try {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}?ref=${encodeURIComponent(sha)}`, { headers: gh(t) });
    if (!r.ok) return res.status(502).json({ error: "gh_" + r.status });
    const d = await r.json();
    const html = Buffer.from(d.content, "base64").toString("utf8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ html: html });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
