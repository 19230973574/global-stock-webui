import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AlertBanner } from '../components/ui/page-elements'
import { registerAccount } from '../lib/authApi'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      await registerAccount({ name: formData.name, email: formData.email, password: formData.password })
      setSuccess('注册成功，请前往邮箱点击激活链接后登录。')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      mode="register"
      title="创建账号"
      description="注册后将收到激活邮件，默认角色为普通成员"
      footer={
        <>
          已有账号？
          <Link to="/login" className="ml-1 font-medium text-blue-600 hover:underline">
            立即登录
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input id="name" className="input-field pl-10" placeholder="您的姓名" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input id="email" type="email" className="input-field pl-10" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input id="password" type={showPassword ? 'text' : 'password'} className="input-field pl-10 pr-10" placeholder="至少 8 位" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认密码</Label>
          <Input id="confirmPassword" type="password" className="input-field" placeholder="再次输入密码" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
        </div>
        <Button type="submit" className="btn-primary h-11 w-full rounded-xl" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </Button>
        {error && <AlertBanner type="error" message={error} />}
        {success && <AlertBanner type="success" message={success} />}
      </form>
    </AuthLayout>
  )
}
