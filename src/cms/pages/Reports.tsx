import React, { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Input, Select, Table, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { core_services } from "../../utils/api";
import { Chip, EmptyState, Page, PageHeader, StatCard, Surface, type ChipTone } from "../../components/ui";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { CMS_COLORS } from "../cmstheme";

const { Text } = Typography;

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

const STATUS_MAP: Record<number, { label: string; tone: ChipTone }> = {
  0: { label: "Pending",  tone: "warning" },
  1: { label: "Reviewed", tone: "primary" },
  2: { label: "Removed",  tone: "danger" },
};

const TYPE_TONE: Record<string, ChipTone> = {
  post:    "primary",
  event:   "success",
  comment: "neutral",
  message: "warning",
};

const REASON_TONE: Record<string, ChipTone> = {
  spam:          "warning",
  harassment:    "danger",
  inappropriate: "danger",
};

// ─── Component ────────────────────────────────────────────────────────────────
const Reports: React.FC = () => {
  const [reports, setReports]           = useState<Report[]>([]);
  const [searchText, setSearchText]     = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType]     = useState<string>("all");
  const [loaded, setLoaded]             = useState(false);

  const [fetchReports, loading] = useAsyncAction(async () => {
    try {
      const data = await core_services.getReports();
      setReports(data || []);
    } catch {
      message.error("Failed to fetch reports");
    } finally {
      setLoaded(true);
    }
  }, { queue: true });

  useEffect(() => { void fetchReports(); }, [fetchReports]);

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

  const initialLoading = loading && !loaded;

  const columns: ColumnsType<Report> = [
    {
      title: "Reporter",
      render: (_: any, record: Report) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={34}
            style={{ background: CMS_COLORS.navy, color: CMS_COLORS.white, fontSize: 12, fontWeight: 700, flexShrink: 0 }}
          >
            {record.reporter?.username?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, color: CMS_COLORS.navy, display: "block" }}>
              {record.reporter?.username || "Unknown"}
            </Text>
            <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted }}>{record.reporter?.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Content Type",
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
        const s = STATUS_MAP[status] || STATUS_MAP[0];
        return <Chip tone={s.tone}>{s.label}</Chip>;
      },
    },
    {
      title: "Reported At",
      dataIndex: "reportedAt",
      render: (date: string) => (
        <span style={{ color: CMS_COLORS.textSecondary, fontSize: 12 }}>
          {new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          })}
        </span>
      ),
      sorter: (a: Report, b: Report) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime(),
      defaultSortOrder: "ascend" as const,
    },
  ];

  return (
    <Page>
      <style>{`
        .report-row-pending > td { background: rgba(252, 242, 226, 0.45); }
        .report-row-pending:hover > td { background: rgba(252, 242, 226, 0.75) !important; }
      `}</style>

      <PageHeader
        title="Content Reports"
        subtitle={initialLoading ? "Loading reports…" : `${reports.length} total reports flagged by the community.`}
        actions={
          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => void fetchReports()}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Pending Review"
          value={pendingCount}
          tone="warning"
          icon={<ExclamationCircleOutlined />}
          loading={initialLoading}
        />
        <StatCard
          label="Reviewed"
          value={reviewedCount}
          tone="primary"
          icon={<CheckCircleOutlined />}
          loading={initialLoading}
        />
        <StatCard
          label="Content Removed"
          value={removedCount}
          tone="danger"
          icon={<StopOutlined />}
          loading={initialLoading}
        />
      </div>

      {/* Table */}
      <Surface
        title="All reports"
        icon={<FlagOutlined />}
        count={`${filtered.length} of ${reports.length}`}
        bodyStyle={{ padding: 0 }}
        extra={
          <>
            <Input
              prefix={<SearchOutlined style={{ color: CMS_COLORS.silver }} />}
              placeholder="Search reporter, reason..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220, maxWidth: "100%" }}
              allowClear
            />
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 145 }}
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
              style={{ width: 145 }}
              options={[
                { label: "All Types",  value: "all" },
                { label: "Post",       value: "post" },
                { label: "Event",      value: "event" },
                { label: "Comment",    value: "comment" },
                { label: "Message",    value: "message" },
              ]}
            />
          </>
        }
      >
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="reportId"
          size="middle"
          loading={loading}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showTotal: (t) => <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted }}>{t} reports</Text>,
          }}
          rowClassName={(record) => record.reportStatus === 0 ? "report-row-pending" : ""}
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: initialLoading ? (
              <div style={{ height: 160 }} />
            ) : (
              <EmptyState
                icon={<FlagOutlined />}
                title="No reports found"
                description="Try adjusting your search or filters."
              />
            ),
          }}
        />
      </Surface>
    </Page>
  );
};

export default Reports;
