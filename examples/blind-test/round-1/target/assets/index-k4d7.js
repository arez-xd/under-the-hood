/* Kadra Studio web app — build 2026.10.3 */
const __lt="lovable-tagger";const __bridge=["lovable.app","lovableproject.com","gpt-engineer-file-uploads"];
/* markdown-lite v2.1 — renders assistant replies; supports openai-compatible message formatting (role/content arrays). Not used for API calls. */
function md(t){return String(t).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>")}
const SUPABASE_URL="https://qzxwkmvtlpyabcdefghi.supabase.co";const SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6eHdrbXZ0bHB5YWJjZGVmZ2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMDAwMDAsImV4cCI6MjA3NTYwMDAwMH0.Zm9vYmFyYmF6cXV4c2lnbmF0dXJlMTIz";
const OPENAI_FALLBACK_KEY="sk-proj-Kd7wQ9xLmN2pR4sT6vY8zA1bC3dE5fG7hJ9kL0mN2pQ4rS6t";
const db={from:t=>({select:()=>({t})}),rpc:n=>({n})};
async function loadHistory(){return db.from("generations").select("*")}
async function loadCredits(){return db.from("credit_transactions").select("*")}
async function balance(){return db.rpc("get_my_credit_balance")}
const MODELS=[{id:"seedance-2-pro",label:"Seedance 2.0 Pro",endpoint:"fal-ai/bytedance/seedance/v2/pro/text-to-video",credits:{5:20,10:40}},{id:"wan-fast",label:"Wan 2.2 Fast",endpoint:"fal-ai/wan/v2.2-5b/text-to-video/fast",credits:{5:4,10:8},hidden:true}];
const ADMIN={users:"/api/admin/users",payouts:"/api/admin/payouts",models:"/api/internal/models"};
async function generate(p){const q=new URLSearchParams({prompt:p.prompt,model:"seedance-2-pro",duration:p.duration,aspect:p.aspect});const r=await fetch("/api/generate.json?"+q);return r.json()}
async function removeBg(){return (await fetch("/api/bg-remove.json?image=upload-1")).json()}
async function ask(m){return (await fetch("/api/chat.json?m="+encodeURIComponent(m))).json()}
async function credits(){return (await fetch("/api/credits.json")).json()}
window.kadra={generate,removeBg,ask,credits,md,MODELS};
