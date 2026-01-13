import { getRecaptchaSiteKeyAsync } from '@/lib/recaptcha';
import RegisterForm from './RegisterForm';
import Analytics from '@/components/public/Analytics';
import Link from 'next/link';

export const metadata = {
  title: 'Register | Western Nebraska Sports Council',
  description: 'Create an account with the Western Nebraska Sports Council.',
};

export default async function RegisterPage() {
  const recaptchaSiteKey = await getRecaptchaSiteKeyAsync();

  return (
    <>
      <Analytics pageName="Register" />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Link href="/" className="text-3xl font-bold text-primary hover:text-primary-700">
              WNSC
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Create an Account</h1>
            <p className="mt-2 text-gray-600">
              Register to access the WNSC admin portal
            </p>
          </div>

          <RegisterForm recaptchaSiteKey={recaptchaSiteKey} />

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 block">
              ← Back to website
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
