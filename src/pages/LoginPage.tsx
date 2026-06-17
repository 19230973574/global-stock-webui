import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AlertBanner } from '../components/ui/page-elements'
import { loginWithEmail } from '../lib/authApi'
import { saveSession } from '../lib/session'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const session = await loginWithEmail({ email, password })
      saveSession(session)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      mode="login"
      title="欢迎回来"
      description="登录 Global Stock 后台，管理数据权限与 API Token"
      footer={
        <>
          还没有账号？
          <Link to="/register" className="ml-1 font-medium text-blue-600 hover:underline">
            立即注册
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="input-field pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">密码</Label>
            <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:underline">
              忘记密码？
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="input-field pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="btn-primary h-11 w-full rounded-xl" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </Button>
        {error && <AlertBanner type="error" message={error} />}
      </form>
    </AuthLayout>
  )
}
