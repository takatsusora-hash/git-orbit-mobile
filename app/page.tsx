import { SystemCard } from "@/components/SystemCard";
import { loadAccountSummaries, loadSystemSummaries } from "@/lib/data/snapshotLoader";

export default async function HomePage() {
  const [accounts, systems] = await Promise.all([
    loadAccountSummaries(),
    loadSystemSummaries(),
  ]);

  return (
    <main className="shell">
      <div className="shell-inner">
        <section className="hero-grid">
          <header className="panel hero-panel">
            <p className="eyebrow">Workspace</p>
            <h1 className="title">GitHub Systems In Orbit</h1>
            <p className="subtitle">
              GitHub から生成した静的スナップショットを使って、スマホでも開ける軽いアプリとして配布します。
              接続定義があるシステムだけをマップ化し、定義のないものは repo view として正直に表示します。
            </p>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="meta-label">Systems</span>
                <strong>{systems.length}</strong>
              </div>
              <div className="hero-stat">
                <span className="meta-label">Accounts</span>
                <strong>{accounts.length}</strong>
              </div>
              <div className="hero-stat">
                <span className="meta-label">Mobile</span>
                <strong>PWA</strong>
              </div>
            </div>
          </header>

          <aside className="panel hero-panel">
            <p className="eyebrow">Phone Use</p>
            <h2 style={{ margin: 0 }}>Install And Open Fast</h2>
            <p className="subtitle">
              公開URLから開いてホーム画面に追加できます。ビルド時にJSONを固定化するので、起動時に GitHub を毎回叩かず軽く開けます。
            </p>
          </aside>
        </section>

        <section className="account-grid">
          {accounts.map((account) => (
            <article className="card account-card" key={account.id}>
              <p className="eyebrow">Account</p>
              <h2 style={{ margin: "0 0 8px" }}>{account.name}</h2>
              <div className="system-meta">
                <div>
                  <div className="meta-label">Repos</div>
                  <div className="meta-value">{account.repoCount}</div>
                </div>
                <div>
                  <div className="meta-label">Private</div>
                  <div className="meta-value">{account.privateCount}</div>
                </div>
                <div>
                  <div className="meta-label">Updated</div>
                  <div className="meta-value">{account.updatedAt}</div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="workspace-grid">
          {systems.map((system) => (
            <SystemCard key={system.id} system={system} />
          ))}
        </section>
      </div>
    </main>
  );
}
