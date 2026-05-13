import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';

interface VaultEntranceOverlayProps {
  show: boolean;
}

// Appears briefly after login and then lifts out of view, revealing the dashboard.
// Animation stages:
//   0.0s — fade in, folder sits closed in the center.
//   0.3s — lid begins to tilt open.
//   0.8s — three "page" slivers rise out of the folder.
//   1.35s — folder scales up 1.03x as overlay fades, pages drift down.
// Total runtime ~1.6s, then the dashboard grid fades in with its own stagger.

function VaultEntranceOverlayComponent({ show }: VaultEntranceOverlayProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="vault-entrance"
          role="presentation"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-background/92 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 1.03 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <svg
              viewBox="0 0 120 96"
              width="112"
              height="90"
              className="drop-shadow-[0_12px_24px_rgba(16,18,22,0.08)]"
              aria-hidden="true"
            >
              <defs>
                <clipPath id="folder-body-clip">
                  {/* Clip the pages so they appear to rise from inside the folder. */}
                  <rect x="0" y="0" width="120" height="70" />
                </clipPath>
              </defs>

              {/* Pages that rise out of the folder */}
              <g clipPath="url(#folder-body-clip)">
                {[0, 1, 2].map((index) => (
                  <motion.rect
                    key={index}
                    x={26 + index * 6}
                    y={44}
                    width={68 - index * 12}
                    height={28}
                    rx={3}
                    className="fill-panel stroke-line"
                    strokeWidth={1}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{
                      y: [-4 - index * 2, -10 - index * 3, -6 - index * 2],
                      opacity: [0, 1, 1]
                    }}
                    transition={{
                      delay: 0.45 + index * 0.08,
                      duration: 1.15,
                      times: [0, 0.55, 1],
                      ease: [0.22, 1, 0.36, 1]
                    }}
                  />
                ))}
              </g>

              {/* Folder back panel (tab) */}
              <path
                d="M10 20 h40 l6 -8 h54 a4 4 0 0 1 4 4 v62 a4 4 0 0 1 -4 4 h-100 a4 4 0 0 1 -4 -4 v-54 a4 4 0 0 1 4 -4 Z"
                className="fill-surface-muted stroke-line"
                strokeWidth={1.5}
              />

              {/* Folder front flap — tilts open slightly */}
              <motion.path
                d="M6 30 h108 a4 4 0 0 1 4 4 v48 a4 4 0 0 1 -4 4 h-108 a4 4 0 0 1 -4 -4 v-48 a4 4 0 0 1 4 -4 Z"
                className="fill-panel stroke-line"
                strokeWidth={1.5}
                initial={{ rotate: 0, y: 0 }}
                animate={{ rotate: [-2, -1], y: [-1, 0] }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: '60px 86px' }}
              />
            </svg>

            {/* Quiet label underneath */}
            <motion.p
              className="mt-4 text-center text-[11px] font-medium uppercase tracking-label text-textMuted"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.35 }}
            >
              Opening vault
            </motion.p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export const VaultEntranceOverlay = memo(VaultEntranceOverlayComponent);
