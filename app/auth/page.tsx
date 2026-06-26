import { LoginForm } from "@/components/auth/LoginForm";

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-800 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">OR Schedule Manager</h1>
          <p className="mt-1 text-sm text-slate-500">Chief sign-in</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
