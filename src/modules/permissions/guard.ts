export interface AuthContext {
  userId: string;
  fullName: string;
  email: string;
  roleSlug: string;
  csrfToken: string;
  permissions: Set<string>;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function requireAuth(auth: AuthContext | null): AuthContext {
  if (!auth) throw new HttpError(401, 'Authentification administrateur requise.');
  return auth;
}

export function requirePermission(auth: AuthContext | null, permissionCode: string): AuthContext {
  const user = requireAuth(auth);
  if (user.roleSlug === 'super_admin') return user;
  if (!user.permissions.has(permissionCode)) {
    throw new HttpError(403, `Permission refusée : ${permissionCode}`);
  }
  return user;
}

export function assertSuperAdminPrivilegeMutation(actor: AuthContext, targetUserId: string): void {
  if (actor.roleSlug !== 'super_admin') {
    throw new HttpError(403, 'Seul le Super administrateur peut gérer les comptes et privilèges.');
  }
  if (actor.userId === targetUserId) {
    throw new HttpError(400, 'Un administrateur ne peut jamais modifier ses propres privilèges.');
  }
}
