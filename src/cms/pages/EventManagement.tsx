import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
  Typography,
  Progress,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { core_services } from "../../utils/api";

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────
interface EventItem {
  id: string;
  eventTitle: string;
  eventDesc: string;
  categoryId: number;
  location: string;
  userId: string;
  status: number;
  maxAttendent: number;
  currentVacany: number;
  charges: number;
  startDateTime: string | null;
  endDateTime: string | null;
  eventImg?: string;
}

// ─── Duration helper ──────────────────────────────────────────────────────────
const getEventDuration = (start?: string | null, end?: string | null) => {
  if (!start || !end) return { invalid: true };
  const s   = dayjs(start);
  const e   = dayjs(end);
  const now = dayjs();
  if (now.isAfter(e)) return { isEnded: true };
  const totalMinutes     = e.diff(s, "minute");
  const remainingMinutes = e.diff(now, "minute");
  const progress         = Math.round(Math.min(Math.max((remainingMinutes / totalMinutes) * 100, 0), 100));
  return { start: s, end: e, remainingMinutes, progress, isEnded: false };
};

// ─── Duration Cell ────────────────────────────────────────────────────────────
const DurationCell: React.FC<{ record: EventItem }> = ({ record }) => {
  const d: any = getEventDuration(record.startDateTime, record.endDateTime);

  if (d.invalid) {
    return (
      <span style={{ fontSize: 11, color: "#9AA3B0", fontStyle: "italic" }}>No schedule</span>
    );
  }
  if (d.isEnded) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9AA3B0", fontWeight: 500 }}>
        Ended
      </span>
    );
  }

  const color =
    d.progress > 66 ? "#1B6EF3"
    : d.progress > 33 ? "#F59E0B"
    : "#C0392B";

  return (
    <div style={{ minWidth: 160 }}>
      <Text style={{ fontSize: 11, color: "#374151", display: "block", marginBottom: 4 }}>
        Ends {d.end.format("DD MMM · hh:mm A")}
      </Text>
      <div style={{ height: 3, borderRadius: 2, background: "#F0F2F5", overflow: "hidden", marginBottom: 3 }}>
        <div style={{ height: "100%", width: `${d.progress}%`, background: color, borderRadius: 2 }} />
      </div>
      <Text style={{ fontSize: 10, color: "#9AA3B0" }}>
        {Math.floor(d.remainingMinutes / 60)}h {d.remainingMinutes % 60}m remaining
      </Text>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const EventManagement: React.FC = () => {
  
  const cancelRef   = useRef(false);

  const [events, setEvents]               = useState<EventItem[]>([]);
  const [loading, setLoading]             = useState(false);
  const [search, setSearch]               = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkDeleting, setBulkDeleting]   = useState(false);
  const [bulkProgress, setBulkProgress]   = useState(0);
  const [open, setOpen]                   = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [editingEvent, setEditingEvent]   = useState<EventItem | null>(null);
  const [form] = Form.useForm();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res     = await core_services.getAllEvents();
      const mapped: EventItem[] = res.map((item: any) => ({
        id:             item.EventID,
        eventTitle:     item.EventTitle,
        eventDesc:      item.EventDesc,
        categoryId:     item.CategoryId,
        location:       item.Location,
        userId:         item.UserId,
        status:         item.Status,
        maxAttendent:   item.MaxAttendent,
        currentVacany:  item.CurrentVacany,
        charges:        item.Charges,
        startDateTime:  item.StartDateTime,
        endDateTime:    item.EndDateTime,
        eventImg:       item.EventImg,
      }));
      setEvents(mapped);
    } catch {
      message.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingEvent) {
        await core_services.updateEvent(editingEvent.id, values);
        message.success("Event updated");
      } else {
        await core_services.createEvent(values);
        message.success("Event created");
      }
      handleClose();
      fetchEvents();
    } catch (err: any) {
      message.error(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: EventItem) => {
    setEditingEvent(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await core_services.deleteEvent(id);
      message.success("Event deleted");
      fetchEvents();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingEvent(null);
    form.resetFields();
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    cancelRef.current = false;
    const total = selectedRowKeys.length;
    for (let i = 0; i < total; i++) {
      if (cancelRef.current) break;
      await core_services.deleteEvent(selectedRowKeys[i] as string);
      setBulkProgress(Math.round(((i + 1) / total) * 100));
    }
    setBulkDeleting(false);
    setBulkProgress(0);
    setSelectedRowKeys([]);
    fetchEvents();
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredEvents = events.filter((e) =>
    [e.eventTitle, e.location, e.userId]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<EventItem> = [
    {
      title: "Event",
      render: (_: any, record: EventItem) => (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#EEF2F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            <CalendarOutlined style={{ color: "#1B6EF3", fontSize: 14 }} />
          </div>
          <div>
            <Text style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", display: "block" }}>
              {record.eventTitle}
            </Text>
            <Text style={{ fontSize: 11, color: "#9AA3B0" }}>{record.location || "—"}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Timeline",
      render: (_: any, record: EventItem) => <DurationCell record={record} />,
    },
    {
      title: "Capacity",
      render: (_: any, record: EventItem) => {
        const filled = record.maxAttendent - record.currentVacany;
        const pct    = record.maxAttendent ? Math.round((filled / record.maxAttendent) * 100) : 0;
        return (
          <div style={{ minWidth: 100 }}>
            <Text style={{ fontSize: 12, color: "#374151" }}>
              {filled} / {record.maxAttendent}
            </Text>
            <div style={{ height: 3, borderRadius: 2, background: "#F0F2F5", marginTop: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? "#C0392B" : "#1B6EF3", borderRadius: 2 }} />
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: number) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            background: status === 1 ? "#E6F4EF" : "#F0F2F5",
            color:      status === 1 ? "#0D7A4E"  : "#9AA3B0",
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: status === 1 ? "#0D7A4E" : "#9AA3B0", display: "inline-block" }} />
          {status === 1 ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "",
      width: 120,
      render: (_: any, record: EventItem) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ color: "#1B6EF3", borderRadius: 5, fontSize: 12 }}
          >
            Edit
          </Button>
          <Popconfirm title="Delete this event?" onConfirm={() => handleDelete(record.id)} okButtonProps={{ danger: true, size: "small" }} cancelButtonProps={{ size: "small" }}>
            <Button type="text" size="small" icon={<DeleteOutlined />} danger style={{ borderRadius: 5, fontSize: 12 }}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        style={{ borderRadius: 8, border: "1px solid #E4E7EC", boxShadow: "0 1px 4px rgba(8,22,56,0.06)" }}
        styles={{ header: { borderBottom: "1px solid #F0F2F5", padding: "0 20px", minHeight: 52 }, body: { padding: 0 } }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>Event Management</Text>
            <span style={{ background: "#E8F0FE", color: "#1B6EF3", fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 12 }}>
              {filteredEvents.length}
            </span>
          </div>
        }
        extra={
          <Space size={8}>
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                size="small"
                onClick={handleBulkDelete}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                Delete {selectedRowKeys.length} selected
              </Button>
            )}
            <Input
              prefix={<SearchOutlined style={{ color: "#CDD2DB", fontSize: 13 }} />}
              placeholder="Search events..."
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 200, borderRadius: 6, fontSize: 12 }}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchEvents} loading={loading} style={{ borderRadius: 6 }} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { form.resetFields(); setEditingEvent(null); setOpen(true); }}
              style={{ borderRadius: 6, background: "#1B6EF3" }}
            >
              Create Event
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredEvents}
          columns={columns}
          size="middle"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => <Text style={{ fontSize: 11, color: "#9AA3B0" }}>{total} events</Text>,
          }}
          rowClassName={() => "cms-table-row"}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Bulk delete progress */}
      <Modal
        open={bulkDeleting}
        footer={null}
        closable={false}
        width={380}
        styles={{ body: { padding: 24 } }}
      >
        <Text style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 12 }}>
          Deleting events...
        </Text>
        <Progress percent={bulkProgress} strokeColor="#1B6EF3" trailColor="#F0F2F5" />
        <Button danger block onClick={() => { cancelRef.current = true; message.warning("Cancelled"); }} style={{ marginTop: 12, borderRadius: 6 }}>
          Cancel
        </Button>
      </Modal>

      {/* Create / Edit modal */}
      <Modal
        title={
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1F2937" }}>
            {editingEvent ? "Edit Event" : "Create Event"}
          </div>
        }
        open={open}
        onOk={handleSubmit}
        onCancel={handleClose}
        confirmLoading={submitting}
        okText={editingEvent ? "Save Changes" : "Create"}
        okButtonProps={{ style: { background: "#1B6EF3", borderRadius: 6 } }}
        cancelButtonProps={{ style: { borderRadius: 6 } }}
        width={480}
        styles={{ body: { paddingTop: 16 } }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Event Title</span>} name="eventTitle" rules={[{ required: true }]}>
            <Input style={{ borderRadius: 6 }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Description</span>} name="eventDesc" rules={[{ required: true }]}>
            <Input.TextArea rows={3} style={{ borderRadius: 6, resize: "none" }} />
          </Form.Item>
          <Form.Item label={<span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Location</span>} name="location" rules={[{ required: true }]}>
            <Input style={{ borderRadius: 6 }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EventManagement;