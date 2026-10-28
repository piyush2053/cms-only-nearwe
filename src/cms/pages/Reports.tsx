import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  
  Spin,
  Table,
  Typography,
  message,
  Avatar,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { core_services } from "../../utils/api";

const { Title, Text } = Typography;

const INDIGO = "#3F51B5";

interface Reporter {
  userId: string;
  username: string;
  email: string;
  avatar: string | null;
  accountStatus: number;
  stats: { eventsHosted: number; eventsJoined: number; totalPosts: number; totalReportsFiled: number };
  interests: string[];
}

interface Report {
  reportId: string;
  contentType: "post" | "event" | "comment" | "message";
  contentId: string;
  reason: string;
  reportStatus: number;
  reportedAt: string;
  reporter: Reporter;
}

const STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "Pending",  color: "#F57C00", bg: "#FFF3E0" },
  1: { label: "Reviewed", color: INDIGO,    bg: "#E8EAF6" },
  2: { label: "Removed",  color: "#E53935", bg: "#FFEBEE" },
};

const TYPE_COLOR: Record<string, { color: string; bg: string }> = {
  post:    { color: INDIGO,    bg: "#E8EAF6" },
  event:   { color: "#00897B", bg: "#E0F2F1" },
  comment: { color: "#0288D1", bg: "#E1F5FE" },
  message: { color: "#7B1FA2", bg: "#F3E5F5" },
};

const REASON_COLOR: Record<string, { color: string; bg: string }> = {
  spam:          { color: "#F57C00", bg: "#FFF3E0" },
  harassment:    { color: "#E53935", bg: "#FFEBEE" },
  inappropriate: { color: "#7B1FA2", bg: "#F3E5F5" },
};

const InlineBadge: React.FC<{ label: string; color: string; bg: string }> = ({ label, color, bg }) => (
  <span style={{
    display: "inline-flex",
    padding: "3px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color,
    background: bg,
  }}>
    {label}
  </span>
);

const ReportStatCard: React.FC<{
  count: number; label: string; color: string; bg: string; icon: React.ReactNode;
}> = ({ count, label, color, bg, icon }) => (
  <Card
    className="cms-stat-card"
    style={{ borderRadius: 16, border: "1px solid #E3E6F0", boxShadow: "0 2px 12px rgba(63,81,181,0.08)" }}
    styles={{ body: { padding: "20px 24px" } }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#9E9E9E",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          marginBottom: 8,
        }}>
          {label}
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, color: "#212121", lineHeight: 1 }}>{count}</div>
      </div>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        color,
      }}>
        {icon}
      </div>
    </div>
  </Card>
);

// ─── Component ────────────────────────────────────────────────────────────────
const Reports: React.FC = () => {
  const [reports, setReports]           = useState<Report[]>([]);
  const [loading, setLoading]           = useState(false);
  const [searchText, setSearchText]     = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType]     = useState<string>("all");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await core_services.getReports();
      setReports(data || []);
    } catch {
      message.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch = !searchText ||
        r.reporter?.username?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.reason?.toLowerCase().includes(searchText.toLowerCase()) ||
        r.contentType?.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = filterStatus === "all" || r.reportStatus === Number(filterStatus);
      const matchType   = filterType   === "all" || r.contentType  === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [reports, searchText, filterStatus, filterType]);

  const pendingCount  = reports.filter((r) => r.reportStatus === 0).length;
  const reviewedCount = reports.filter((r) => r.reportStatus === 1).length;
  const removedCount  = reports.filter((r) => r.reportStatus === 2).length;

  const columns: ColumnsType<Report> = [
    {
      title: "Reporter",
      render: (_: any, record: Report) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={32}
            style={{ background: "#E8EAF6", color: INDIGO, fontSize: 12, fontWeight: 700, flexShrink: 0 }}
          >
            {record.reporter?.username?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
          <div>
            <Text style={{ fontSize: 13, fontWeight: 600, color: "#212121", display: "block" }}>
              {record.reporter?.username || "Unknown"}
            </Text>
            <Text style={{ fontSize: 11, color: "#9E9E9E" }}>{record.reporter?.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Content Type",
      dataIndex: "contentType",
      render: (type: string) => {
        const c = TYPE_COLOR[type] || { color: "#757575", bg: "#F5F5F5" };
        return <InlineBadge label={type?.toUpperCase()} color={c.color} bg={c.bg} />;
      },
    },
    {
      title: "Content ID",
      dataIndex: "contentId",
      render: (id: string) => (
        <Text copyable={{ text: id }} style={{ fontSize: 11, color: "#BDBDBD", fontFamily: "monospace" }}>
          {id?.slice(0, 8)}...
        </Text>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      render: (reason: string) => {
        const c = REASON_COLOR[reason?.toLowerCase()] || { color: "#757575", bg: "#F5F5F5" };
        return <InlineBadge label={reason?.toUpperCase()} color={c.color} bg={c.bg} />;
      },
    },
    {
      title: "Status",
      dataIndex: "reportStatus",
      render: (status: number) => {
        const s = STATUS_MAP[status] || STATUS_MAP[0];
        return <InlineBadge label={s.label} color={s.color} bg={s.bg} />;
      },
    },
    {
      title: "Reported At",
      dataIndex: "reportedAt",
      render: (date: string) =>
        new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        }),
      sorter: (a: Report, b: Report) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
      defaultSortOrder: "ascend" as const,
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#FFEBEE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <FlagOutlined style={{ color: "#E53935", fontSize: 18 }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#212121" }}>
              Content Reports
            </Title>
            <Text style={{ fontSize: 11, color: "#9E9E9E" }}>{reports.length} total reports</Text>
          </div>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchReports}
          loading={loading}
          style={{ borderRadius: 10 }}
        >
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <ReportStatCard count={pendingCount}  label="Pending Review"  color="#F57C00" bg="#FFF3E0" icon={<ExclamationCircleOutlined />} />
        </Col>
        <Col xs={24} sm={8}>
          <ReportStatCard count={reviewedCount} label="Reviewed"        color={INDIGO}  bg="#E8EAF6" icon={<CheckCircleOutlined />} />
        </Col>
        <Col xs={24} sm={8}>
          <ReportStatCard count={removedCount}  label="Content Removed" color="#E53935" bg="#FFEBEE" icon={<StopOutlined />} />
        </Col>
      </Row>

      {/* Table */}
      <Card
        style={{ borderRadius: 16, border: "1px solid #E3E6F0", boxShadow: "0 2px 12px rgba(63,81,181,0.08)" }}
        styles={{ body: { padding: 0 } }}
      >
        {/* Filter bar */}
        <div style={{
          padding: "14px 20px",
          borderBottom: "1px solid #F5F5F5",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
        }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#BDBDBD", fontSize: 13 }} />}
            placeholder="Search reporter, reason..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 220, borderRadius: 10, fontSize: 12 }}
            allowClear
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 145, fontSize: 12 }}
            options={[
              { label: "All Status",  value: "all" },
              { label: "Pending",     value: "0" },
              { label: "Reviewed",    value: "1" },
              { label: "Removed",     value: "2" },
            ]}
          />
          <Select
            value={filterType}
            onChange={setFilterType}
            style={{ width: 145, fontSize: 12 }}
            options={[
              { label: "All Types",  value: "all" },
              { label: "Post",       value: "post" },
              { label: "Event",      value: "event" },
              { label: "Comment",    value: "comment" },
              { label: "Message",    value: "message" },
            ]}
          />
          <Text style={{ fontSize: 11, color: "#9E9E9E", marginLeft: "auto" }}>
            {filtered.length} of {reports.length} reports
          </Text>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Spin indicator={<LoadingOutlined style={{ color: INDIGO }} />} />
          </div>
        ) : (
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="reportId"
            size="middle"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (t) => <Text style={{ fontSize: 11, color: "#9E9E9E" }}>{t} reports</Text>,
            }}
            rowClassName={(record) => record.reportStatus === 0 ? "report-row-pending" : ""}
            scroll={{ x: 700 }}
            locale={{
              emptyText: (
                <div style={{ padding: "48px 0", textAlign: "center", color: "#BDBDBD" }}>
                  <FlagOutlined style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
                  <div style={{ fontSize: 13 }}>No reports found</div>
                </div>
              ),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default Reports;