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
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Spin,
  Table,
  Typography,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { core_services } from "../../utils/api";

const { Title, Text } = Typography;

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
const ACCOUNT_STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "Active",                   color: "#0D7A4E", bg: "#E6F4EF" },
  1: { label: "Restricted (No Events)",   color: "#B45309", bg: "#FEF3C7" },
  2: { label: "Restricted (No Join)",     color: "#B45309", bg: "#FEF3C7" },
  3: { label: "Banned",                   color: "#C0392B", bg: "#FDECEA" },
};

const REPORT_STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "Pending",  color: "#B45309", bg: "#FEF3C7" },
  1: { label: "Reviewed", color: "#1B6EF3", bg: "#E8F0FE" },
  2: { label: "Removed",  color: "#C0392B", bg: "#FDECEA" },
};

const TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  post:    { color: "#1B6EF3", bg: "#E8F0FE" },
  comment: { color: "#0369A1", bg: "#E0F2FE" },
  message: { color: "#7C3AED", bg: "#F3F0FF" },
  event:   { color: "#0D7A4E", bg: "#E6F4EF" },
};

const REASON_COLOR: Record<string, { color: string; bg: string }> = {
  spam:          { color: "#B45309", bg: "#FEF3C7" },
  harassment:    { color: "#C0392B", bg: "#FDECEA" },
  inappropriate: { color: "#7C3AED", bg: "#F3F0FF" },
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const InlineBadge: React.FC<{ label: string; color: string; bg: string }> = ({ label, color, bg }) => (
  <span style={{ display: "inline-flex", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600, color, background: bg }}>
    {label}
  </span>
);

// ─── Stat card ────────────────────────────────────────────────────────────────
const MiniStatCard: React.FC<{ value: number; label: string; icon: React.ReactNode; color: string; bg: string }> = ({ value, label, icon, color, bg }) => (
  <Card style={{ borderRadius: 8, border: "1px solid #E4E7EC", textAlign: "center" }} styles={{ body: { padding: 16 } }}>
    <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color, margin: "0 auto 10px" }}>
      {icon}
    </div>
    <div style={{ fontSize: 24, fontWeight: 700, color: "#1F2937", lineHeight: 1 }}>{value}</div>
    <Text style={{ fontSize: 11, color: "#9AA3B0", marginTop: 4, display: "block" }}>{label}</Text>
  </Card>
);

// ─── Component ────────────────────────────────────────────────────────────────
const UserInterestDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();

  const [user, setUser]       = useState<UserDetail | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
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
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxJoinCount = user?.interests?.length
    ? Math.max(...user.interests.map((i) => i.joinCount))
    : 1;

  const reportColumns: ColumnsType<Report> = [
    {
      title: "Type",
      dataIndex: "contentType",
      render: (type: string) => {
        const c = TYPE_COLOR[type] || { color: "#6B7280", bg: "#F0F2F5" };
        return <InlineBadge label={type?.toUpperCase()} color={c.color} bg={c.bg} />;
      },
    },
    {
      title: "Content ID",
      dataIndex: "contentId",
      render: (id: string) => (
        <Text copyable={{ text: id }} style={{ fontSize: 11, color: "#9AA3B0", fontFamily: "monospace" }}>
          {id?.slice(0, 8)}...
        </Text>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      render: (reason: string) => {
        const c = REASON_COLOR[reason?.toLowerCase()] || { color: "#6B7280", bg: "#F0F2F5" };
        return <InlineBadge label={reason?.toUpperCase()} color={c.color} bg={c.bg} />;
      },
    },
    {
      title: "Status",
      dataIndex: "reportStatus",
      render: (status: number) => {
        const s = REPORT_STATUS_MAP[status] || REPORT_STATUS_MAP[0];
        return <InlineBadge label={s.label} color={s.color} bg={s.bg} />;
      },
    },
    {
      title: "Reported At",
      dataIndex: "reportedAt",
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      sorter: (a: Report, b: Report) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
      defaultSortOrder: "ascend" as const,
    },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 280 }}>
        <Spin size="large" />
      </div>
    );
  }

  const accountStatus = user ? (ACCOUNT_STATUS_MAP[user.accountStatus] || ACCOUNT_STATUS_MAP[0]) : null;

  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => navigate(-1)}
            style={{ borderRadius: 6, color: "#6B7280" }}
          />
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1F2937" }}>User Interest Detail</Title>
            <Text style={{ fontSize: 11, color: "#9AA3B0" }}>View interests, stats, and reports for this user</Text>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} style={{ borderRadius: 6 }}>
          Refresh
        </Button>
      </div>

      {!user ? (
        <Card style={{ borderRadius: 8, border: "1px solid #E4E7EC" }}>
          <Empty description="User not found" />
        </Card>
      ) : (
        <>
          {/* ── Profile + Stats ── */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>

            {/* Profile */}
            <Col xs={24} md={9}>
              <Card style={{ borderRadius: 8, border: "1px solid #E4E7EC", height: "100%" }} styles={{ body: { padding: 20 } }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <Avatar
                    size={56}
                    src={user.avatar}
                    icon={!user.avatar ? <UserOutlined /> : undefined}
                    style={{ background: "#E8F0FE", color: "#1B6EF3", fontSize: 20, flexShrink: 0 }}
                  />
                  <div>
                    <Text style={{ fontSize: 15, fontWeight: 700, color: "#1F2937", display: "block" }}>
                      {user.username}
                    </Text>
                    {accountStatus && (
                      <span style={{ display: "inline-flex", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: accountStatus.color, background: accountStatus.bg, marginTop: 4 }}>
                        {accountStatus.label}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MailOutlined style={{ color: "#9AA3B0", fontSize: 13, flexShrink: 0 }} />
                    <Text copyable style={{ fontSize: 12, color: "#374151" }}>{user.email}</Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <EnvironmentOutlined style={{ color: "#9AA3B0", fontSize: 13, flexShrink: 0 }} />
                    <Text style={{ fontSize: 12, color: "#374151" }}>{user.location || "—"}</Text>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UserOutlined style={{ color: "#9AA3B0", fontSize: 13, flexShrink: 0 }} />
                    <Text copyable={{ text: user.userId }} style={{ fontSize: 11, color: "#9AA3B0", fontFamily: "monospace" }}>
                      {user.userId?.slice(0, 16)}...
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Stats */}
            <Col xs={24} md={15}>
              <Row gutter={[10, 10]}>
                <Col xs={12} sm={6} md={6}>
                  <MiniStatCard value={user.stats.eventsHosted}     label="Hosted"     icon={<CalendarOutlined />} color="#1B6EF3" bg="#E8F0FE" />
                </Col>
                <Col xs={12} sm={6} md={6}>
                  <MiniStatCard value={user.stats.eventsJoined}     label="Joined"     icon={<TeamOutlined />}    color="#0D7A4E" bg="#E6F4EF" />
                </Col>
                <Col xs={12} sm={6} md={6}>
                  <MiniStatCard value={user.stats.totalPosts}       label="Posts"      icon={<TrophyOutlined />}  color="#B45309" bg="#FEF3C7" />
                </Col>
                <Col xs={12} sm={6} md={6}>
                  <MiniStatCard value={user.stats.totalReportsFiled} label="Reports"   icon={<FlagOutlined />}    color="#C0392B" bg="#FDECEA" />
                </Col>
              </Row>
            </Col>
          </Row>

          {/* ── Interests ── */}
          <Card
            style={{ borderRadius: 8, border: "1px solid #E4E7EC", marginBottom: 16, boxShadow: "0 1px 4px rgba(8,22,56,0.06)" }}
            styles={{ header: { borderBottom: "1px solid #F0F2F5", minHeight: 48, padding: "0 20px" }, body: { padding: 16 } }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StarOutlined style={{ color: "#B45309" }} />
                <Text style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>Category Interests</Text>
                <span style={{ background: "#FEF3C7", color: "#B45309", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 12 }}>
                  {user.interests.length}
                </span>
              </div>
            }
          >
            {user.interests.length === 0 ? (
              <Empty description="No interests tracked yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Row gutter={[10, 10]}>
                {user.interests.map((interest) => (
                  <Col xs={24} sm={12} md={8} key={interest.categoryId}>
                    <div
                      style={{
                        padding: 14,
                        borderRadius: 8,
                        border: "1px solid #E4E7EC",
                        borderLeft: "3px solid #B45309",
                        background: "#FAFBFC",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: 600, color: "#1F2937" }}>{interest.categoryName}</Text>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#B45309" }}>{interest.joinCount} joins</span>
                      </div>
                      {interest.categoryDesc && (
                        <Text style={{ fontSize: 11, color: "#9AA3B0", display: "block", marginBottom: 8 }}>
                          {interest.categoryDesc}
                        </Text>
                      )}
                      <div style={{ height: 3, borderRadius: 2, background: "#F0F2F5", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.round((interest.joinCount / maxJoinCount) * 100)}%`,
                            background: "#B45309",
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </Card>

          {/* ── Reports ── */}
          <Card
            style={{ borderRadius: 8, border: "1px solid #E4E7EC", boxShadow: "0 1px 4px rgba(8,22,56,0.06)" }}
            styles={{ header: { borderBottom: "1px solid #F0F2F5", minHeight: 48, padding: "0 20px" }, body: { padding: 0 } }}
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FlagOutlined style={{ color: "#C0392B" }} />
                <Text style={{ fontSize: 13, fontWeight: 700, color: "#1F2937" }}>Reports Filed</Text>
                <span style={{ background: "#FDECEA", color: "#C0392B", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 12 }}>
                  {reports.length}
                </span>
              </div>
            }
          >
            <Table
              dataSource={reports}
              columns={reportColumns}
              rowKey="reportId"
              size="middle"
              pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (t) => <Text style={{ fontSize: 11, color: "#9AA3B0" }}>{t} reports</Text> }}
              locale={{
                emptyText: (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "#9AA3B0" }}>
                    <FlagOutlined style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
                    <div style={{ fontSize: 12 }}>No reports filed by this user</div>
                  </div>
                ),
              }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default UserInterestDetail;