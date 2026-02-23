import Link from 'next/link'

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-gray-light py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl mb-6">📧</div>
          <h2 className="mt-6 text-3xl font-bold text-charcoal">
            Check your email
          </h2>
          <p className="mt-4 text-medium-gray">
            A sign in link has been sent to your email address.
          </p>
          <p className="mt-2 text-sm text-medium-gray">
            You can close this tab and click the link in your email to sign in.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="text-warm-coral hover:text-warm-coral-hover text-sm font-medium"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
