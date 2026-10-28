import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  MailOutlined,
  ReloadOutlined,
  StarOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Col, Row, Skeleton, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { core_services } from "../../utils/api";
import { Chip, EmptyState, IconButton, Page, PageHeader, StatCard, Surface, type ChipTone } from "../../components/ui";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { CMS_COLORS } from "../cmstheme";

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserInterest {
  categoryId: number;
  categoryName: string;
  categoryDesc: string;
  joinCount: number;
}
interface UserStats {
  eventsHosted: number;
  eventsJoined: number;
  totalPosts: number;
  totalReportsFiled: number;
}
interface UserDetail {
  userId: string;
  username: string;
  email: string;
  avatar: string | null;
  location: string;
  accountStatus: number;
  stats: UserStats;
  interests: UserInterest[];
}
interface Report {
  reportId: string;
  contentType: string;
  contentId: string;
  reason: string;
  reportStatus: number;
  reportedAt: string;
}

// ─── Maps ─────────────────────────────────────────────────────────────────────
const ACCOUNT_STATUS_MAP: Record<number, { label: string; tone: ChipTone }> = {
  0: { label: "Active",                 tone: "success" },
  1: { label: "Restricted (No Events)", tone: "warning" },
  2: { label: "Restricted (No Join)",   tone: "warning" },
  3: { label: "Banned",                 tone: "danger" },
};

const REPORT_STATUS_MAP: Record<number, { label: string; tone: ChipTone }> = {
  0: { label: "Pending",  tone: "warning" },
  1: { label: "Reviewed", tone: "primary" },
  2: { label: "Removed",  tone: "danger" },
};

const TYPE_TONE: Record<string, ChipTone> = {
  post:    "primary",
  comment: "neutral",
  message: "neutral",
  event:   "success",
};

const REASON_TONE: Record<string, ChipTone> = {
  spam:          "warning",
  harassment:    "danger",
  inappropriate: "danger",
};

const getInitials = (name?: string) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || undefined;

// ─── Component ────────────────────────────────────────────────────────────────
const UserInterestDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();

  const [user, setUser]       = useState<UserDetail | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loaded, setLoaded]   = useState(false);

  const [fetchData, fetching] = useAsyncAction(async () => {
    if (!userId) {
      setLoaded(true);
      return;
    }
    try {
      const allReports: any[] = await core_services.getReports();
      const userReports = allReports.filter(
        (r: any) => r?.reporter?.userId === userId || r?.ReporterUserId === userId
      );
      setReports(userReports);
      const enriched = allReports.find((r: any) => r?.reporter?.userId === userId);
      if (enriched?.reporter) {
        setUser(enriched.reporter as UserDetail);
      } else {
        setUser(null);
      }
    } catch {
      message.error("Failed to fetch user details");
    } finally {
      setLoaded(true);
    }
  }, { queue: true });

  useEffect(() => {
    void fetchData();
  }, [fetchData, userId]);

  const loading = fetching || !loaded;
  const initialLoading = loading && !user;

  const interests = user?.interests ?? [];
  const maxJoinCount = interests.length
    ? Math.max(...interests.map((i) => i.joinCount))
    : 1;

  const reportColumns: ColumnsType<Report> = [
    {
      title: "Type",
      dataIndex: "contentType",
      render: (type: string) => (
        <Chip tone={TYPE_TONE[type] ?? "neutral"} plain>{type?.toUpperCase()}</Chip>
      ),
    },
    {
      title: "Content ID",
      dataIndex: "contentId",
      render: (id: string) => (
        <Text copyable={{ text: id }} style={{ fontSize: 11, color: CMS_COLORS.textMuted, fontFamily: "monospace" }}>
          {id?.slice(0, 8)}...
        </Text>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      render: (reason: string) => (
        <Chip tone={REASON_TONE[reason?.toLowerCase()] ?? "neutral"} plain>{reason?.toUpperCase()}</Chip>
      ),
    },
    {
      title: "Status",
      dataIndex: "reportStatus",
      render: (status: number) => {
        const s = REPORT_STATUS_MAP[status] || REPORT_STATUS_MAP[0];
        return <Chip tone={s.tone}>{s.label}</Chip>;
      },
    },
    {
      title: "Reported At",
      dataIndex: "reportedAt",
      render: (date: string) => (
        <span style={{ color: CMS_COLORS.textSecondary, whiteSpace: "nowrap" }}>
          {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
      sorter: (a: Report, b: Report) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
      defaultSortOrder: "ascend" as const,
    },
  ];

  const accountStatus = user ? (ACCOUNT_STATUS_MAP[user.accountStatus] || ACCOUNT_STATUS_MAP[0]) : null;

  return (
    <Page>
      <style>{`
        .ui-back { display: flex; align-items: center; gap: 14px; }
        .ui-profile-row { display: flex; align-items: center; gap: 10px; color: var(--wy-text-2); font-size: 12px; min-width: 0; }
        .ui-profile-row .anticon { color: var(--wy-silver); font-size: 14px; flex-shrink: 0; }
        .ui-interest {
          height: 100%; padding: 16px; border-radius: 18px; background: var(--wy-light);
          border: 1px solid transparent; transition: border-color 0.2s, background 0.2s, transform 0.2s var(--wy-ease);
        }
        .ui-interest:hover { background: #fff; border-color: var(--wy-border); transform: translateY(-2px); }
        .ui-interest-bar { height: 6px; border-radius: 99px; background: #fff; overflow: hidden; margin-top: 10px; }
        .ui-interest-bar > span { display: block; height: 100%; border-radius: 99px; background: var(--wy-primary); }
        .ui-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; height: 100%; }
      `}</style>

      <PageHeader
        title={
          <span className="ui-back">
            <IconButton label="Go back" title="Back" onClick={() => navigate(-1)}>
              <ArrowLeftOutlined />
            </IconButton>
            User Interest Detail
          </span>
        }
        subtitle="View interests, stats, and reports for this user"
        actions={
          <Button icon={<ReloadOutlined spin={loading} />} onClick={() => void fetchData()} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {initialLoading ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={9}>
              <div className="cms-surface" style={{ padding: 22, height: "100%" }}>
                <Skeleton active avatar={{ size: 56 }} paragraph={{ rows: 3 }} />
              </div>
            </Col>
            <Col xs={24} md={15}>
              <div className="ui-stats">
                {["Hosted", "Joined", "Posts", "Reports"].map((l) => (
                  <StatCard key={l} label={l} value={0} loading />
                ))}
              </div>
            </Col>
          </Row>
          <Surface title="Category Interests" icon={<StarOutlined />} bodyStyle={{ padding: 22 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </Surface>
          <Surface title="Reports Filed" icon={<FlagOutlined />} bodyStyle={{ padding: 0 }}>
            <Table<Report> dataSource={[]} columns={reportColumns} rowKey="reportId" loading pagination={false} />
          </Surface>
        </>
      ) : !user ? (
        <Surface>
          <EmptyState
            title="User not found"
            description="We couldn't find report activity for this user."
            icon={<UserOutlined />}
            action={<Button onClick={() => navigate(-1)} icon={<ArrowLeftOutlined />}>Go back</Button>}
          />
        </Surface>
      ) : (
        <>
          {/* ── Profile + Stats ── */}
          <Row gutter={[16, 16]}>
            {/* Profile */}
            <Col xs={24} md={9}>
              <div className="cms-surface" style={{ padding: 22, height: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <Avatar
                    size={56}
                    src={user.avatar || undefined}
                    icon={!user.avatar && !getInitials(user.username) ? <UserOutlined /> : undefined}
                    style={{ background: CMS_COLORS.navy, color: "#fff", fontSize: 20, fontWeight: 700, flexShrink: 0 }}
                  >
                    {!user.avatar ? getInitials(user.username) : undefined}
                  </Avatar>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: CMS_COLORS.navy, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.username}
                    </div>
                    {accountStatus && <Chip tone={accountStatus.tone}>{accountStatus.label}</Chip>}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 16, borderTop: "1px solid var(--wy-line)" }}>
                  <div className="ui-profile-row">
                    <MailOutlined />
                    <Text copyable ellipsis style={{ fontSize: 12, color: CMS_COLORS.textSecondary }}>{user.email}</Text>
                  </div>
                  <div className="ui-profile-row">
                    <EnvironmentOutlined />
                    <span>{user.location || "—"}</span>
                  </div>
                  <div className="ui-profile-row">
                    <UserOutlined />
                    <Text copyable={{ text: user.userId }} style={{ fontSize: 11, color: CMS_COLORS.textMuted, fontFamily: "monospace" }}>
                      {user.userId?.slice(0, 16)}...
                    </Text>
                  </div>
                </div>
              </div>
            </Col>

            {/* Stats */}
            <Col xs={24} md={15}>
              <div className="ui-stats">
                <StatCard label="Hosted"  value={user.stats?.eventsHosted ?? 0}      icon={<CalendarOutlined />} tone="primary" loading={loading} />
                <StatCard label="Joined"  value={user.stats?.eventsJoined ?? 0}      icon={<TeamOutlined />}     tone="success" loading={loading} />
                <StatCard label="Posts"   value={user.stats?.totalPosts ?? 0}        icon={<TrophyOutlined />}   tone="navy"    loading={loading} />
                <StatCard label="Reports" value={user.stats?.totalReportsFiled ?? 0} icon={<FlagOutlined />}     tone="danger"  loading={loading} />
              </div>
            </Col>
          </Row>

          {/* ── Interests ── */}
          <Surface title="Category Interests" icon={<StarOutlined />} count={interests.length} bodyStyle={{ padding: 22 }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : interests.length === 0 ? (
              <EmptyState title="No interests tracked yet" icon={<StarOutlined />} />
            ) : (
              <Row gutter={[14, 14]}>
                {interests.map((interest) => (
                  <Col xs={24} sm={12} md={8} key={interest.categoryId}>
                    <div className="ui-interest">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: CMS_COLORS.navy }}>{interest.categoryName}</span>
                        <span className="cms-count">{interest.joinCount} joins</span>
                      </div>
                      {interest.categoryDesc && (
                        <span style={{ fontSize: 12, color: CMS_COLORS.textMuted, display: "block" }}>
                          {interest.categoryDesc}
                        </span>
                      )}
                      <div className="ui-interest-bar">
                        <span style={{ width: `${Math.round((interest.joinCount / (maxJoinCount || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Surface>

          {/* ── Reports ── */}
          <Surface title="Reports Filed" icon={<FlagOutlined />} count={reports.length} bodyStyle={{ padding: 0 }}>
            <Table
              dataSource={reports}
              columns={reportColumns}
              rowKey="reportId"
              size="middle"
              loading={loading}
              scroll={{ x: "max-content" }}
              pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => <span style={{ fontSize: 12, color: CMS_COLORS.textMuted }}>{t} reports</span> }}
              locale={{
                emptyText: loading ? " " : (
                  <EmptyState title="No reports filed by this user" icon={<FlagOutlined />} />
                ),
              }}
            />
          </Surface>
        </>
      )}
    </Page>
  );
};

export default UserInterestDetail;
