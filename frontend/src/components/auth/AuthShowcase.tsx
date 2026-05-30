import { Users, Clock, ShieldCheck } from 'lucide-react';

export function AuthShowcase() {
  return (
    <section className="relative hidden w-1/2 items-center justify-center overflow-hidden border-r border-line bg-mesh-gradient p-10 md:flex lg:p-12">
      <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-brand/5 blur-[120px]" />
      <div className="absolute bottom-[-5%] right-[-5%] h-[30%] w-[30%] rounded-full bg-brand/3 blur-[80px]" />

      <div className="glass-card z-10 flex w-full max-w-[32rem] flex-col gap-[2rem] rounded-[1.5rem] p-[2rem]">
        <div>
          <h1 className="mb-4 font-heading text-[2rem] font-bold tracking-tight text-textPrimary">VaultX</h1>
          <div className="h-px w-[3rem] bg-textPrimary/30" />
        </div>

        <div className="flex flex-col gap-[1.5rem]">
          <div className="group flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-line bg-surface-raised text-textPrimary transition-transform duration-300 group-hover:scale-110">
              <Users size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-[1.25rem] font-semibold text-textPrimary">Two-Person Access Control</h3>
              <p className="max-w-[24rem] text-[0.9375rem] text-textMuted">Requires cryptographic authorization from multiple verified parties for high-value asset withdrawal.</p>
            </div>
          </div>

          <div className="group flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-line bg-surface-raised text-textPrimary transition-transform duration-300 group-hover:scale-110">
              <Clock size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-[1.25rem] font-semibold text-textPrimary">Time-Locked Entries</h3>
              <p className="max-w-[24rem] text-[0.9375rem] text-textMuted">Gated access protocols that remain locked until specific temporal milestones are achieved.</p>
            </div>
          </div>

          <div className="group flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-line bg-surface-raised text-textPrimary transition-transform duration-300 group-hover:scale-110">
              <ShieldCheck size={24} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-[1.25rem] font-semibold text-textPrimary">Nominee Succession</h3>
              <p className="max-w-[24rem] text-[0.9375rem] text-textMuted">Autonomous asset transfer protocols that activate securely under predefined conditions.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-10 hidden lg:block">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-textMuted/40">
          HERITAGE SECURITY SYSTEMS
        </p>
      </div>
    </section>
  );
}
