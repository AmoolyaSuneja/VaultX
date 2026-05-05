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
            className="fixed inset-0 bg-background/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
          />
          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="mx-auto mt-20 flex min-h-full max-w-md items-start justify-center">
              <DialogPanel className="w-full">
                <motion.div
                  {...scaleIn}
                  className="w-full rounded-xl border border-line bg-panel p-6 shadow-card backdrop-blur-panel"
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
