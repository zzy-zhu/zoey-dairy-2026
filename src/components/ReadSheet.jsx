import Sheet from './Sheet.jsx'
import { useStore } from '../lib/store.jsx'

/** Read-only view of a saved entry or weekly reflection. */
export default function ReadSheet({ title, subtitle, body, onEdit, onClose }) {
  const { showToast } = useStore()
  return (
    <Sheet
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      actions={
        <>
          {onEdit && (
            <button className="btn btn-primary" onClick={onEdit}>
              Edit
            </button>
          )}
          <button
            className="btn"
            onClick={() =>
              navigator.clipboard
                .writeText(body)
                .then(() => showToast('Copied'))
                .catch(() => showToast('Select and copy manually'))
            }
          >
            Copy text
          </button>
        </>
      }
    >
      <div className="transcript">{body || 'Nothing written here yet.'}</div>
    </Sheet>
  )
}
