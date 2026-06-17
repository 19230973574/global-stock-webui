import { useMemo, useState } from 'react'
import {
  createUser,
  type UserAccount,
} from '../../lib/authApi'
import { type PermissionId } from '../../lib/permissions'
import { ROLE_OPTIONS, type UserRole } from '../../lib/roles'
import { Badge, StatusBadge } from '../ui/badge'
import { Modal } from '../ui/modal'
import { AlertBanner } from '../ui/page-elements'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { UserDetailDrawer } from './UserDetailDrawer'
import {
  ChevronRight,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react'

type FilterRole = 'all' | UserRole
type FilterStatus = 'all' | 'active' | 'pending_activation' | 'disabled'

function formatTime(ts?: number) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AccountManagement({
  users,
  currentRole,
  onRefresh,
  onGrant,
  onRevoke,
  onUpdateRole,
  onUpdateStatus,
}: {
  users: UserAccount[]
  currentRole: UserRole
  onRefresh: () => Promise<void>
  onGrant: (email: string, permission: PermissionId) => Promise<void>
  onRevoke: (email: string, permission: PermissionId) => Promise<void>
  onUpdateRole: (email: string, role: string) => Promise<void>
  onUpdateStatus?: (email: string, status: 'active' | 'disabled') => Promise<void>
}) {
  const [keyword, setKeyword] = useState('')
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const selectedUser = useMemo(
    () => users.find((u) => u.email === selectedEmail) ?? null,
    [users, selectedEmail]
  )

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (!q) return true
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [users, keyword, roleFilter, statusFilter])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    members: users.filter((u) => u.role === 'member').length,
  }), [users])

  const handleCreate = async () => {
    setBusy(true)
    setError('')
    try {
      await createUser(form)
      setCreateOpen(false)
      setForm({ name: '', email: '', password: '', role: 'member' })
      await onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setBusy(false)
    }
  }

  const creatableRoles = currentRole === 'super_admin'
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((o) => o.value === 'member')

  return (
    <div className="space-y-4">
      {/* 概览 */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip icon={Users} label="用户总数" value={stats.total} />
        <StatChip icon={UserCheck} label="已激活" value={stats.active} />
        <StatChip icon={Shield} label="普通成员" value={stats.members} />
      </div>

      {/* 工具栏 */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索姓名或邮箱"
            className="input-field h-9 pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as FilterRole)}
            className="input-field h-9 w-auto min-w-[120px] text-sm"
          >
            <option value="all">全部角色</option>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="input-field h-9 w-auto min-w-[120px] text-sm"
          >
            <option value="all">全部状态</option>
            <option value="active">已激活</option>
            <option value="pending_activation">待激活</option>
            <option value="disabled">已禁用</option>
          </select>
          <button
            type="button"
            onClick={() => { setError(''); setCreateOpen(true) }}
            className="btn-primary h-9 px-3 text-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            新建用户
          </button>
        </div>
      </div>

      {/* 用户表格 */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">角色</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">数据权限</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">最近登录</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((user) => (
              <tr
                key={user.email}
                onClick={() => setSelectedEmail(user.email)}
                className="cursor-pointer transition-colors hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                      {user.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{user.name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Badge variant="role" role={user.role as UserRole} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="text-slate-600">{user.dataPermissions.length} 项</span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-slate-500 sm:table-cell">
                  {formatTime(user.lastLoginAt)}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  <ChevronRight className="h-4 w-4" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-400">
                  {users.length === 0 ? '暂无用户，点击「新建用户」添加' : '没有匹配的搜索结果'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
          共 {filtered.length} 条记录
          {filtered.length !== users.length && `（已筛选，总计 ${users.length}）`}
        </div>
      </div>

      {/* 用户详情抽屉 */}
      <UserDetailDrawer
        user={selectedUser}
        currentRole={currentRole}
        open={!!selectedUser}
        busy={busy}
        onClose={() => setSelectedEmail(null)}
        onUpdateRole={async (email, role) => {
          setBusy(true)
          try {
            await onUpdateRole(email, role)
            await onRefresh()
          } finally {
            setBusy(false)
          }
        }}
        onUpdateStatus={onUpdateStatus ? async (email, status) => {
          setBusy(true)
          try {
            await onUpdateStatus(email, status)
          } finally {
            setBusy(false)
          }
        } : undefined}
        onTogglePermission={async (email, permissionId, enabled) => {
          setBusy(true)
          try {
            if (enabled) await onRevoke(email, permissionId)
            else await onGrant(email, permissionId)
            await onRefresh()
          } finally {
            setBusy(false)
          }
        }}
      />

      {/* 新建用户弹窗 */}
      <Modal
        open={createOpen}
        title="新建用户"
        description="创建后账号直接激活，可立即登录"
        onClose={() => setCreateOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <Label>姓名</Label>
            <Input
              className="input-field mt-1.5 h-9"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="请输入姓名"
            />
          </div>
          <div>
            <Label>邮箱</Label>
            <Input
              type="email"
              className="input-field mt-1.5 h-9"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@company.com"
            />
          </div>
          <div>
            <Label>初始密码</Label>
            <Input
              type="password"
              className="input-field mt-1.5 h-9"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="至少 8 位"
            />
          </div>
          <div>
            <Label>系统角色</Label>
            <select
              className="input-field mt-1.5 h-9 w-full"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {creatableRoles.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {error && <AlertBanner type="error" message={error} />}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary h-9 px-4 text-sm">
              取消
            </button>
            <button type="button" onClick={handleCreate} disabled={busy} className="btn-primary h-9 px-4 text-sm">
              {busy ? '创建中...' : '确认创建'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
      </div>
    </div>
  )
}
