const allowedTypes = { "image/jpeg":"jpg", "image/png":"png", "image/webp":"webp", "image/gif":"gif" };
const json = (data, status, origin) => new Response(JSON.stringify(data), { status, headers:{
  "content-type":"application/json; charset=utf-8", "access-control-allow-origin":origin,
  "access-control-allow-methods":"POST, OPTIONS", "access-control-allow-headers":"content-type", "vary":"Origin"
}});
const slug = s => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,50) || "memory";
function b64(bytes) { let s=""; for(let i=0;i<bytes.length;i+=0x8000) s+=String.fromCharCode(...bytes.subarray(i,i+0x8000)); return btoa(s); }
async function github(env,path,body) {
  const r=await fetch(`https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,{
    method:"PUT", headers:{ authorization:`Bearer ${env.GITHUB_TOKEN}`, accept:"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28", "content-type":"application/json", "user-agent":"forever-timeline" },
    body:JSON.stringify(body)
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.message || `GitHub API returned ${r.status}`);
  return data;
}
async function verifyCaptcha(token,ip,env) {
  if(!env.TURNSTILE_SECRET) throw new Error("Upload verification is not configured.");
  const form=new FormData(); form.append("secret",env.TURNSTILE_SECRET); form.append("response",token || ""); form.append("remoteip",ip || "");
  const r=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:form});
  const result=await r.json(); if(!result.success) throw new Error("Please complete the anti-spam check.");
}
export default { async fetch(request,env) {
  const origin=request.headers.get("Origin") || "", allowed=env.ALLOWED_ORIGIN || "https://wrisov.github.io";
  if(request.method==="OPTIONS") return new Response(null,{status:204,headers:{
    "access-control-allow-origin":allowed,"access-control-allow-methods":"POST, OPTIONS",
    "access-control-allow-headers":"content-type","access-control-max-age":"86400","vary":"Origin"
  }});
  if(origin!==allowed) return json({error:"Origin not allowed."},403,allowed);
  if(request.method!=="POST" || new URL(request.url).pathname!=="/submit") return json({error:"Not found."},404,allowed);
  try {
    if(!env.GITHUB_TOKEN) throw new Error("GitHub credentials are not configured.");
    const ip=request.headers.get("CF-Connecting-IP") || "unknown";
    const key="submit:"+ip, count=Number(await env.RATE_LIMIT.get(key) || "0");
    if(count>=5) return json({error:"Hourly submission limit reached. Please try again later."},429,allowed);
    await env.RATE_LIMIT.put(key,String(count+1),{expirationTtl:3600});
    const form=await request.formData(); await verifyCaptcha(form.get("turnstileToken"),ip,env);
    const date=String(form.get("date") || ""), title=String(form.get("title") || "").trim();
    const tagline=String(form.get("tagline") || "").trim().slice(0,140);
    const description=String(form.get("description") || "").trim().slice(0,1200), image=form.get("image");
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !title || title.length>100) throw new Error("Please provide a valid date and title.");
    if(!(image instanceof File) || !allowedTypes[image.type]) throw new Error("Choose a JPG, PNG, WebP or GIF image.");
    const max=Number(env.MAX_UPLOAD_BYTES || 5242880);
    if(image.size<1 || image.size>max) throw new Error("Images must be smaller than 5 MB.");
    const bytes=new Uint8Array(await image.arrayBuffer()), sig=[...bytes.slice(0,12)];
    const valid=image.type==="image/jpeg" ? sig[0]===255 && sig[1]===216 :
      image.type==="image/png" ? sig.slice(0,8).join(",")==="137,80,78,71,13,10,26,10" :
      image.type==="image/gif" ? String.fromCharCode(...sig.slice(0,3))==="GIF" :
      image.type==="image/webp" ? String.fromCharCode(...sig.slice(0,4))==="RIFF" && String.fromCharCode(...sig.slice(8,12))==="WEBP" : false;
    if(!valid) throw new Error("The uploaded file is not a valid image.");
    const id=`${date}-${slug(title)}-${crypto.randomUUID().slice(0,8)}`, ext=allowedTypes[image.type];
    const imagePath=`images/pending/${date.slice(0,4)}/${date.slice(5,7)}/${id}.${ext}`;
    const submissionPath=`submissions/${id}.json`;
    const imageResult=await github(env,imagePath,{message:`Queue submitted photo: ${title}`,content:b64(bytes),branch:env.GITHUB_BRANCH || "main"});
    const submission={id,date,title,tagline,description,imagePath,submittedAt:new Date().toISOString(),status:"pending_review"};
    await github(env,submissionPath,{message:`Queue timeline submission: ${title}`,content:b64(new TextEncoder().encode(JSON.stringify(submission,null,2))),branch:env.GITHUB_BRANCH || "main"});
    return json({ok:true,id,status:"pending_review"},201,allowed);
  } catch(e) { return json({error:e.message || "Submission failed."},400,allowed); }
}};