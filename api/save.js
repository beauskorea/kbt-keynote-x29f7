// POST /api/save  { html, message? } — 새 버전으로 저장(커밋). 누구나 호출 가능.
const OWNER = process.env.GH_OWNER || "beauskorea";
const REPO  = process.env.GH_REPO  || "kbt-keynote-x29f7";
const BRANCH= process.env.GH_BRANCH|| "main";
const FILE  = "store/doc.html";

function gh(t){ return { Authorization:"Bearer "+t, Accept:"application/vnd.github+json", "User-Agent":"kbt-editor", "Content-Type":"application/json" }; }
function readBody(req){
  return new Promise(function(resolve){
    if (req.body && typeof req.body === "object") return resolve(req.body);
    if (req.body && typeof req.body === "string"){ try{return resolve(JSON.parse(req.body));}catch(e){return resolve({});} }
    let d=""; req.on("data",function(c){d+=c;}); req.on("end",function(){ try{resolve(d?JSON.parse(d):{});}catch(e){resolve({});} });
  });
}

module.exports = async function (req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  const t = process.env.GH_TOKEN;
  if (!t) return res.status(503).json({ error: "no_token" });
  try {
    const body = await readBody(req);
    const html = body.html;
    if (typeof html !== "string" || html.length < 5) return res.status(400).json({ error: "bad_html" });
    // 현재 sha 조회(있으면 업데이트)
    let sha;
    const g = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}?ref=${BRANCH}`, { headers: gh(t) });
    if (g.ok) { const d = await g.json(); sha = d.sha; }
    const msg = (body.message || "편집 저장") + " @ " + new Date().toISOString();
    const put = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`, {
      method: "PUT", headers: gh(t),
      body: JSON.stringify({ message: msg, content: Buffer.from(html, "utf8").toString("base64"), sha: sha, branch: BRANCH })
    });
    if (!put.ok) { const e = await put.text(); return res.status(502).json({ error: "put_" + put.status, detail: e.slice(0,300) }); }
    const d = await put.json();
    return res.status(200).json({ ok: true, sha: d.content.sha, commit: d.commit.sha });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
