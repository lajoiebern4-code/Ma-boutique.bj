import { X, Trash2 } from 'lucide-react';

export default function ModalConfirmation({
  ouvert,
  titre = 'Confirmer la suppression',
  message = 'Voulez-vous vraiment supprimer cet élément ?',
  nom,
  onConfirmer,
  onAnnuler,
}) {
  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirmation-titre"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={19} />
            </div>

            <div>
              <h3
                id="modal-confirmation-titre"
                className="text-lg font-bold text-navy-500"
              >
                {titre}
              </h3>

              <p className="mt-1 text-sm text-muted">
                Cette action est irréversible.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-lg p-2 text-muted transition hover:bg-gray-100 hover:text-navy-500"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          {nom && (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-muted">
                Produit sélectionné
              </p>

              <p className="mt-1 font-semibold text-navy-500">
                {nom}
              </p>
            </div>
          )}

          <p className="mt-4 text-sm leading-6 text-muted">
            {message}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onAnnuler}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-gray-50"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onConfirmer}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
