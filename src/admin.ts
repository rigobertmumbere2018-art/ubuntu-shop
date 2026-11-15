import { Hono } from 'hono';

type AdminEnv = { Bindings: { DB: D1Database; ADMIN_BOOTSTRAP_KEY?: string } };
type AdminRole = 'super_admin' | 'admin';

const SESSION_HOURS = 8;
const PBKDF2_ITERATIONS = 100000;
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
    try {
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
    } catch (error) {
      console.error('ADMIN_BOOTSTRAP_FAILURE', error);
      return c.json({ ok: false, error: 'Échec technique lors de la création du compte. Consultez les journaux du Worker.', diagnostic: error instanceof Error ? error.message : String(error) }, 500);
    }
  });

  app.post('/api/admin/signup-requests', async (c) => {
    const body = await c.req.json<{name?:string;email?:string;password?:string}>().catch(() => ({} as {name?:string;email?:string;password?:string}));
    const name=String(body.name||'').trim(), email=String(body.email||'').trim().toLowerCase(), password=String(body.password||'');
    if(name.length<2||name.length>100||!validEmail(email)||password.length<12||password.length>128) return jsonError(c,'Vérifiez le nom, l’adresse e-mail et le mot de passe (12 caractères minimum).');
    const existing=await c.env.DB.prepare("SELECT id FROM users WHERE lower(email)=? UNION ALL SELECT id FROM admin_signup_requests WHERE lower(email)=? AND status='pending' LIMIT 1").bind(email,email).first();
    if(existing) return jsonError(c,'Cette adresse e-mail est déjà utilisée ou fait déjà l’objet d’une demande.',409);
    await c.env.DB.prepare("INSERT INTO admin_signup_requests (id,name,email,password_hash,status) VALUES (?,?,?,?,'pending')").bind(crypto.randomUUID(),name,email,await passwordHash(password)).run();
    return c.json({ok:true,message:'Votre demande a été envoyée. Vous pourrez vous connecter après validation du super administrateur.'},201);
  });

  app.post('/api/admin/login', async (c) => {
    const body = await c.req.json<{ email?: string; password?: string }>().catch(() => ({} as { email?: string; password?: string }));
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!validEmail(email) || !password || password.length > 128) return jsonError(c, 'Adresse e-mail ou mot de passe incorrect.', 401);
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const attemptKey = await sha256(email + '|' + ip);
    const now = Date.now();
    const attempt = await c.env.DB.prepare('SELECT failure_count,window_started_at,blocked_until FROM admin_login_attempts WHERE attempt_key=?').bind(attemptKey).first() as {failure_count:number;window_started_at:string;blocked_until:string|null} | null;
    if (attempt?.blocked_until && Date.parse(attempt.blocked_until) > now) return jsonError(c, 'Trop de tentatives. Réessayez dans 15 minutes.', 429);
    const user = await c.env.DB.prepare('SELECT u.id,u.name,u.email,u.password_hash,u.is_active,r.name AS role FROM users u JOIN roles r ON r.id=u.role_id WHERE lower(u.email)=? LIMIT 1').bind(email).first<{id:string;name:string;email:string;password_hash:string;is_active:number;role:AdminRole}>();
    const passwordOk = user ? await verifyPassword(password, user.password_hash) : false;
    if (!user || user.is_active !== 1 || !passwordOk) {
      const sameWindow = attempt && now - Date.parse(attempt.window_started_at) < 15 * 60 * 1000;
      const failures = sameWindow ? attempt.failure_count + 1 : 1;
      const windowStarted = sameWindow ? attempt.window_started_at : new Date(now).toISOString();
      const blockedUntil = failures >= 8 ? new Date(now + 15 * 60 * 1000).toISOString() : null;
      await c.env.DB.prepare('INSERT INTO admin_login_attempts (attempt_key,failure_count,window_started_at,blocked_until) VALUES (?,?,?,?) ON CONFLICT(attempt_key) DO UPDATE SET failure_count=excluded.failure_count,window_started_at=excluded.window_started_at,blocked_until=excluded.blocked_until')
        .bind(attemptKey, failures, windowStarted, blockedUntil).run();
      return jsonError(c, blockedUntil ? 'Trop de tentatives. Réessayez dans 15 minutes.' : 'Adresse e-mail ou mot de passe incorrect.', blockedUntil ? 429 : 401);
    }
    await c.env.DB.prepare('DELETE FROM admin_login_attempts WHERE attempt_key=?').bind(attemptKey).run();
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

  app.get('/api/admin/signup-requests', async (c) => {
    const session=await authenticate(c);
    if(!session) return jsonError(c,'Connexion requise.',401);
    if(session.role!=='super_admin') return jsonError(c,'Réservé au super administrateur.',403);
    const result=await c.env.DB.prepare("SELECT id,name,email,created_at FROM admin_signup_requests WHERE status='pending' ORDER BY created_at ASC").all();
    return c.json({ok:true,requests:result.results});
  });

  app.post('/api/admin/signup-requests/:id/approve', async (c) => {
    const session=await authenticate(c);
    if(!session) return jsonError(c,'Connexion requise.',401);
    if(session.role!=='super_admin') return jsonError(c,'Réservé au super administrateur.',403);
    if(!await requireCsrf(c,session)) return jsonError(c,'Vérification de sécurité échouée.',403);
    const id=c.req.param('id');
    const request=await c.env.DB.prepare("SELECT id,name,email,password_hash FROM admin_signup_requests WHERE id=? AND status='pending'").bind(id).first<{id:string;name:string;email:string;password_hash:string}>();
    if(!request) return jsonError(c,'Cette demande n’est plus disponible.',404);
    const existing=await c.env.DB.prepare('SELECT id FROM users WHERE lower(email)=?').bind(request.email).first();
    if(existing) return jsonError(c,'Cette adresse e-mail appartient déjà à un compte.',409);
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO users (id,name,email,password_hash,role_id,is_active) VALUES (?,?,?,?, 'role-admin',1)").bind(crypto.randomUUID(),request.name,request.email,request.password_hash),
      c.env.DB.prepare("UPDATE admin_signup_requests SET status='approved',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,password_hash='' WHERE id=? AND status='pending'").bind(session.user_id,id)
    ]);
    return c.json({ok:true,message:'Demande approuvée. Le compte administrateur est actif.'});
  });

  app.post('/api/admin/signup-requests/:id/reject', async (c) => {
    const session=await authenticate(c);
    if(!session) return jsonError(c,'Connexion requise.',401);
    if(session.role!=='super_admin') return jsonError(c,'Réservé au super administrateur.',403);
    if(!await requireCsrf(c,session)) return jsonError(c,'Vérification de sécurité échouée.',403);
    const result=await c.env.DB.prepare("UPDATE admin_signup_requests SET status='rejected',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,password_hash='' WHERE id=? AND status='pending'").bind(session.user_id,c.req.param('id')).run();
    if(!result.meta.changes) return jsonError(c,'Cette demande n’est plus disponible.',404);
    return c.json({ok:true,message:'Demande refusée.'});
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


  // Outils opérationnels communs aux deux rôles administrateur.
  const operationalSession = async (c:any) => {
    const session=await authenticate(c);
    if(!session) return null;
    if(!await requireCsrf(c,session) && c.req.method!=='GET') return null;
    return session;
  };
  app.get('/api/admin/overview', async c => {
    try {
      const session=await authenticate(c);
      if(!session) return jsonError(c,'Connexion requise.',401);
      const count = async (sql:string, key:string) => {
        try {
          const row = await c.env.DB.prepare(sql).first<Record<string,number>>();
          return Number(row?.[key] || 0);
        } catch (error) {
          console.error('ADMIN_OVERVIEW_METRIC_FAILURE', key, error);
          return 0;
        }
      };
      const [products,orders,paymentsPending,proofsPending,customers] = await Promise.all([
        count("SELECT COUNT(*) AS total FROM products","total"),
        count("SELECT COUNT(*) AS total FROM orders","total"),
        count("SELECT COUNT(*) AS total FROM orders WHERE payment_status IN ('unpaid','partial','pending')","total"),
        count("SELECT COUNT(*) AS total FROM payment_proofs WHERE status='pending'","total"),
        count("SELECT COUNT(*) AS total FROM customers","total")
      ]);
      return c.json({ok:true,stats:{products,orders,paymentsPending,proofsPending,customers}});
    } catch (error) {
      console.error('ADMIN_OVERVIEW_FATAL', error);
      const detail = error instanceof Error ? error.message : String(error);
      return c.json({ok:false,error:'Erreur lors du chargement du tableau de bord.',diagnostic:detail},500);
    }
  });

  app.get('/api/admin/categories', async c => {
    const session=await authenticate(c);if(!session)return jsonError(c,'Connexion requise.',401);
    const r=await c.env.DB.prepare('SELECT id,name_fr,name_en FROM categories ORDER BY name_fr').all();
    return c.json({ok:true,categories:r.results});
  });
  app.post('/api/admin/products', async c => {
    const session=await operationalSession(c);if(!session)return jsonError(c,'Session ou vérification de sécurité invalide.',403);
    const b=await c.req.json<any>().catch(()=>({} as {status?:string}));
    const reference=String(b.reference||'').trim().toUpperCase();
    const categoryId=String(b.category_id||'');
    const fr=String(b.description_fr||'').trim(),en=String(b.description_en||fr).trim();
    const min=Number(b.price_min_usd),max=Number(b.price_max_usd),depositPercent=Number(b.deposit_percent||0);
    if(reference.length<2||reference.length>80||!categoryId||fr.length<5||!Number.isFinite(min)||!Number.isFinite(max)||min<0||max<min||depositPercent<0||depositPercent>100)return jsonError(c,'Vérifiez la référence, la catégorie, la description et les prix.');
    const cat=await c.env.DB.prepare('SELECT id FROM categories WHERE id=?').bind(categoryId).first();if(!cat)return jsonError(c,'Catégorie introuvable.');
    const id=crypto.randomUUID();
    try{
      await c.env.DB.prepare("INSERT INTO products (id,reference,category_id,support_fr,support_en,description_fr,description_en,price_min_usd,price_max_usd,deposit_min_usd,deposit_percent,dimensions,personalization_options,availability,stock,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .bind(id,reference,categoryId,String(b.support_fr||''),String(b.support_en||b.support_fr||''),fr,en,min,max,0,depositPercent,String(b.dimensions||''),String(b.personalization_options||''),String(b.availability||'available'),Math.max(0,Math.floor(Number(b.stock)||0)),'draft').run();
    }catch(e){return jsonError(c,'Impossible de créer le produit. Vérifiez que la référence est unique.');}
    return c.json({ok:true,id,message:'Produit créé en brouillon.'},201);
  });
  app.put('/api/admin/products/:id', async c => {
    const session=await operationalSession(c);if(!session)return jsonError(c,'Session ou vérification de sécurité invalide.',403);
    const b=await c.req.json<any>().catch(()=>({} as {status?:string}));
    const fr=String(b.description_fr||'').trim(),en=String(b.description_en||fr).trim();
    const min=Number(b.price_min_usd),max=Number(b.price_max_usd),depositPercent=Number(b.deposit_percent||0);
    if(fr.length<5||!b.category_id||!Number.isFinite(min)||!Number.isFinite(max)||min<0||max<min||depositPercent<0||depositPercent>100)return jsonError(c,'Vérifiez la catégorie, la description et les prix.');
    const result=await c.env.DB.prepare('UPDATE products SET category_id=?,support_fr=?,support_en=?,description_fr=?,description_en=?,price_min_usd=?,price_max_usd=?,deposit_min_usd=0,deposit_percent=?,dimensions=?,personalization_options=?,availability=?,stock=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
    .bind(String(b.category_id),String(b.support_fr||''),String(b.support_en||b.support_fr||''),fr,en,min,max,depositPercent,String(b.dimensions||''),String(b.personalization_options||''),String(b.availability||'available'),Math.max(0,Math.floor(Number(b.stock)||0)),c.req.param('id')).run();
    if(!result.meta.changes)return jsonError(c,'Produit introuvable.',404);
    return c.json({ok:true,message:'Produit mis à jour.'});
  });
  app.get('/api/admin/products', async c => {
    const session=await authenticate(c);if(!session)return jsonError(c,'Connexion requise.',401);
    const r=await c.env.DB.prepare("SELECT p.id,p.reference,p.description_fr,p.description_en,p.support_fr,p.support_en,p.price_min_usd,p.price_max_usd,p.deposit_percent,p.dimensions,p.personalization_options,p.availability,p.stock,p.status,p.category_id,c.name_fr category FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC").all();
    return c.json({ok:true,products:r.results});
  });
  app.get('/api/admin/orders', async c => {
    const session=await authenticate(c);if(!session)return jsonError(c,'Connexion requise.',401);
    const r=await c.env.DB.prepare("SELECT o.id,o.reference,o.total_usd,o.deposit_required_usd,o.deposit_paid_usd,o.balance_due_usd,o.payment_status,o.production_status,o.delivery_mode,o.created_at,c.name customer_name,c.phone FROM orders o JOIN customers c ON c.id=o.customer_id ORDER BY o.created_at DESC LIMIT 200").all();
    return c.json({ok:true,orders:r.results});
  });
  app.get('/api/admin/payments', async c => {
    const session=await authenticate(c);if(!session)return jsonError(c,'Connexion requise.',401);
    const r=await c.env.DB.prepare("SELECT p.id,p.order_id,p.amount_usd,p.currency,p.payment_method,p.status,p.created_at,o.reference,c.name customer_name FROM payments p JOIN orders o ON o.id=p.order_id JOIN customers c ON c.id=o.customer_id ORDER BY p.created_at DESC LIMIT 200").all();
    return c.json({ok:true,payments:r.results});
  });
  app.post('/api/admin/orders/:id/production', async c => {
    const session=await operationalSession(c);if(!session)return jsonError(c,'Session ou vérification de sécurité invalide.',403);
    const body=await c.req.json<{status?:string}>().catch(()=>({} as {status?:string}));
    if(!['pending','in_production','ready','delivered','cancelled'].includes(String(body.status)))return jsonError(c,'Statut de production invalide.');
    const order=await c.env.DB.prepare('SELECT payment_status,deposit_required_usd,deposit_paid_usd FROM orders WHERE id=?').bind(c.req.param('id')).first<any>();
    if(!order)return jsonError(c,'Commande introuvable.',404);
    if(body.status==='in_production' && Number(order.deposit_paid_usd)<Number(order.deposit_required_usd))return jsonError(c,'Production interdite : acompte requis non confirmé.');
    await c.env.DB.prepare('UPDATE orders SET production_status=? WHERE id=?').bind(body.status,c.req.param('id')).run();
    await c.env.DB.prepare("INSERT INTO order_events(id,order_id,actor_user_id,event_type,details_json) VALUES(?,?,?,'production_status',?)").bind(crypto.randomUUID(),c.req.param('id'),session.user_id,JSON.stringify({status:body.status})).run();
    return c.json({ok:true});
  });
  app.post('/api/admin/payments/:id/verify', async c => {
    const session=await operationalSession(c);if(!session)return jsonError(c,'Session ou vérification de sécurité invalide.',403);
    const body=await c.req.json<{status?:string}>().catch(()=>({} as {status?:string}));
    if(!['approved','rejected'].includes(String(body.status)))return jsonError(c,'Décision invalide.');
    const payment=await c.env.DB.prepare('SELECT id,order_id,amount_usd,status FROM payments WHERE id=?').bind(c.req.param('id')).first<any>();
    if(!payment)return jsonError(c,'Paiement introuvable.',404);
    if(payment.status==='approved')return jsonError(c,'Ce paiement est déjà validé.',409);
    await c.env.DB.prepare('UPDATE payments SET status=?,verified_by=?,verified_at=CURRENT_TIMESTAMP WHERE id=?').bind(body.status,session.user_id,payment.id).run();
    if(body.status==='approved'){
      await c.env.DB.prepare("UPDATE orders SET deposit_paid_usd=deposit_paid_usd+?,balance_due_usd=MAX(0,balance_due_usd-?),payment_status=CASE WHEN balance_due_usd-?<=0 THEN 'paid' ELSE 'partial' END WHERE id=?").bind(payment.amount_usd,payment.amount_usd,payment.amount_usd,payment.order_id).run();
      await c.env.DB.prepare("INSERT OR IGNORE INTO receipts(id,receipt_number,payment_id) VALUES(?,?,?)").bind(crypto.randomUUID(),'REC-'+Date.now(),payment.id).run();
    }
    return c.json({ok:true,message:body.status==='approved'?'Paiement validé.':'Paiement refusé.'});
  });
  app.post('/api/admin/products/:id/status', async c => {
    const session=await operationalSession(c);if(!session)return jsonError(c,'Session ou vérification de sécurité invalide.',403);
    const body=await c.req.json<{status?:string}>().catch(()=>({} as {status?:string}));
    if(!['draft','published','archived'].includes(String(body.status)))return jsonError(c,'Statut invalide.');
    const result=await c.env.DB.prepare('UPDATE products SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(body.status,c.req.param('id')).run();
    if(!result.meta.changes)return jsonError(c,'Produit introuvable.',404);
    return c.json({ok:true});
  });

  app.get('/admin', (c) => c.html(adminPage));
}

const adminPage = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#00144B"><title>Administration — UBUNTU SHOP</title><link rel="stylesheet" href="/styles/brand.css"><style>
:root{--admin-brown:#552A19;--admin-brown-dark:#35180F;--admin-yellow:#F0E912;--admin-cream:#F7F3EF;--admin-ink:#2E211C;--admin-muted:#796B64;--admin-line:#E6DCD5}
*{box-sizing:border-box}
.admin-shell{min-height:100vh;background:radial-gradient(circle at 88% 4%,#80533E 0,transparent 34%),linear-gradient(145deg,#35180F,#552A19 58%,#3B1D13);padding:38px 20px 70px;color:#fff;font-family:'Century Gothic',CenturyGothic,Arial,sans-serif}
.admin-wrap{max-width:1120px;margin:auto}.admin-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:42px}.admin-brand{color:#fff;font-size:14px;letter-spacing:.18em}.admin-brand b{color:var(--admin-yellow)}
.admin-card{max-width:540px;margin:0 auto;background:var(--admin-cream);color:var(--admin-brown);padding:clamp(24px,5vw,42px);box-shadow:0 24px 80px #160A0670;border-top:5px solid var(--admin-yellow)}
.admin-card h1{font:500 32px Georgia,serif;margin:0 0 10px;color:var(--admin-brown)}.admin-muted{color:var(--admin-muted);font-size:12px;line-height:1.8}
.admin-form{display:grid;gap:14px;margin-top:25px}.admin-form label{font-size:11px;font-weight:700;color:var(--admin-brown)}.admin-form input,.admin-form select,.admin-form textarea{width:100%;min-height:46px;border:1px solid #CDBDB2;border-radius:2px;padding:11px 13px;margin-top:7px;color:var(--admin-ink);background:#fff;font:inherit;font-size:13px}.admin-form textarea{resize:vertical;min-height:82px}.admin-form input:focus,.admin-form select:focus,.admin-form textarea:focus{outline:2px solid #A77B61;outline-offset:1px;border-color:var(--admin-brown)}
.admin-secondary{margin-top:14px;border:1px solid var(--admin-brown);background:transparent;color:var(--admin-brown);padding:11px 14px;cursor:pointer;font:inherit;font-size:12px}.admin-submit{min-height:48px;border:0;background:var(--admin-yellow);color:var(--admin-brown-dark);font-weight:700;cursor:pointer;margin-top:7px;padding:12px 18px}.admin-message{font-size:12px;line-height:1.7;margin-top:14px;color:#9B2438}.admin-message.ok{color:#176C42}
.admin-dashboard{max-width:1120px;margin:auto}.admin-panel{background:var(--admin-cream);color:var(--admin-brown);padding:25px;margin-top:18px;box-shadow:0 12px 35px #160A0625}.admin-panel h2{font:500 23px Georgia,serif;color:var(--admin-brown)}.admin-actions{display:flex;gap:10px;flex-wrap:wrap}.admin-actions button{border:1px solid var(--admin-brown);background:#fff;padding:10px 14px;color:var(--admin-brown);cursor:pointer;font:inherit;font-size:12px}.admin-actions button:hover{background:#EFE4DC}.admin-actions button[data-section]{font-weight:700}.admin-actions button[data-section]:focus-visible,.admin-actions button:focus-visible,.admin-submit:focus-visible,.admin-secondary:focus-visible{outline:2px solid #9B765E;outline-offset:2px}.admin-actions .danger{border-color:#9b2438;color:#9b2438}
.admin-user{padding:14px 0;border-bottom:1px solid var(--admin-line);font-size:12px;display:flex;justify-content:space-between;align-items:center;gap:15px}.admin-user strong{color:var(--admin-brown)}.admin-user small{display:block;color:var(--admin-muted);margin-top:5px;line-height:1.6}.admin-hidden{display:none!important}.admin-logo{width:42px;height:42px;object-fit:contain;filter:brightness(0) invert(1)}
.admin-top>a:last-child{color:var(--admin-yellow)!important}.admin-panel .admin-user .admin-actions{justify-content:flex-end}
@media(max-width:640px){.admin-shell{padding:24px 14px 48px}.admin-top{margin-bottom:28px}.admin-card{padding:24px 18px}.admin-card h1{font-size:27px}.admin-panel{padding:18px}.admin-user{align-items:flex-start;flex-direction:column}.admin-panel .admin-user .admin-actions{justify-content:flex-start}.admin-actions button{padding:10px 11px}}
</style></head><body><main class="admin-shell"><div class="admin-wrap"><header class="admin-top"><a href="/" class="admin-brand">UBUNTU <b>SHOP</b> <span style="color:#bfc9e3">/ ADMIN</span></a><a href="/" style="font-size:11px;color:#f0e912">← Voir la boutique</a></header>
<section id="auth-view" class="admin-card"><p style="color:#9b8e00;font-size:10px;letter-spacing:.18em;font-weight:bold">ESPACE SÉCURISÉ</p><h1 id="auth-title">Connexion administrateur</h1><p id="auth-description" class="admin-muted">Accédez à votre espace de gestion UBUNTU SHOP.</p><form id="auth-form" class="admin-form"><div id="setup-name" class="admin-hidden"><label>Nom complet<input name="name" autocomplete="name"></label></div><label>Adresse e-mail<input name="email" type="email" autocomplete="username" required></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" minlength="12" required></label><div id="setup-key" class="admin-hidden"><label>Clé d’initialisation<input name="bootstrapKey" type="password" autocomplete="off"></label></div><button class="admin-submit" id="auth-submit">Se connecter</button></form><p id="auth-message" class="admin-message" role="status"></p><button type="button" id="show-signup" class="admin-secondary">Créer un compte administrateur</button></section>
<section id="signup-view" class="admin-card admin-hidden"><p style="color:#9b8e00;font-size:10px;letter-spacing:.18em;font-weight:bold">DEMANDE D’ACCÈS</p><h1>Créer un compte administrateur</h1><p class="admin-muted">Votre demande sera examinée par le super administrateur. L’accès sera activé uniquement après son approbation.</p><form id="signup-form" class="admin-form"><label>Nom complet<input name="name" autocomplete="name" required minlength="2" maxlength="100"></label><label>Adresse e-mail<input name="email" type="email" autocomplete="email" required></label><label>Mot de passe<input name="password" type="password" autocomplete="new-password" minlength="12" required></label><button class="admin-submit">Envoyer ma demande</button></form><p id="signup-message" class="admin-message" role="status"></p><button type="button" id="back-login" class="admin-secondary">Retour à la connexion</button></section>
<section id="dashboard" class="admin-dashboard admin-hidden"><div style="color:#fff"><p style="color:#f0e912;font-size:10px;letter-spacing:.18em">TABLEAU DE BORD</p><h1 style="font:500 36px Georgia,serif;margin:0 0 8px">Bienvenue, <span id="admin-name"></span></h1><p id="admin-role" class="admin-muted" style="color:#c2cbe5"></p></div><div class="admin-panel"><div class="admin-actions"><button data-section="overview">Vue générale</button><button data-section="products">Produits</button><button data-section="orders">Commandes</button><button data-section="payments">Paiements</button><button id="logout">Se déconnecter</button></div></div><div id="admin-workspace" class="admin-panel"><h2>Chargement de votre espace de travail…</h2></div><div id="users-panel" class="admin-panel admin-hidden"><h2>Demandes de création de compte</h2><p class="admin-muted">Examinez les demandes reçues. Un compte ne devient actif qu’après votre approbation.</p><p id="requests-message" class="admin-message" role="status"></p><div id="requests-list"></div><h2 style="margin-top:30px">Comptes administrateurs</h2><div id="users-list"></div></div></section></div></main>
<script>
let csrfToken='';let setupMode=false;let currentUser=null;
const $=id=>document.getElementById(id);
const cookie=name=>document.cookie.split('; ').find(x=>x.startsWith(name+'='))?.split('=').slice(1).join('=')||'';
async function api(path,options={}){const headers={'Content-Type':'application/json',...(options.headers||{})};if(options.method&&options.method!=='GET'){csrfToken=decodeURIComponent(cookie('ubuntu_admin_csrf'));if(csrfToken)headers['X-CSRF-Token']=csrfToken}const response=await fetch(path,{credentials:'same-origin',...options,headers});const raw=await response.text();let data;try{data=JSON.parse(raw)}catch{throw new Error('Réponse serveur non JSON (HTTP '+response.status+'). '+raw.slice(0,180))}if(!response.ok)throw new Error((data.error||'Erreur HTTP '+response.status)+(data.diagnostic?' — '+data.diagnostic:''));return data}
function message(text,ok=false,id='auth-message'){$(id).textContent=text;$(id).className='admin-message'+(ok?' ok':'')}
function showLogin(setup){setupMode=setup;$('auth-view').classList.remove('admin-hidden');$('dashboard').classList.add('admin-hidden');$('auth-title').textContent=setup?'Créer le super administrateur':'Connexion administrateur';$('auth-description').textContent=setup?'Première installation : créez le compte principal. La clé d’initialisation est fournie séparément.':'Accédez à votre espace de gestion UBUNTU SHOP.';$('setup-name').classList.toggle('admin-hidden',!setup);$('setup-key').classList.toggle('admin-hidden',!setup);$('auth-submit').textContent=setup?'Créer le compte super administrateur':'Se connecter';$('auth-message').textContent=''}
async function loadUsers(){const data=await api('/api/admin/users');$('users-list').innerHTML=data.users.map(u=>'<div class="admin-user"><div><strong>'+escapeHtml(u.name)+'</strong><small>'+escapeHtml(u.email)+' · '+escapeHtml(u.role)+(u.is_active?' · Actif':' · Désactivé')+'</small></div>'+(u.is_active&&u.id!==currentUser.id?'<button class="danger" data-disable="'+u.id+'">Désactiver</button>':'')+'</div>').join('')||'<p class="admin-muted">Aucun compte supplémentaire.</p>'}
async function loadRequests(){const data=await api('/api/admin/signup-requests');$('requests-list').innerHTML=data.requests.map(r=>'<div class="admin-user"><div><strong>'+escapeHtml(r.name)+'</strong><small>'+escapeHtml(r.email)+' · Demande du '+new Date(r.created_at).toLocaleString('fr-FR')+'</small></div><div class="admin-actions"><button data-approve="'+r.id+'">Approuver</button><button class="danger" data-reject="'+r.id+'">Refuser</button></div></div>').join('')||'<p class="admin-muted">Aucune demande en attente.</p>'}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function showDashboard(user){currentUser=user;$('auth-view').classList.add('admin-hidden');$('dashboard').classList.remove('admin-hidden');$('admin-name').textContent=user.name;$('admin-role').textContent=user.role==='super_admin'?'Super administrateur':'Administrateur';$('users-panel').classList.toggle('admin-hidden',user.role!=='super_admin');if(user.role==='super_admin'){await loadUsers();await loadRequests()}await workspace('overview')}
$('auth-form').addEventListener('submit',async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const payload=Object.fromEntries(form.entries());try{if(setupMode){await api('/api/admin/bootstrap',{method:'POST',body:JSON.stringify(payload)});message('Compte créé. Vous pouvez maintenant vous connecter.',true);showLogin(false)}else{const data=await api('/api/admin/login',{method:'POST',body:JSON.stringify(payload)});csrfToken=decodeURIComponent(cookie('ubuntu_admin_csrf'));await showDashboard(data.user)}}catch(err){message(err.message)}});
$('show-signup').addEventListener('click',()=>{$('auth-view').classList.add('admin-hidden');$('signup-view').classList.remove('admin-hidden');$('signup-message').textContent=''});
$('back-login').addEventListener('click',()=>{$('signup-view').classList.add('admin-hidden');$('auth-view').classList.remove('admin-hidden')});
$('signup-form').addEventListener('submit',async e=>{e.preventDefault();const payload=Object.fromEntries(new FormData(e.currentTarget).entries());try{const data=await api('/api/admin/signup-requests',{method:'POST',body:JSON.stringify(payload)});e.currentTarget.reset();message(data.message,true,'signup-message')}catch(err){message(err.message,false,'signup-message')}});

async function workspace(section='overview'){
 const root=$('admin-workspace');root.innerHTML='<p class="admin-muted">Chargement…</p>';
 try{
  if(section==='overview'){const d=await api('/api/admin/overview');root.innerHTML='<h2>Activité de la boutique</h2><div class="admin-actions">'+[['Produits',d.stats.products],['Commandes',d.stats.orders],['Paiements en attente',d.stats.paymentsPending],['Preuves à vérifier',d.stats.proofsPending],['Clients',d.stats.customers]].map(x=>'<div style="background:#f1f3f8;padding:18px;min-width:130px"><small>'+x[0]+'</small><h2>'+x[1]+'</h2></div>').join('')+'</div><p class="admin-muted">Utilisez les rubriques ci-dessus pour traiter les opérations de la boutique.</p>'}
  if(section==='products'){
   const [d,cats]=await Promise.all([api('/api/admin/products'),api('/api/admin/categories')]);
   const form='<h2 id="product-form-title">Ajouter un produit</h2><form id="product-form" class="admin-form" style="max-width:760px"><input type="hidden" name="id"><label>Référence<input name="reference" required maxlength="80" placeholder="EX. INVITATION-BOIS"></label><label>Catégorie<select name="category_id" required><option value="">Choisir une catégorie</option>'+cats.categories.map(c=>'<option value="'+escapeHtml(c.id)+'">'+escapeHtml(c.name_fr)+'</option>').join('')+'</select></label><label>Description du produit (français)<textarea name="description_fr" required minlength="5" rows="3"></textarea></label><label>Description (anglais)<textarea name="description_en" rows="2"></textarea></label><label>Support / matériau<input name="support_fr"></label><label>Prix minimum (USD)<input name="price_min_usd" type="number" min="0" step=".01" required></label><label>Prix maximum (USD)<input name="price_max_usd" type="number" min="0" step=".01" required></label><label>Acompte minimum (%)<input name="deposit_percent" type="number" min="0" max="100" step="1" value="0"></label><label>Dimensions / formats<input name="dimensions"></label><label>Options de personnalisation<input name="personalization_options"></label><label>Stock<input name="stock" type="number" min="0" step="1" value="0"></label><label>Disponibilité<select name="availability"><option value="available">Disponible</option><option value="on_order">Sur commande</option><option value="unavailable">Indisponible</option></select></label><div class="admin-actions"><button class="admin-submit" type="submit">Enregistrer le produit</button><button type="button" id="product-cancel" class="admin-secondary">Annuler</button></div><p id="product-form-message" class="admin-message"></p></form>';
   root.innerHTML=form+'<h2 style="margin-top:36px">Catalogue produits ('+d.products.length+')</h2>'+d.products.map(p=>'<div class="admin-user"><div><strong>'+escapeHtml(p.reference)+'</strong><small>'+escapeHtml(p.description_fr)+' · '+escapeHtml(p.category||'Sans catégorie')+' · '+escapeHtml(p.status)+' · '+Number(p.price_min_usd).toFixed(2)+' à '+Number(p.price_max_usd).toFixed(2)+' USD</small></div><div class="admin-actions"><button data-edit-product="'+p.id+'">Modifier le produit</button>'+(p.status!=='published'?'<button data-product="'+p.id+'" data-status="published">Publier</button>':'<button data-product="'+p.id+'" data-status="draft">Dépublier</button>')+'<button class="danger" data-product="'+p.id+'" data-status="archived">Archiver</button></div></div>').join('')||'<p>Aucun produit enregistré.</p>';
   const pf=$('product-form');
   pf.addEventListener('submit',async ev=>{ev.preventDefault();const data=Object.fromEntries(new FormData(pf).entries());const id=data.id;delete data.id;for(const k of ['price_min_usd','price_max_usd','deposit_percent','stock'])data[k]=Number(data[k]||0);try{const res=await api(id?'/api/admin/products/'+id:'/api/admin/products',{method:id?'PUT':'POST',body:JSON.stringify(data)});message(res.message,true,'product-form-message');await workspace('products')}catch(err){message(err.message,false,'product-form-message')}});
   $('product-cancel').addEventListener('click',()=>{pf.reset();pf.elements.id.value='';pf.elements.reference.readOnly=false;$('product-form-title').textContent='Ajouter un produit'});
   root.querySelectorAll('[data-edit-product]').forEach(btn=>btn.addEventListener('click',async()=>{try{const p=(await api('/api/admin/products')).products.find(x=>x.id===btn.dataset.editProduct);if(!p)return;const cat=(await api('/api/admin/categories')).categories.find(x=>x.name_fr===p.category);pf.elements.id.value=p.id;pf.elements.reference.value=p.reference;pf.elements.reference.readOnly=true;pf.elements.category_id.value=cat?.id||'';pf.elements.description_fr.value=p.description_fr||'';pf.elements.description_en.value=p.description_en||'';pf.elements.support_fr.value=p.support_fr||'';pf.elements.price_min_usd.value=p.price_min_usd;pf.elements.price_max_usd.value=p.price_max_usd;pf.elements.deposit_percent.value=p.deposit_percent||0;pf.elements.dimensions.value=p.dimensions||'';pf.elements.personalization_options.value=p.personalization_options||'';pf.elements.stock.value=p.stock||0;pf.elements.availability.value=p.availability||'available';$('product-form-title').textContent='Modifier le produit '+p.reference;pf.scrollIntoView({behavior:'smooth',block:'start'})}catch(err){message(err.message,false,'product-form-message')}}));
  }
  if(section==='orders'){const d=await api('/api/admin/orders');root.innerHTML='<h2>Suivi des commandes</h2>'+d.orders.map(o=>'<div class="admin-user"><div><strong>'+escapeHtml(o.reference)+' — '+escapeHtml(o.customer_name)+'</strong><small>'+escapeHtml(o.phone)+' · Total '+Number(o.total_usd).toFixed(2)+' USD · Acompte '+Number(o.deposit_paid_usd).toFixed(2)+' / '+Number(o.deposit_required_usd).toFixed(2)+' USD · Solde '+Number(o.balance_due_usd).toFixed(2)+' USD · Paiement : '+escapeHtml(o.payment_status)+'</small><small>Production : '+escapeHtml(o.production_status)+' · '+escapeHtml(o.delivery_mode)+'</small></div><select data-production="'+o.id+'"><option value="pending">En attente</option><option value="in_production">En production</option><option value="ready">Prête</option><option value="delivered">Livrée</option><option value="cancelled">Annulée</option></select></div>').join('')||'<p>Aucune commande enregistrée.</p>'}
  if(section==='payments'){const d=await api('/api/admin/payments');root.innerHTML='<h2>Vérification des paiements</h2><p class="admin-muted">Validez uniquement les paiements dont la réception a été vérifiée. La validation met à jour le solde et génère un reçu.</p>'+d.payments.map(p=>'<div class="admin-user"><div><strong>'+escapeHtml(p.reference)+' — '+escapeHtml(p.customer_name)+'</strong><small>'+Number(p.amount_usd).toFixed(2)+' USD · '+escapeHtml(p.currency)+' · '+escapeHtml(p.payment_method)+' · '+escapeHtml(p.status)+'</small></div>'+(p.status==='pending'?'<div class="admin-actions"><button data-payment="'+p.id+'" data-decision="approved">Confirmer reçu</button><button class="danger" data-payment="'+p.id+'" data-decision="rejected">Refuser</button></div>':'')+'</div>').join('')||'<p>Aucun paiement enregistré.</p>'}
 }catch(e){root.innerHTML='<p class="admin-message">'+escapeHtml(e.message)+'</p>'}
}
document.querySelectorAll('[data-section]').forEach(b=>b.addEventListener('click',()=>workspace(b.dataset.section)));
$('admin-workspace').addEventListener('click',async e=>{const p=e.target.closest('[data-product]'),pay=e.target.closest('[data-payment]');try{if(p){await api('/api/admin/products/'+p.dataset.product+'/status',{method:'POST',body:JSON.stringify({status:p.dataset.status})});await workspace('products')}if(pay){if(!confirm(pay.dataset.decision==='approved'?'Confirmer que le paiement est réellement reçu ?':'Refuser ce paiement ?'))return;await api('/api/admin/payments/'+pay.dataset.payment+'/verify',{method:'POST',body:JSON.stringify({status:pay.dataset.decision})});await workspace('payments')}}catch(err){message(err.message,false,'requests-message')}});
$('admin-workspace').addEventListener('change',async e=>{const s=e.target.closest('[data-production]');if(!s)return;try{await api('/api/admin/orders/'+s.dataset.production+'/production',{method:'POST',body:JSON.stringify({status:s.value})});await workspace('orders')}catch(err){message(err.message,false,'requests-message');await workspace('orders')}});

$('logout').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST',body:'{}'})}finally{csrfToken='';showLogin(false)}});
$('requests-list').addEventListener('click',async e=>{const approve=e.target.closest('[data-approve]'),reject=e.target.closest('[data-reject]');const b=approve||reject;if(!b)return;const action=approve?'approve':'reject';if(!confirm(approve?'Approuver cette demande et activer le compte ?':'Refuser cette demande ?'))return;try{await api('/api/admin/signup-requests/'+encodeURIComponent(b.dataset[action])+'/'+action,{method:'POST',body:'{}'});message(approve?'Demande approuvée. Le compte est actif.':'Demande refusée.',true,'requests-message');await loadRequests();await loadUsers()}catch(err){message(err.message,false,'requests-message')}});
$('users-list').addEventListener('click',async e=>{const b=e.target.closest('[data-disable]');if(!b||!confirm('Désactiver ce compte et révoquer ses sessions ?'))return;try{await api('/api/admin/users/'+b.dataset.disable+'/disable',{method:'POST',body:'{}'});await loadUsers()}catch(err){message(err.message,false,'requests-message')}});
(async()=>{try{const data=await api('/api/admin/me');csrfToken=decodeURIComponent(cookie('ubuntu_admin_csrf'));await showDashboard(data.user)}catch{try{const status=await api('/api/admin/setup-status');showLogin(status.setupRequired)}catch{showLogin(false);message('Impossible de joindre le service. Réessayez plus tard.')}}})();
</script></body></html>`;
