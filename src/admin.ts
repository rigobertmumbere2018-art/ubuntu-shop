import { Hono } from 'hono';

type AdminEnv = { Bindings: { DB: D1Database; ADMIN_BOOTSTRAP_KEY?: string } };
type AdminRole = 'super_admin' | 'admin';

const SESSION_HOURS = 8;
const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();

function randomToken(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function toBase64(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data));
}
function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}
async function sha256(value: string): Promise<string> {
  return toBase64(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
async function passwordHash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt).buffer, iterations: PBKDF2_ITERATIONS }, key, 256);
  return 'pbkdf2$' + PBKDF2_ITERATIONS + '$' + toBase64(salt) + '$' + toBase64(new Uint8Array(bits));
}
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, rounds, saltText, hashText] = stored.split('$');
    if (scheme !== 'pbkdf2' || !rounds || !saltText || !hashText) return false;
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(fromBase64(saltText)).buffer, iterations: Number(rounds) }, key, 256));
    const expected = fromBase64(hashText);
    if (bits.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < bits.length; i++) diff |= bits[i] ^ expected[i];
    return diff === 0;
  } catch { return false; }
}
function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const item = part.trim();
    if (item.startsWith(name + '=')) return decodeURIComponent(item.slice(name.length + 1));
  }
  return null;
}
function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 190;
}
function jsonError(c: any, message: string, status = 400) {
  return c.json({ ok: false, error: message }, status);
}

export function registerAdminRoutes(app: Hono<AdminEnv>) {
  app.get('/api/admin/setup-status', async (c) => {
    const row = await c.env.DB.prepare('SELECT COUNT(*) AS total FROM users').first<{ total: number }>();
    return c.json({ setupRequired: !row || row.total === 0 });
  });

  app.post('/api/admin/bootstrap', async (c) => {
    const envKey = c.env.ADMIN_BOOTSTRAP_KEY;
    if (!envKey) return jsonError(c, 'La clé de première installation ADMIN_BOOTSTRAP_KEY n’est pas configurée.', 503);
    const body = await c.req.json<{ bootstrapKey?: string; name?: string; email?: string; password?: string }>().catch(() => ({} as { bootstrapKey?: string; name?: string; email?: string; password?: string }));
    if (!body.bootstrapKey || body.bootstrapKey !== envKey) return jsonError(c, 'Clé de première installation invalide.', 403);
    const count = await c.env.DB.prepare('SELECT COUNT(*) AS total FROM users').first<{ total: number }>();
    if (count && count.total > 0) return jsonError(c, 'Le compte initial existe déjà. Utilisez la connexion.', 409);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (name.length < 2 || name.length > 100) return jsonError(c, 'Le nom doit contenir entre 2 et 100 caractères.');
    if (!validEmail(email)) return jsonError(c, 'Adresse e-mail invalide.');
    if (password.length < 12 || password.length > 128) return jsonError(c, 'Le mot de passe doit contenir au moins 12 caractères.');
    const roleId = 'role-super-admin';
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT OR IGNORE INTO roles (id,name,description) VALUES (?, 'super_admin', 'Accès complet et gestion des administrateurs')").bind(roleId),
      c.env.DB.prepare("INSERT OR IGNORE INTO roles (id,name,description) VALUES ('role-admin','admin','Gestion opérationnelle de la boutique')"),
      c.env.DB.prepare('INSERT INTO users (id,name,email,password_hash,role_id,is_active) VALUES (?,?,?,?,?,1)').bind(crypto.randomUUID(), name, email, await passwordHash(password), roleId)
    ]);
    return c.json({ ok: true, message: 'Compte super administrateur créé. Vous pouvez maintenant vous connecter.' }, 201);
  });

  app.post('/api/admin/login', async (c) => {
    const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({} as { email?: string; password?: string }));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!validEmail(email) || !password || password.length > 128) return jsonError(c, 'Adresse e-mail ou mot de passe incorrect.', 401);
    const user = await c.env.DB.prepare('SELECT u.id,u.name,u.email,u.password_hash,u.is_active,r.name AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE lower(u.email)=? LIMIT 1').bind(email).first<{id:string;name:string;email:string;password_hash:string;is_active:number;role:AdminRole}>();
    if (!user || user.is_active !== 1 || !await verifyPassword(password, user.password_hash)) return jsonError(c, 'Adresse e-mail ou mot de passe incorrect.', 401);
    const sessionToken = randomToken();
    const csrfToken = randomToken(24);
    const expires = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000).toISOString();
    await c.env.DB.prepare('INSERT INTO admin_sessions (id,user_id,token_hash,csrf_hash,expires_at) VALUES (?,?,?,?,?)')
      .bind(crypto.randomUUID(), user.id, await sha256(sessionToken), await sha256(csrfToken), expires).run();
    c.header('Set-Cookie', 'ubuntu_admin_session=' + sessionToken + '; Path=/; Max-Age=' + (SESSION_HOURS * 3600) + '; HttpOnly; Secure; SameSite=Strict');
    c.header('Set-Cookie', 'ubuntu_admin_csrf=' + csrfToken + '; Path=/; Max-Age=' + (SESSION_HOURS * 3600) + '; Secure; SameSite=Strict', { append: true });
    return c.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  const authenticate = async (c: any) => {
    const token = cookieValue(c.req.header('Cookie'), 'ubuntu_admin_session');
    if (!token) return null;
    return c.env.DB.prepare("SELECT s.id AS session_id,s.user_id,s.csrf_hash,s.expires_at,u.name,u.email,u.is_active,r.name AS role FROM admin_sessions s JOIN users u ON u.id=s.user_id JOIN roles r ON r.id=u.role_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.is_active=1 LIMIT 1")
      .bind(await sha256(token), new Date().toISOString())
      .first() as Promise<{session_id:string;user_id:string;csrf_hash:string;expires_at:string;name:string;email:string;is_active:number;role:AdminRole} | null>;
  };
  const requireCsrf = async (c: any, session: { csrf_hash: string }) => {
    const cookie = cookieValue(c.req.header('Cookie'), 'ubuntu_admin_csrf');
    const header = c.req.header('X-CSRF-Token');
    if (!cookie || !header || cookie !== header) return false;
    return await sha256(header) === session.csrf_hash;
  };

  app.get('/api/admin/me', async (c) => {
    const session = await authenticate(c);
    if (!session) return jsonError(c, 'Session expirée ou absente.', 401);
    return c.json({ ok: true, user: { id: session.user_id, name: session.name, email: session.email, role: session.role } });
  });

  app.post('/api/admin/logout', async (c) => {
    const session = await authenticate(c);
    if (session) {
      if (!await requireCsrf(c, session)) return jsonError(c, 'Vérification de sécurité échouée.', 403);
      await c.env.DB.prepare('UPDATE admin_sessions SET revoked_at=? WHERE id=?').bind(new Date().toISOString(), session.session_id).run();
    }
    c.header('Set-Cookie', 'ubuntu_admin_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict');
    c.header('Set-Cookie', 'ubuntu_admin_csrf=; Path=/; Max-Age=0; Secure; SameSite=Strict', { append: true });
    return c.json({ ok: true });
  });

  app.get('/api/admin/users', async (c) => {
    const session = await authenticate(c);
    if (!session) return jsonError(c, 'Connexion requise.', 401);
    if (session.role !== 'super_admin') return jsonError(c, 'Réservé au super administrateur.', 403);
    const result = await c.env.DB.prepare('SELECT u.id,u.name,u.email,u.is_active,u.created_at,r.name AS role FROM users u JOIN roles r ON r.id=u.role_id ORDER BY u.created_at DESC').all();
    return c.json({ ok: true, users: result.results });
  });

  app.post('/api/admin/users', async (c) => {
    const session = await authenticate(c);
    if (!session) return jsonError(c, 'Connexion requise.', 401);
    if (session.role !== 'super_admin') return jsonError(c, 'Réservé au super administrateur.', 403);
    if (!await requireCsrf(c, session)) return jsonError(c, 'Vérification de sécurité échouée.', 403);
    const body = await c.req.json<{ name?:string; email?:string; password?:string }>().catch(() => ({} as { name?: string; email?: string; password?: string }));
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (name.length < 2 || name.length > 100 || !validEmail(email) || password.length < 12 || password.length > 128) return jsonError(c, 'Vérifiez le nom, l’adresse e-mail et le mot de passe (12 caractères minimum).');
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE lower(email)=?').bind(email).first();
    if (existing) return jsonError(c, 'Cette adresse e-mail est déjà utilisée.', 409);
    await c.env.DB.prepare('INSERT INTO users (id,name,email,password_hash,role_id,is_active) VALUES (?,?,?,?,?,1)')
      .bind(crypto.randomUUID(), name, email, await passwordHash(password), 'role-admin').run();
    return c.json({ ok: true, message: 'Compte administrateur créé.' }, 201);
  });

  app.post('/api/admin/users/:id/disable', async (c) => {
    const session = await authenticate(c);
    if (!session) return jsonError(c, 'Connexion requise.', 401);
    if (session.role !== 'super_admin') return jsonError(c, 'Réservé au super administrateur.', 403);
    if (!await requireCsrf(c, session)) return jsonError(c, 'Vérification de sécurité échouée.', 403);
    if (c.req.param('id') === session.user_id) return jsonError(c, 'Vous ne pouvez pas désactiver votre propre compte.');
    await c.env.DB.prepare('UPDATE users SET is_active=0,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(c.req.param('id')).run();
    await c.env.DB.prepare('UPDATE admin_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').bind(new Date().toISOString(), c.req.param('id')).run();
    return c.json({ ok: true });
  });

  app.get('/admin', (c) => c.html(adminPage));
}

const adminPage = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#00144B"><title>Administration — UBUNTU SHOP</title><link rel="stylesheet" href="/styles/brand.css"><style>
.admin-shell{min-height:100vh;background:radial-gradient(circle at 85% 10%,#243b7b 0,transparent 35%),#00144b;padding:38px 20px 70px}.admin-wrap{max-width:980px;margin:auto}.admin-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:45px}.admin-brand{color:#fff;font-size:14px;letter-spacing:.18em}.admin-brand b{color:#f0e912}.admin-card{max-width:510px;margin:0 auto;background:#fff;color:#00144b;padding:clamp(24px,5vw,42px);box-shadow:0 24px 80px #0003}.admin-card h1{font:500 32px Georgia,serif;margin:0 0 10px}.admin-muted{color:#64708d;font-size:12px;line-height:1.8}.admin-form{display:grid;gap:13px;margin-top:25px}.admin-form label{font-size:11px;font-weight:700}.admin-form input{width:100%;height:47px;border:1px solid #cbd2e1;padding:0 13px;margin-top:7px;color:#00144b;background:white;font:inherit;font-size:13px}.admin-submit{height:48px;border:0;background:#f0e912;color:#00144b;font-weight:700;cursor:pointer;margin-top:7px}.admin-message{font-size:12px;line-height:1.7;margin-top:14px;color:#9b2438}.admin-message.ok{color:#176c42}.admin-dashboard{max-width:980px;margin:auto}.admin-panel{background:#fff;color:#00144b;padding:25px;margin-top:20px}.admin-panel h2{font:500 23px Georgia,serif}.admin-actions{display:flex;gap:10px;flex-wrap:wrap}.admin-actions button{border:1px solid #00144b;background:white;padding:10px 14px;color:#00144b;cursor:pointer}.admin-actions .danger{border-color:#9b2438;color:#9b2438}.admin-user{padding:13px 0;border-bottom:1px solid #e1e5ed;font-size:12px;display:flex;justify-content:space-between;gap:15px}.admin-user small{display:block;color:#697594;margin-top:4px}.admin-hidden{display:none!important}.admin-logo{width:42px;height:42px;object-fit:contain;filter:brightness(0) invert(1)}@media(max-width:560px){.admin-top{margin-bottom:30px}.admin-card{padding:24px 18px}.admin-card h1{font-size:27px}.admin-panel{padding:18px}.admin-user{align-items:flex-start;flex-direction:column}}
</style></head><body><main class="admin-shell"><div class="admin-wrap"><header class="admin-top"><a href="/" class="admin-brand">UBUNTU <b>SHOP</b> <span style="color:#bfc9e3">/ ADMIN</span></a><a href="/" style="font-size:11px;color:#f0e912">← Voir la boutique</a></header>
<section id="auth-view" class="admin-card"><p style="color:#9b8e00;font-size:10px;letter-spacing:.18em;font-weight:bold">ESPACE SÉCURISÉ</p><h1 id="auth-title">Connexion administrateur</h1><p id="auth-description" class="admin-muted">Accédez à votre espace de gestion UBUNTU SHOP.</p><form id="auth-form" class="admin-form"><div id="setup-name" class="admin-hidden"><label>Nom complet<input name="name" autocomplete="name"></label></div><label>Adresse e-mail<input name="email" type="email" autocomplete="username" required></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" minlength="12" required></label><div id="setup-key" class="admin-hidden"><label>Clé d’initialisation<input name="bootstrapKey" type="password" autocomplete="off"></label></div><button class="admin-submit" id="auth-submit">Se connecter</button></form><p id="auth-message" class="admin-message" role="status"></p></section>
<section id="dashboard" class="admin-dashboard admin-hidden"><div style="color:#fff"><p style="color:#f0e912;font-size:10px;letter-spacing:.18em">TABLEAU DE BORD</p><h1 style="font:500 36px Georgia,serif;margin:0 0 8px">Bienvenue, <span id="admin-name"></span></h1><p id="admin-role" class="admin-muted" style="color:#c2cbe5"></p></div><div class="admin-panel"><h2>Votre session</h2><p class="admin-muted">Vous êtes connecté à l’espace privé d’UBUNTU SHOP. Les outils de gestion métier seront ajoutés à cet espace selon les modules activés.</p><div class="admin-actions"><button id="logout">Se déconnecter</button></div></div><div id="users-panel" class="admin-panel admin-hidden"><h2>Comptes administrateurs</h2><p class="admin-muted">Le super administrateur peut créer et désactiver les comptes administrateurs.</p><form id="create-admin" class="admin-form"><label>Nom complet<input name="name" required minlength="2"></label><label>Adresse e-mail<input name="email" type="email" required></label><label>Mot de passe provisoire<input name="password" type="password" required minlength="12"></label><button class="admin-submit">Créer le compte administrateur</button></form><p id="users-message" class="admin-message" role="status"></p><div id="users-list"></div></div></section></div></main>
<script>
let csrfToken='';let setupMode=false;let currentUser=null;
const $=id=>document.getElementById(id);
const cookie=name=>document.cookie.split('; ').find(x=>x.startsWith(name+'='))?.split('=').slice(1).join('=')||'';
async function api(path,options={}){const headers={'Content-Type':'application/json',...(options.headers||{})};if(options.method&&options.method!=='GET'){csrfToken=decodeURIComponent(cookie('ubuntu_admin_csrf'));if(csrfToken)headers['X-CSRF-Token']=csrfToken}const response=await fetch(path,{credentials:'same-origin',...options,headers});const data=await response.json().catch(()=>({error:'Réponse serveur invalide'}));if(!response.ok)throw new Error(data.error||'Une erreur est survenue.');return data}
function message(text,ok=false,id='auth-message'){$(id).textContent=text;$(id).className='admin-message'+(ok?' ok':'')}
function showLogin(setup){setupMode=setup;$('auth-view').classList.remove('admin-hidden');$('dashboard').classList.add('admin-hidden');$('auth-title').textContent=setup?'Créer le super administrateur':'Connexion administrateur';$('auth-description').textContent=setup?'Première installation : créez le compte principal. La clé d’initialisation est fournie séparément.':'Accédez à votre espace de gestion UBUNTU SHOP.';$('setup-name').classList.toggle('admin-hidden',!setup);$('setup-key').classList.toggle('admin-hidden',!setup);$('auth-submit').textContent=setup?'Créer le compte super administrateur':'Se connecter';$('auth-message').textContent=''}
async function loadUsers(){const data=await api('/api/admin/users');$('users-list').innerHTML=data.users.map(u=>'<div class="admin-user"><div><strong>'+escapeHtml(u.name)+'</strong><small>'+escapeHtml(u.email)+' · '+escapeHtml(u.role)+(u.is_active?' · Actif':' · Désactivé')+'</small></div>'+(u.is_active&&u.id!==currentUser.id?'<button class="danger" data-disable="'+u.id+'">Désactiver</button>':'')+'</div>').join('')||'<p class="admin-muted">Aucun compte supplémentaire.</p>'}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function showDashboard(user){currentUser=user;$('auth-view').classList.add('admin-hidden');$('dashboard').classList.remove('admin-hidden');$('admin-name').textContent=user.name;$('admin-role').textContent=user.role==='super_admin'?'Super administrateur':'Administrateur';$('users-panel').classList.toggle('admin-hidden',user.role!=='super_admin');if(user.role==='super_admin')await loadUsers()}
$('auth-form').addEventListener('submit',async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const payload=Object.fromEntries(form.entries());try{if(setupMode){await api('/api/admin/bootstrap',{method:'POST',body:JSON.stringify(payload)});message('Compte créé. Vous pouvez maintenant vous connecter.',true);showLogin(false)}else{const data=await api('/api/admin/login',{method:'POST',body:JSON.stringify(payload)});csrfToken=decodeURIComponent(cookie('ubuntu_admin_csrf'));await showDashboard(data.user)}}catch(err){message(err.message)}});
$('logout').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST',body:'{}'})}finally{csrfToken='';showLogin(false)}});
$('create-admin').addEventListener('submit',async e=>{e.preventDefault();try{const payload=Object.fromEntries(new FormData(e.currentTarget).entries());await api('/api/admin/users',{method:'POST',body:JSON.stringify(payload)});e.currentTarget.reset();message('Compte administrateur créé.',true,'users-message');await loadUsers()}catch(err){message(err.message,false,'users-message')}});
$('users-list').addEventListener('click',async e=>{const b=e.target.closest('[data-disable]');if(!b||!confirm('Désactiver ce compte et révoquer ses sessions ?'))return;try{await api('/api/admin/users/'+b.dataset.disable+'/disable',{method:'POST',body:'{}'});await loadUsers()}catch(err){message(err.message,false,'users-message')}});
(async()=>{try{const data=await api('/api/admin/me');csrfToken=decodeURIComponent(cookie('ubuntu_admin_csrf'));await showDashboard(data.user)}catch{try{const status=await api('/api/admin/setup-status');showLogin(status.setupRequired)}catch{showLogin(false);message('Impossible de joindre le service. Réessayez plus tard.')}}})();
</script></body></html>`;
