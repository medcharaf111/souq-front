import { redirect } from "next/navigation";

// The previous email+password signup is replaced by a single passwordless
// OTP flow on /login (which creates the account on first verify).
export default function SignupPage() {
  redirect("/login");
}
