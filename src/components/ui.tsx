import React, { useSyncExternalStore } from "react";
import { Button, Skeleton, type ButtonProps } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { apiActivity } from "../utils/apiActivity";

// ─── Page scaffolding ────────────────────────────────────────────────────────

export const Page: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={`cms-page ${className ?? ""}`}>{children}</div>;

export const PageHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="cms-page-header">
    <div style={{ minWidth: 0 }}>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
    {actions && <div className="cms-page-actions">{actions}</div>}
  </div>
);

/** Translucent board that groups related surfaces. */
export const Panel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <div className={`cms-panel ${className ?? ""}`} style={style}>
    {children}
  </div>
);

/** Solid white floating card with an optional header row. */
export const Surface: React.FC<{
  title?: React.ReactNode;
  icon?: React.ReactNode;
  count?: number | string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  className?: string;
}> = ({ title, icon, count, extra, children, bodyStyle, style, className }) => (
  <section className={`cms-surface ${className ?? ""}`} style={{ overflow: "hidden", ...style }}>
    {(title || extra) && (
      <div className="cms-toolbar" style={{ borderBottom: "1px solid var(--wy-line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {icon && <span className="cms-icon-tile is-sm">{icon}</span>}
          {title && <h2 className="cms-section-title">{title}</h2>}
          {count !== undefined && <span className="cms-count">{count}</span>}
        </div>
        {extra && <div className="cms-page-actions">{extra}</div>}
      </div>
    )}
    <div style={bodyStyle}>{children}</div>
  </section>
);

export const StatCard: React.FC<{
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  loading?: boolean;
  tone?: "primary" | "navy" | "success" | "warning" | "danger";
}> = ({ label, value, icon, hint, loading, tone = "primary" }) => {
  const tones: Record<string, { bg: string; fg: string }> = {
    primary: { bg: "#E3E9FA", fg: "#3559C7" },
    navy:    { bg: "#202A40", fg: "#FFFFFF" },
    success: { bg: "#E4F5EE", fg: "#1F9D6B" },
    warning: { bg: "#FCF2E2", fg: "#C9821A" },
    danger:  { bg: "#FCE9E7", fg: "#D6453A" },
  };
  const t = tones[tone];
  return (
    <div className="cms-surface cms-stat">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span className="cms-stat-label">{label}</span>
        {icon && (
          <span className="cms-icon-tile is-sm" style={{ background: t.bg, color: t.fg }}>
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton.Input active size="small" style={{ width: 90, height: 28, borderRadius: 99 }} />
      ) : (
        <span className="cms-stat-value">{value}</span>
      )}
      {hint && <span className="cms-stat-hint">{hint}</span>}
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title = "Nothing here yet", description, icon, action }) => (
  <div className="cms-empty">
    <span className="cms-empty-icon">{icon ?? <InboxOutlined />}</span>
    <b>{title}</b>
    {description && <span style={{ fontSize: 12, maxWidth: 320 }}>{description}</span>}
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </div>
);

export type ChipTone = "primary" | "success" | "warning" | "danger" | "neutral";
export const Chip: React.FC<{ tone?: ChipTone; plain?: boolean; children: React.ReactNode }> = ({
  tone = "primary",
  plain,
  children,
}) => (
  <span className={`cms-chip ${tone !== "primary" ? `is-${tone}` : ""} ${plain ? "is-plain" : ""}`}>
    {children}
  </span>
);

// ─── Buttons ─────────────────────────────────────────────────────────────────

/**
 * Antd Button whose onClick may be async. Shows a spinner while it runs and
 * ignores further clicks until it finishes.
 */
export const AsyncButton: React.FC<
  Omit<ButtonProps, "onClick"> & { onClick?: (e: React.MouseEvent<HTMLElement>) => unknown }
> = ({ onClick, loading, disabled, ...rest }) => {
  const [run, running] = useAsyncAction(async (e: React.MouseEvent<HTMLElement>) => {
    await onClick?.(e);
  });
  return (
    <Button
      {...rest}
      disabled={disabled}
      loading={running || loading}
      aria-busy={running || !!loading}
      onClick={(e) => void run(e)}
    />
  );
};

/** Round white icon button from the reference design. */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; dot?: boolean; label: string }
>(({ active, dot, label, className, children, ...rest }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    className={`cms-icon-btn ${active ? "is-active" : ""} ${className ?? ""}`}
    {...rest}
  >
    {children}
    {dot && <span className="cms-dot" />}
  </button>
));
IconButton.displayName = "IconButton";

// ─── Global API activity bar ─────────────────────────────────────────────────

export const ApiActivityBar: React.FC = () => {
  const pending = useSyncExternalStore(apiActivity.subscribe, apiActivity.getSnapshot);
  return (
    <div
      className={`cms-topbar ${pending > 0 ? "is-active" : ""}`}
      role="progressbar"
      aria-hidden={pending === 0}
      aria-label="Loading"
    />
  );
};
