import React, { useState } from "react";
import { Avatar, Drawer, Grid, Popover, Tooltip } from "antd";
import {
  AppstoreOutlined,
  BellOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FlagOutlined,
  HeartOutlined,
  LogoutOutlined,
  MenuOutlined,
  NotificationOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { ApiActivityBar, BrandMark, IconButton } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useUser } from "../contexts/UserContext";
import { removeToken } from "../utils/function";

const { useBreakpoint } = Grid;

const menuItems = [
  { key: "/insights",      icon: <DashboardOutlined />,    label: "Insights",      title: "Insights" },
  { key: "/users",         icon: <TeamOutlined />,         label: "Users",         title: "User Management" },
  { key: "/categories",    icon: <AppstoreOutlined />,     label: "Categories",    title: "Category Management" },
  { key: "/events",        icon: <CalendarOutlined />,     label: "Events",        title: "Event Management" },
  { key: "/app",           icon: <NotificationOutlined />, label: "Advertise",     title: "Advertise" },
  { key: "/reports",       icon: <FlagOutlined />,         label: "Reports",       title: "Reports" },
  { key: "/announcements", icon: <BellOutlined />,         label: "Announcements", title: "Announcements" },
  { key: "/interests",     icon: <HeartOutlined />,        label: "Interests",     title: "User Interests" },
];

const RAIL_WIDTH = 76;
const RAIL_GAP = 18;

const ShellStyles = () => (
  <style>{`
    .cms-shell { min-height: 100vh; }
    .cms-rail {
      position: fixed; z-index: 100;
      top: ${RAIL_GAP}px; bottom: ${RAIL_GAP}px; left: ${RAIL_GAP}px;
      width: ${RAIL_WIDTH}px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 16px 0;
      border-radius: 40px;
      background: rgba(255,255,255,0.45);
      border: 1px solid rgba(255,255,255,0.85);
      -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
      box-shadow: 0 30px 60px -30px rgba(32,42,64,0.25);
    }
    .cms-rail-logo {
      display: grid; place-items: center; border-radius: 16px;
      background: transparent; margin-bottom: 8px; border: 0; cursor: pointer; padding: 0;
      transition: transform .2s var(--wy-ease);
    }
    .cms-rail-logo:hover { transform: translateY(-2px) rotate(-3deg); }
    .cms-rail-nav {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;
      overflow-y: auto; padding: 4px 8px; scrollbar-width: none;
    }
    .cms-rail-nav::-webkit-scrollbar { display: none; }
    .cms-rail-sep { width: 28px; height: 1px; background: rgba(32,42,64,0.08); margin: 4px 0; }

    .cms-main { transition: margin-left .2s; }
    .cms-header {
      position: sticky; top: 0; z-index: 90;
      display: flex; align-items: center; gap: 16px;
      padding: 16px 28px 12px;
    }
    .cms-header::before {
      content: ""; position: absolute; inset: 0; z-index: -1;
      background: linear-gradient(180deg, rgba(232,236,244,0.92) 40%, rgba(232,236,244,0));
      -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
      -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent);
      mask-image: linear-gradient(180deg, #000 70%, transparent);
    }
    .cms-brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .cms-brand b { font-size: 19px; font-weight: 800; color: var(--wy-navy); letter-spacing: -0.02em; }
    .cms-brand span { font-weight: 500; color: var(--wy-text-2); }
    .cms-header-nav { flex: 1; display: flex; justify-content: center; min-width: 0; }
    .cms-header-right { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-shrink: 0; }

    .cms-user-chip {
      display: flex; align-items: center; gap: 10px;
      padding: 4px 14px 4px 4px; border-radius: 999px;
      background: #fff; border: 1px solid rgba(255,255,255,0.9);
      box-shadow: var(--wy-shadow-btn); cursor: pointer;
      transition: transform .2s var(--wy-ease), box-shadow .2s;
      font: inherit; color: inherit;
    }
    .cms-user-chip:hover { transform: translateY(-2px); box-shadow: var(--wy-shadow-float); }
    .cms-user-chip .name { font-size: 12px; font-weight: 700; color: var(--wy-navy); line-height: 1.2; text-align: left; }
    .cms-user-chip .mail { font-size: 10px; color: var(--wy-muted); line-height: 1.2; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .cms-content { padding: 8px 28px 40px; max-width: 1480px; margin: 0 auto; }

    .cms-drawer-nav { display: flex; flex-direction: column; gap: 6px; }
    .cms-drawer-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 999px; border: 0; background: transparent;
      font: 600 14px var(--wy-font); color: var(--wy-text-2); cursor: pointer; text-align: left;
    }
    .cms-drawer-item .cms-icon-btn { width: 38px; height: 38px; box-shadow: none; pointer-events: none; }
    .cms-drawer-item.is-active { background: #fff; color: var(--wy-navy); box-shadow: var(--wy-shadow-btn); }

    @media (max-width: 767px) {
      .cms-header { padding: 12px 16px 10px; gap: 10px; }
      .cms-content { padding: 4px 16px 32px; }
    }
  `}</style>
);

const initials = (name?: string, email?: string) => {
  const src = (name || email || "A").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "A") + (parts[1]?.[0] ?? "")).toUpperCase();
};

const AccountMenu: React.FC<{ name: string; email: string; onLogout: () => void }> = ({
  name,
  email,
  onLogout,
}) => (
  <div style={{ width: 240 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 4px 14px" }}>
      <Avatar size={44} style={{ background: "var(--wy-navy)", fontWeight: 700 }}>
        {initials(name, email)}
      </Avatar>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--wy-navy)" }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--wy-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {email}
        </div>
      </div>
    </div>
    <button
      type="button"
      onClick={onLogout}
      className="cms-drawer-item"
      style={{ width: "100%", color: "var(--wy-danger)", background: "#FCE9E7" }}
    >
      <LogoutOutlined /> Sign out
    </button>
  </div>
);

const CmsHome: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const { logout } = useAuth();
  const { user, clearUser } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const selectedKey =
    menuItems.find((m) => location.pathname === m.key || location.pathname.startsWith(m.key + "/"))?.key ??
    location.pathname;

  const name = (user?.name as string) || (user?.username as string) || "Admin";
  const email = (user?.email as string) || "admin";

  const handleLogout = () => {
    setAccountOpen(false);
    clearUser();
    removeToken();
    logout();
    navigate("/login", { replace: true });
  };

  const go = (key: string) => {
    setDrawerOpen(false);
    if (key !== selectedKey) navigate(key);
  };

  const showRail = !!screens.md;
  const showTabs = !!screens.xl;
  const mainOffset = showRail ? RAIL_WIDTH + RAIL_GAP * 2 : 0;

  return (
    <div className="cms-shell">
      <ShellStyles />
      <ApiActivityBar />

      {/* ── Icon rail ── */}
      {showRail && (
        <aside className="cms-rail" aria-label="Main navigation">
          <button type="button" className="cms-rail-logo" onClick={() => go("/insights")} aria-label="Home">
            <BrandMark size={48} />
          </button>
          <nav className="cms-rail-nav">
            {menuItems.map((item) => (
              <Tooltip key={item.key} title={item.title} placement="right">
                <IconButton
                  label={item.title}
                  active={selectedKey === item.key}
                  aria-current={selectedKey === item.key ? "page" : undefined}
                  onClick={() => go(item.key)}
                >
                  {item.icon}
                </IconButton>
              </Tooltip>
            ))}
          </nav>
          <span className="cms-rail-sep" />
          <Tooltip title="Sign out" placement="right">
            <IconButton label="Sign out" onClick={handleLogout}>
              <LogoutOutlined />
            </IconButton>
          </Tooltip>
        </aside>
      )}

      {/* ── Mobile drawer ── */}
      {!showRail && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={280}
          closable={false}
          styles={{ body: { padding: 18 }, content: { borderRadius: "0 28px 28px 0" } }}
        >
          <div className="cms-brand" style={{ marginBottom: 22, paddingLeft: 6 }}>
            <BrandMark size={40} />
            <b>
              nearwe<span>cms</span>
            </b>
          </div>
          <nav className="cms-drawer-nav">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`cms-drawer-item ${selectedKey === item.key ? "is-active" : ""}`}
                onClick={() => go(item.key)}
              >
                <span className={`cms-icon-btn ${selectedKey === item.key ? "is-active" : ""}`}>{item.icon}</span>
                {item.title}
              </button>
            ))}
          </nav>
        </Drawer>
      )}

      {/* ── Main ── */}
      <div className="cms-main" style={{ marginLeft: mainOffset }}>
        <header className="cms-header">
          {!showRail && (
            <IconButton label="Open menu" onClick={() => setDrawerOpen(true)}>
              <MenuOutlined />
            </IconButton>
          )}
          <div className="cms-brand">
            {!showRail && <BrandMark size={36} />}
            <b>
              nearwe<span>cms</span>
            </b>
          </div>

          {showTabs && (
            <div className="cms-header-nav">
              <nav className="cms-pill-tabs" aria-label="Sections">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`cms-pill-tab ${selectedKey === item.key ? "is-active" : ""}`}
                    aria-current={selectedKey === item.key ? "page" : undefined}
                    onClick={() => go(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          )}

          <div className="cms-header-right">
            <Tooltip title="Announcements">
              <IconButton label="Announcements" onClick={() => go("/announcements")}>
                <BellOutlined />
              </IconButton>
            </Tooltip>
            <Popover
              open={accountOpen}
              onOpenChange={setAccountOpen}
              content={<AccountMenu name={name} email={email} onLogout={handleLogout} />}
              trigger="click"
              placement="bottomRight"
              arrow={false}
            >
              {screens.sm ? (
                <button type="button" className="cms-user-chip" aria-label="Account">
                  <Avatar size={34} style={{ background: "var(--wy-navy)", fontWeight: 700, fontSize: 12 }}>
                    {initials(name, email)}
                  </Avatar>
                  <div>
                    <div className="name">{name}</div>
                    <div className="mail">{email}</div>
                  </div>
                </button>
              ) : (
                <IconButton label="Account">
                  <UserOutlined />
                </IconButton>
              )}
            </Popover>
          </div>
        </header>

        <main className="cms-content" key={selectedKey}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CmsHome;
