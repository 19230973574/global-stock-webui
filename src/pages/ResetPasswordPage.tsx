import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AlertBanner } from '../components/ui/page-elements'
import { resetPassword } from '../lib/authApi'
import { Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword({ email, token, password })
      navigate('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败')
    } finally {
      setLoading(false)
    }
  }

  if (!email || !token) {
    return (
      <AuthLayout mode="forgot" title="链接无效" description="重置链接缺少必要参数">
        <AlertBanner type="error" message="请重新申请密码重置" />
        <Link to="/forgot-password" className="mt-4 block text-center text-sm text-blue-600 hover:underline">
          重新申请
        </Link>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout mode="forgot" title="设置新密码" description={`为 ${email} 设置新密码`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">新密码</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input id="password" type="password" className="input-field pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认密码</Label>
          <Input id="confirmPassword" type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
        </div>
        <Button type="submit" className="btn-primary h-11 w-full rounded-xl" disabled={loading}>
          {loading ? '提交中...' : '确认重置'}
        </Button>
        {error && <AlertBanner type="error" message={error} />}
      </form>
    </AuthLayout>
  )
}
