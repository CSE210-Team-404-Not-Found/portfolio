import { useEffect, useState, type FormEvent } from 'react'
import { Client, XrpcResponseError } from '@atproto/lex'
import profileLexicon from '../lexicons/com/at-folio/temp/profile.js'

type ProfileFormValues = {
  fullName: string
  jobTitle: string
  description: string
}

const EMPTY_PROFILE: ProfileFormValues = {
  fullName: '',
  jobTitle: '',
  description: '',
}

/** Loads and edits the signed-in account's `com.at-folio.temp.profile` record. */
export function ProfileEditor({ did }: { did: string }) {
  const [values, setValues] = useState<ProfileFormValues>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [error, setError] = useState<string>()
  const [notice, setNotice] = useState<string>()

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError(undefined)
      setNotice(undefined)

      try {
        const { restoreOAuthSession } = await import('../auth/oauth-client.ts')
        const session = await restoreOAuthSession(did)
        const client = new Client(session)
        const result = await client.get(profileLexicon)

        if (active) {
          setValues({
            fullName: result.value.fullName,
            jobTitle: result.value.jobTitle ?? '',
            description: result.value.description ?? '',
          })
        }
      } catch (cause) {
        if (!active) return

        if (isRecordNotFound(cause)) {
          setValues(EMPTY_PROFILE)
        } else {
          setError('Could not load your profile. Check your connection and try again.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadProfile()
    return () => {
      active = false
    }
  }, [did, loadAttempt])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(undefined)
    setNotice(undefined)

    try {
      const { restoreOAuthSession } = await import('../auth/oauth-client.ts')
      const session = await restoreOAuthSession(did)
      const client = new Client(session)
      await client.put(
        profileLexicon,
        {
          fullName: values.fullName.trim(),
          ...(values.jobTitle.trim() ? { jobTitle: values.jobTitle.trim() } : {}),
          ...(values.description.trim() ? { description: values.description.trim() } : {}),
        },
        { validateRequest: true },
      )
      setNotice('Profile saved.')
    } catch (cause) {
      if (cause instanceof XrpcResponseError && [401, 403].includes(cause.status)) {
        setError('This session cannot write profile records. Sign out and sign in again to grant profile access.')
      } else {
        setError('Could not save your profile. Check your connection and try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="profile-editor" aria-labelledby="profile-editor-title">
      <h2 id="profile-editor-title">Your profile</h2>
      <p className="profile-editor-hint">This profile is saved to your AT Protocol account.</p>

      {loading ? (
        <p role="status">Loading profile…</p>
      ) : error && !values.fullName ? (
        <div>
          <p className="auth-error" role="alert">{error}</p>
          <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Try again
          </button>
        </div>
      ) : (
        <form className="profile-form" onSubmit={(event) => void saveProfile(event)}>
          <label htmlFor="profile-full-name">Full name</label>
          <input
            id="profile-full-name"
            name="fullName"
            autoComplete="name"
            maxLength={64}
            required
            disabled={saving}
            value={values.fullName}
            onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
          />

          <label htmlFor="profile-job-title">Job title</label>
          <input
            id="profile-job-title"
            name="jobTitle"
            autoComplete="organization-title"
            maxLength={128}
            disabled={saving}
            value={values.jobTitle}
            onChange={(event) => setValues((current) => ({ ...current, jobTitle: event.target.value }))}
          />

          <label htmlFor="profile-description">Description</label>
          <textarea
            id="profile-description"
            name="description"
            rows={5}
            maxLength={5000}
            disabled={saving}
            value={values.description}
            onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          />

          {error && <p className="auth-error" role="alert">{error}</p>}
          {notice && <p className="profile-editor-notice" role="status">{notice}</p>}

          <button type="submit" disabled={saving || !values.fullName.trim()}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      )}
    </section>
  )
}

function isRecordNotFound(error: unknown): boolean {
  return error instanceof XrpcResponseError && error.error === 'RecordNotFound'
}
