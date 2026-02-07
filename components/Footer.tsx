import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">DockDrop</h3>
            <p className="mt-2 text-sm text-gray-500">Yacht Supply Delivery Marketplace</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Links</h3>
            <div className="mt-2 space-y-1">
              <Link href="/marketplace" className="block text-sm text-gray-500 hover:text-gray-900">Marketplace</Link>
              <Link href="/register" className="block text-sm text-gray-500 hover:text-gray-900">Sign Up</Link>
              <Link href="/login" className="block text-sm text-gray-500 hover:text-gray-900">Login</Link>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Legal</h3>
            <div className="mt-2 space-y-1">
              <Link href="/terms" className="block text-sm text-gray-500 hover:text-gray-900">Terms of Service</Link>
              <Link href="/privacy" className="block text-sm text-gray-500 hover:text-gray-900">Privacy Policy</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-400">DockDrop &copy; {new Date().getFullYear()}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
