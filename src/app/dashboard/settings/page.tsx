import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Manage your account preferences and payout methods.</p>
      </div>

      {/* Account */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Account</h2>
        </div>
        {[
          { label: "Email", value: "alex.johnson@example.com" },
          { label: "Password", value: "••••••••••••" },
        ].map((item) => (
          <div key={item.label} className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
              <p className="text-sm text-[var(--text-muted)]">{item.value}</p>
            </div>
            <Button variant="secondary" size="sm">Change</Button>
          </div>
        ))}
      </section>

      {/* Payout Methods */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Payout Methods</h2>
        </div>
        {[
          { label: "PayPal", value: "alex.johnson@paypal.com" },
          { label: "Cryptocurrency", value: "Not connected" },
        ].map((item) => (
          <div key={item.label} className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
              <p className="text-sm text-[var(--text-muted)]">{item.value}</p>
            </div>
            <Button variant="secondary" size="sm">
              {item.value === "Not connected" ? "Connect" : "Edit"}
            </Button>
          </div>
        ))}
        <div className="px-6 py-4">
          <Button variant="ghost" size="sm">+ Add payout method</Button>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] divide-y divide-[var(--border-default)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--text-primary)]">Notifications</h2>
        </div>
        {[
          { label: "Task approved",      desc: "Get notified when a submission is approved" },
          { label: "Withdrawal status",  desc: "Updates on your withdrawal requests" },
          { label: "New opportunities",  desc: "Alerts for high-paying new tasks" },
        ].map((item) => (
          <div key={item.label} className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
            </div>
            <button
              role="switch"
              aria-checked="true"
              className="h-6 w-11 rounded-full bg-[var(--brand-500)] relative flex-shrink-0 transition-colors"
            >
              <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition-transform" />
            </button>
          </div>
        ))}
      </section>

      {/* Danger Zone */}
      <section className="rounded-lg border border-[var(--danger-text)] bg-[rgba(239,68,68,0.05)] divide-y divide-[rgba(239,68,68,0.15)]">
        <div className="px-6 py-4">
          <h2 className="font-semibold text-[var(--danger-text)]">Danger Zone</h2>
          <p className="text-xs text-[var(--danger-text)] opacity-70 mt-1">These actions are irreversible. Proceed with caution.</p>
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Deactivate Account</p>
            <p className="text-xs text-[var(--text-muted)]">Disable your account. Any pending balance will be frozen.</p>
          </div>
          <Button variant="destructive" size="sm">Deactivate</Button>
        </div>
      </section>
    </div>
  );
}
