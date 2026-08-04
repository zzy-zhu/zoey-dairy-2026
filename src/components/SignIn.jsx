import { useStore } from '../lib/store.jsx'

export default function SignIn() {
  const { signIn, error } = useStore()
  return (
    <div className="gate">
      <div className="card card-lift gate-card">
        <pre className="gate-art" aria-hidden="true">
          {String.raw` ______________________________
|  ___________________________ |
| |                           ||
| |  Z O E Y ' S   D I A R Y  ||
| |  ~~~~~~~~~~~~~~~~~~~~~~~  ||
| |  > est. 2026    v2.0      ||
| |___________________________||
|______________________________|
     \\_________________________\`
`}
        </pre>
        <p className="muted" style={{ marginBottom: '1.5rem' }}>
          A place to write, set goals, and notice the days. Everything you've already written is
          still in here.
        </p>
        <button className="btn btn-primary btn-block" onClick={signIn}>
          <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#fff"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            />
            <path
              fill="#fff"
              opacity=".85"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.58-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
            <path
              fill="#fff"
              opacity=".7"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#fff"
              opacity=".85"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"
            />
          </svg>
          Continue with Google
        </button>
        {error && (
          <p className="tiny" style={{ marginTop: '1rem', color: 'var(--coral)' }}>
            {error}
          </p>
        )}
        <p className="tiny" style={{ marginTop: '1.1rem' }}>
          Stays signed in — add it to your phone's home screen and it opens like an app.
        </p>
        <p className="tiny" style={{ marginTop: '0.5rem', opacity: 0.7 }}>
          &lt;!-- best viewed in any browser, 800x600 or better --&gt;
        </p>
      </div>
    </div>
  )
}
