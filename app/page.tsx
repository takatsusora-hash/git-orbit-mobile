import { SystemCard } from "@/components/SystemCard";
import { loadAccountSummaries, loadSystemSummaries } from "@/lib/analyzer/statusGenerator";

export default async function HomePage() {
  const [accounts, systems] = await Promise.all([
    loadAccountSummaries(),
    loadSystemSummaries(),
  ]);

  return (
    <main className="shell">
      <div className="shell-inner">
        <header className="page-header">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="title">GitHub Systems In Orbit</h1>
            <p className="subtitle">
              GitHub の現物から取得した repo 状態を土台にして、接続定義があるシステムだけをマップ化します。
              定義のないものは live repo view として正直に表示します。
            </p>
          </div>
        </header>

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
