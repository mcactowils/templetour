import Link from 'next/link'

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Check your email
          </h2>
          <p className="mt-4 text-gray-600">
            A sign in link has been sent to your email address.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            You can close this tab and click the link in your email to sign in.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}