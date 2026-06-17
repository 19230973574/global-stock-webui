import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { UserAccount } from '../../lib/authApi'
import { fetchProducts, type DataProduct } from '../../lib/catalogApi'
import { type PermissionId } from '../../lib/permissions'
import { ROLE_LABELS, ROLE_OPTIONS, type UserRole } from '../../lib/roles'
import { Badge, StatusBadge } from '../ui/badge'

function formatTime(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-CN')
}

export function UserDetailDrawer({
  user,
  currentRole,
  open,
  busy,
  onClose,
  onUpdateRole,
  onTogglePermission,
  onUpdateStatus,
}: {
  user: UserAccount | null
  currentRole: UserRole
  open: boolean
  busy: boolean
  onClose: () => void
  onUpdateRole: (email: string, role: string) => Promise<void>
  onTogglePermission: (email: string, permissionId: PermissionId, enabled: boolean) => Promise<void>
  onUpdateStatus?: (email: string, status: 'active' | 'disabled') => Promise<void>
}) {
  const [products, setProducts] = useState<DataProduct[]>([])

  useEffect(() => {
    if (!open) return
    fetchProducts().then(setProducts).catch(() => setProducts([]))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !user) return null

  const permissionsByGroup = products.reduce<Record<string, DataProduct[]>>((acc, p) => {
    if (!acc[p.group]) acc[p.group] = []
    acc[p.group].push(p)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        {/* 头部 */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-slate-900">{user.name}</h2>
              <p className="truncate text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* 基本信息 */}
          <section className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">基本信息</h3>
            <dl className="space-y-2.5 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-sm">
              <Row label="账号状态" value={<StatusBadge status={user.status} />} />
              <Row label="系统角色" value={<Badge variant="role" role={user.role as UserRole} />} />
              <Row label="注册时间" value={formatTime(user.createdAt)} />
              <Row label="最近登录" value={formatTime(user.lastLoginAt)} />
            </dl>
          </section>

          {/* 角色设置 */}
          {currentRole === 'super_admin' && (
            <section className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">角色设置</h3>
              <select
                className="input-field h-9 w-full text-sm"
                value={user.role}
                disabled={busy}
                onChange={(e) => onUpdateRole(user.email, e.target.value)}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-400">仅超级系统管理员可修改角色</p>
            </section>
          )}

          {currentRole === 'super_admin' && onUpdateStatus && user.status !== 'pending_activation' && (
            <section className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">账号控制</h3>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {user.status === 'disabled' ? '账号已禁用' : '账号已启用'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {user.status === 'disabled' ? '禁用后无法登录，所有 Token 将被吊销' : '禁用后将立即吊销该用户全部 Token'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={user.status === 'active'}
                  disabled={busy}
                  onClick={() => onUpdateStatus(user.email, user.status === 'active' ? 'disabled' : 'active')}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    user.status === 'active' ? 'bg-blue-600' : 'bg-slate-200'
                  } ${busy ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      user.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </section>
          )}

          {/* 数据权限 */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              数据权限
              <span className="ml-2 font-normal normal-case text-slate-400">
                已开通 {user.dataPermissions.length} / {products.length}
              </span>
            </h3>
            <div className="space-y-4">
              {Object.entries(permissionsByGroup).map(([group, items]) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-medium text-slate-500">{group}</p>
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {items.map((perm) => {
                      const enabled = user.dataPermissions.includes(perm.id)
                      return (
                        <li
                          key={perm.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">{perm.name}</p>
                            <p className="truncate text-xs text-slate-400">{perm.description}</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={enabled}
                            disabled={busy}
                            onClick={() => onTogglePermission(user.email, perm.id as PermissionId, enabled)}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                              enabled ? 'bg-blue-600' : 'bg-slate-200'
                            } ${busy ? 'opacity-50' : ''}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 底部 */}
        <div className="shrink-0 border-t border-slate-100 px-5 py-3">
          <p className="text-center text-xs text-slate-400">
            {ROLE_LABELS[user.role as UserRole]} · {user.email}
          </p>
        </div>
      </aside>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate text-right text-slate-800">{value}</dd>
    </div>
  )
}
