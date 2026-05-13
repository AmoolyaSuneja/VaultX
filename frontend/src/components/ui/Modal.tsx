import { AnimatePresence, motion } from 'framer-motion';
import { Dialog, DialogPanel } from '@headlessui/react';
import type { PropsWithChildren } from 'react';
import { scaleIn } from '@/lib/motion';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
}

export function Modal({ open, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <Dialog open={open} onClose={onClose} className="relative z-[70]">
          <motion.div
            className="fixed inset-0 bg-textPrimary/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="fixed inset-0 overflow-y-auto px-3 py-4 sm:p-4">
            <div className="mx-auto flex min-h-full max-w-md items-end justify-center sm:items-start sm:pt-28">
              <DialogPanel className="w-full">
                <motion.div
                  {...scaleIn}
                  className="w-full rounded-lg border border-line bg-panel p-5 shadow-card sm:p-6"
                >
                  {children}
                </motion.div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      ) : null}
    </AnimatePresence>
  );
}
