"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const PROGRAM_ID = "72YkKhqgzgue7niCaYs2QxQC3iLfUXGFMbo3yZ5K6d3Q";
const EXPLORER_URL = `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`;
const GITHUB_URL = "https://github.com/samar-58/solguard";

export default function MarketingPage() {
  return (
    <div className="sg">
      <nav className="sg-nav">
        <div className="sg-nav-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          SolGuard
        </div>
        <div className="sg-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
        <div className="sg-nav-cta">
          <WalletMultiButton />
        </div>
      </nav>

      <section className="sg-hero">
        <div className="sg-pill">
          <span className="sg-pill-dot" />
          Live on Devnet
          <span className="sg-pill-sep">·</span>
          <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">View Program →</a>
        </div>

        <h1>
          Permissions that live<br />
          <span>on the chain.</span>
        </h1>

        <p>
          Trustless, CPI-callable Role-Based Access Control for Solana.
          Replace database tables and JWT middleware with on-chain
          accounts any program can verify.
        </p>

        <div className="sg-hero-actions">
          <WalletMultiButton />
          <a className="sg-btn-secondary" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
          </a>
        </div>
      </section>

      <section className="sg-features" id="features">
        <div className="sg-features-header">
          <span className="sg-label">Features</span>
          <h2>Built for Solana programs.</h2>
          <p>The full RBAC model as on-chain accounts — composable, verifiable, and unstoppable.</p>
        </div>

        <div className="sg-cards">
          <div className="sg-card">
            <div className="sg-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <h3>CPI-Callable</h3>
            <p>
              Any Solana program can call <code>check_permission</code> via CPI
              to gate its instructions. One shared IAM layer across your
              entire protocol.
            </p>
          </div>

          <div className="sg-card">
            <div className="sg-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h3>Fine-Grained Permissions</h3>
            <p>
              Create atomic primitives like <code>transfer</code>,
              <code>mint</code>, or <code>admin:config</code> and compose
              them into roles.
            </p>
          </div>

          <div className="sg-card">
            <div className="sg-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3>Immutable Audit Trail</h3>
            <p>
              Every grant, revoke, and configuration change is a signed
              transaction on the ledger. No silent modifications.
            </p>
          </div>
        </div>
      </section>

      <section className="sg-how" id="how-it-works">
        <div className="sg-how-header">
          <span className="sg-label">Integration</span>
          <h2>Three steps to get started.</h2>
        </div>

        <div className="sg-steps">
          <div className="sg-step">
            <span className="sg-step-n">1</span>
            <h3>Initialize</h3>
            <p>
              Deploy a root authority PDA to establish your
              organization&apos;s access hierarchy on-chain.
            </p>
          </div>
          <div className="sg-step">
            <span className="sg-step-n">2</span>
            <h3>Configure</h3>
            <p>
              Create roles and permissions as individual PDAs, then bind
              permissions to roles.
            </p>
          </div>
          <div className="sg-step">
            <span className="sg-step-n">3</span>
            <h3>Enforce</h3>
            <p>
              Assign roles to wallets and verify access via CPI from any
              program.
            </p>
          </div>
        </div>
      </section>

      <section className="sg-cta">
        <h2>Ready to guard your program?</h2>
        <p>
          Connect your wallet to deploy a root authority and start
          managing permissions on Solana devnet.
        </p>
        <WalletMultiButton />
      </section>

      <footer className="sg-footer">
        <span>Built on Solana with Anchor</span>
        <span className="sg-footer-sep">·</span>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
        <span className="sg-footer-sep">·</span>
        <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">Explorer</a>
      </footer>
    </div>
  );
}
