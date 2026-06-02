import { SignUp } from "@clerk/react";

function SignUpPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background text-foreground">
      <div className="w-full max-w-sm px-4">
        <SignUp
          signInUrl="/login"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full border bg-card shadow-none",
            },
          }}
        />
      </div>
    </div>
  );
}

export default SignUpPage;