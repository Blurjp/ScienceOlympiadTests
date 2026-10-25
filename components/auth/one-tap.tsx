"use client"

// Google One Tap (Google Identity Services).
//
// Renders nothing on screen. For signed-out visitors it shows Google's
// official One Tap prompt; returning users who previously approved it are
// signed in silently (auto-select) - no "Sign in with Google" click needed.
//
// The GSI script is loaded even while signed in so that the sign-out flows
// can call disableAutoSelect() (a Google policy requirement: after an
// explicit sign-out, users must interact once before auto-select resumes).

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"

interface CredentialResponse {
  credential: string
  select_by?: string
}

interface GoogleIdApi {
  initialize: (config: {
    client_id: string
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    callback: (response: CredentialResponse) => void
  }) => void
  prompt: (listener?: (notification: unknown) => void) => void
  disableAutoSelect: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: { id: GoogleIdApi }
    }
  }
}

export function disableGoogleAutoSelect() {
  try {
    window.google?.accounts.id.disableAutoSelect()
  } catch {
    // GSI not loaded - nothing to disable
  }
}

export function OneTap({ clientId }: { clientId?: string }) {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!clientId) return

    let cancelled = false
    let api: GoogleIdApi | undefined

    const start = () => {
      if (cancelled) return
      api = window.google?.accounts.id
      if (!api) return

      api.initialize({
        client_id: clientId,
        auto_select: true,
        cancel_on_tap_outside: false,
        callback: async (response) => {
          try {
            await signIn("google-one-tap", {
              credential: response.credential,
              redirect: false,
            })
            // Refresh server components (header etc.) to reflect the session
            router.refresh()
          } catch (error) {
            console.error("One Tap sign-in failed:", error)
          }
        },
      })

      // Only show the prompt for signed-out visitors.
      if (status === "unauthenticated") api.prompt()
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )
    if (existing) {
      // Script tag present (e.g. effect re-ran after status change)
      start()
    } else {
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = start
      document.head.appendChild(script)
    }

    return () => {
      cancelled = true
    }
  }, [clientId, status, router])

  return null
}
