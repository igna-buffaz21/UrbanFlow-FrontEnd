import { SignUp } from "@clerk/react"

export function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SignUp
        forceRedirectUrl="/"
        signInUrl="/login"
      />
    </div>
  )
}