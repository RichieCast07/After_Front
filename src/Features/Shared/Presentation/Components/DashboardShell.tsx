import fondo from "../../../../assets/after.jpg";
import type { ReactNode } from "react";
import "./dashboard-shell.css";

export interface NavTab {
  id: string;
  label: string;
  icon: string;
}

interface DashboardShellProps {
  title: string;
  username: string;
  badge: string;
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onLogout: () => void;
  children: ReactNode;
}

export default function DashboardShell({
  title,
  username,
  badge,
  tabs,
  activeTab,
  onTabChange,
  onLogout,
  children,
}: DashboardShellProps) {
  return (
    <div className="dashboard-shell" style={{ backgroundImage: `url(${fondo})` }}>
      <div className="dashboard-overlay" />
      <div className="background-shapes" />

      <main className="dashboard-content">
        <header className="hero-card">
          <div className="hero-brand">
            <span className="eyebrow">AFTER</span>
            <h1>{title}</h1>
          </div>

          <div className="hero-actions">
            <div className="identity-card">
              <strong>{username}</strong>
              <span>{badge}</span>
            </div>
            <button type="button" className="ghost-button" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        <nav className="tab-nav" aria-label="Módulos">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-btn${activeTab === tab.id ? " tab-btn-active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <section className="dashboard-stack">{children}</section>
      </main>
    </div>
  );
}