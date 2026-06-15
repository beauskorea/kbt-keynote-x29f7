// POST /api/revert  { sha } — 지정 버전 내용을 읽어 '새 버전'으로 되돌림(기존 내용도 기록에 남아 안전)
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
    const fromSha = body.sha;
    if (!fromSha) return res.status(400).json({ error: "no_sha" });
    // 1) 지정 버전 내용 읽기
    const g = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}?ref=${fromSha}`, { headers: gh(t) });
    if (!g.ok) return res.status(502).json({ error: "read_" + g.status });
    const gd = await g.json();
    const html = Buffer.from(gd.content, "base64").toString("utf8");
    // 2) 현재 sha
    let curSha;
    const c = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}?ref=${BRANCH}`, { headers: gh(t) });
    if (c.ok) { const cd = await c.json(); curSha = cd.sha; }
    // 3) 새 버전으로 커밋
    const msg = "되돌리기 → " + String(fromSha).slice(0,7) + " @ " + new Date().toISOString();
    const put = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`, {
      method: "PUT", headers: gh(t),
      body: JSON.stringify({ message: msg, content: Buffer.from(html, "utf8").toString("base64"), sha: curSha, branch: BRANCH })
    });
    if (!put.ok) { const e = await put.text(); return res.status(502).json({ error: "put_" + put.status, detail: e.slice(0,300) }); }
    return res.status(200).json({ ok: true, html: html });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
};
