interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

export function ConfirmDialog({
  open, title, description,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, dangerous = false,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-sm text-gray-600 mb-6">{description}</p>}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium ${
              dangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
