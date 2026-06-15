// GET /api/history — 저장 버전 목록(최신순)
const OWNER = process.env.GH_OWNER || "beauskorea";
const REPO  = process.env.GH_REPO  || "kbt-keynote-x29f7";
const BRANCH= process.env.GH_BRANCH|| "main";
const FILE  = "store/doc.html";

function gh(t){ return { Authorization:"Bearer "+t, Accept:"application/vnd.github+json", "User-Agent":"kbt-editor" }; }

module.exports = async function (req, res) {
  const t = process.env.GH_TOKEN;
  if (!t) return res.status(503).json({ error: "no_token" });
  try {
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/commits?path=${FILE}&sha=${BRANCH}&per_page=40`, { headers: gh(t) });
    if (!r.ok) return res.status(502).json({ error: "gh_" + r.status });
    const arr = await r.json();
    const versions = (Array.isArray(arr) ? arr : []).map(function (c) {
      return { sha: c.sha, date: (c.commit && c.commit.author && c.commit.author.date) || "", message: (c.commit && c.commit.message) || "" };
    });
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ versions: versions });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
