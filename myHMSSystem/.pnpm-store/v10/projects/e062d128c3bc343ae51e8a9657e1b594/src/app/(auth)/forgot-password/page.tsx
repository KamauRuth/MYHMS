"use client"
import { ForgotPasswordForm2 } from "./components/forgot-password-form"
import { Logo } from "@/components/logo"
import { useState, FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"  
import Link from "next/link"
import Image from "next/image"
import image from "@/assets/image.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/update-password",
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert("Check your email for reset link")
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
              <Logo size={24} />
            </div>
            Lifepoint Hospital
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <ForgotPasswordForm2 />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src={image}
          alt="Image"
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover dark:brightness-75"
        />
      </div>
    </div>
  )
}


// "use client"

// import { useState } from "react"
// import { createClient } from "@/lib/supabase/client"

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// )

// export default function ForgotPasswordForm2() {
//   const [email, setEmail] = useState("")
//   const [loading, setLoading] = useState(false)

//   async function handleReset(e) {
//     e.preventDefault()
//     setLoading(true)

//     const { error } = await supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: "http://localhost:3000/update-password",
//     })

//     setLoading(false)

//     if (error) {
//       alert(error.message)
//     } else {
//       alert("Check your email for reset link")
//     }
//   }

//   return (
//     <form onSubmit={handleReset} className="space-y-4">
//       <input
//         type="email"
//         required
//         placeholder="Enter your email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="w-full border p-2 rounded"
//       />

//       <button
//         type="submit"
//         className="w-full bg-blue-600 text-white p-2 rounded"
//         disabled={loading}
//       >
//         {loading ? "Sending..." : "Reset Password"}
//       </button>
//     </form>
//   )
// }
