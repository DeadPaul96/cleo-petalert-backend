import React from "react";
import { Home, MessageCircle, Heart, User, Zap } from "lucide-react";
import "./BottomBar.css";

const BottomBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "home", icon: Home, label: "Inicio" },
    { id: "chats", icon: MessageCircle, label: "Chats" },
    { id: "panic", icon: Zap, label: "PÁNICO", isAction: true },
    { id: "adoption", icon: Heart, label: "Adopción" },
    { id: "profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="bottom-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? "active" : ""} ${tab.isAction ? "panic-nav-btn" : ""}`}
          onClick={() => onTabChange(tab.id)}
        >
          <div className="icon-wrapper">
            <tab.icon size={tab.isAction ? 28 : 24} fill={tab.isAction ? "currentColor" : "none"} strokeWidth={2.5} />
          </div>
          {tab.label && <span className="tab-label">{tab.label}</span>}
        </button>
      ))}
      <style>{`
        .bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: var(--bottom-bar-bg);
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid var(--border-color);
          z-index: 1000;
          padding-bottom: var(--safe-area-bottom);
        }
        .tab-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: none;
          border: none;
          color: var(--text-muted);
          gap: 4px;
          transition: all 0.2s;
        }
        .tab-item.active { color: var(--primary); }
        .tab-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

        .panic-nav-btn {
          margin-top: -30px;
          color: var(--danger) !important;
        }
        .panic-nav-btn .icon-wrapper {
          width: 56px;
          height: 56px;
          background: var(--danger);
          color: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(255, 71, 87, 0.4);
          border: 3px solid var(--bg-white);
        }
        .panic-nav-btn .tab-label {
          margin-top: 4px;
          color: var(--danger);
          font-weight: 900;
        }
      `}</style>
    </nav>
  );
};

export default BottomBar;
