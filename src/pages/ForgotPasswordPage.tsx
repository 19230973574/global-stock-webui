import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { AuthLayout } from '../components/layout/AuthLayout'
import { AlertBanner } from '../components/ui/page-elements'
import { requestPasswordReset } from '../lib/authApi'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await requestPasswordReset({ email })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      mode="forgot"
      title={sent ? '检查您的邮箱' : '重置密码'}
      description={sent ? '我们已向您发送密码重置链接' : '输入注册邮箱，获取 15 分钟内有效的重置链接'}
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          返回登录
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-slate-500">重置链接已发送至</p>
          <p className="font-semibold text-slate-900">{email}</p>
          <p className="text-xs text-slate-400">如未收到，请检查垃圾邮件文件夹</p>
          <Button variant="outline" className="w-full rounded-xl" onClick={() => setSent(false)}>
            重新发送
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input id="email" type="email" className="input-field pl-10" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>
          <Button type="submit" className="btn-primary h-11 w-full rounded-xl" disabled={loading}>
            {loading ? '发送中...' : '发送重置链接'}
          </Button>
          {error && <AlertBanner type="error" message={error} />}
        </form>
      )}
    </AuthLayout>
  )
}
