import { Link } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <AlertCircle size={56} className="text-slate-600 mx-auto" />
        <h1 className="text-6xl font-bold text-slate-700">404</h1>
        <p className="text-xl font-semibold text-slate-300">Page Not Found</p>
        <p className="text-slate-500 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-primary inline-flex mt-4">
          <Home size={16} /> Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
