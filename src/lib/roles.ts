export type UserRole = 'super_admin' | 'admin' | 'member'

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: '超级系统管理员',
  admin: '管理员',
  member: '普通成员',
}

export const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'super_admin', label: ROLE_LABELS.super_admin },
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'member', label: ROLE_LABELS.member },
]

const ROLE_RANK: Record<UserRole, number> = {
  super_admin: 0,
  admin: 1,
  member: 2,
}

export function hasRoleAtLeast(role: UserRole | string | undefined, required: UserRole): boolean {
  if (!role) return false
  const current = ROLE_RANK[role as UserRole]
  const need = ROLE_RANK[required]
  if (current === undefined) return false
  return current <= need
}

export function canAccessMenu(role: UserRole | string | undefined, menuId: string): boolean {
  switch (menuId) {
    case 'dashboard':
      return hasRoleAtLeast(role, 'admin')
    case 'accounts':
      return hasRoleAtLeast(role, 'admin')
    case 'orders':
      return hasRoleAtLeast(role, 'admin')
    case 'quant-data':
    case 'data-mgmt':
      return hasRoleAtLeast(role, 'admin')
    case 'settings':
      return hasRoleAtLeast(role, 'super_admin')
    case 'marketplace':
    case 'tokens':
    case 'profile':
    case 'quant':
      return true
    default:
      if (menuId.startsWith('data-mgmt/')) {
        return hasRoleAtLeast(role, 'admin')
      }
      return false
  }
}
