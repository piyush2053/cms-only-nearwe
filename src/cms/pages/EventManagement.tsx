import React, { useEffect, useRef, useState } from "react";
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm, Typography, Progress } from "antd";
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
import { CMS_COLORS } from "../cmstheme";
import { Page, PageHeader, Surface, EmptyState, IconButton, Chip } from "../../components/ui";
import { useAsyncAction, useKeyedAction } from "../../hooks/useAsyncAction";

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

const Bar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div style={{ height: 4, borderRadius: 99, background: CMS_COLORS.light, overflow: "hidden", margin: "5px 0 4px" }}>
    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
  </div>
);

// ─── Duration Cell ────────────────────────────────────────────────────────────
const DurationCell: React.FC<{ record: EventItem }> = ({ record }) => {
  const d: any = getEventDuration(record.startDateTime, record.endDateTime);

  if (d.invalid) {
    return <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted, fontStyle: "italic" }}>No schedule</Text>;
  }
  if (d.isEnded) {
    return <Chip tone="neutral">Ended</Chip>;
  }

  const color =
    d.progress > 66 ? CMS_COLORS.primary
    : d.progress > 33 ? CMS_COLORS.warning
    : CMS_COLORS.danger;

  return (
    <div style={{ minWidth: 170 }}>
      <Text style={{ fontSize: 12, color: CMS_COLORS.navy, fontWeight: 500, display: "block" }}>
        Ends {d.end.format("DD MMM · hh:mm A")}
      </Text>
      <Bar pct={d.progress} color={color} />
      <Text style={{ fontSize: 10, color: CMS_COLORS.textMuted }}>
        {Math.floor(d.remainingMinutes / 60)}h {d.remainingMinutes % 60}m remaining
      </Text>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
const EventManagement: React.FC = () => {
  const cancelRef = useRef(false);

  const [events, setEvents]                   = useState<EventItem[]>([]);
  const [loaded, setLoaded]                   = useState(false);
  const [search, setSearch]                   = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [bulkProgress, setBulkProgress]       = useState(0);
  const [open, setOpen]                       = useState(false);
  const [editingEvent, setEditingEvent]       = useState<EventItem | null>(null);
  const [form] = Form.useForm();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const [fetchEvents, loading] = useAsyncAction(async () => {
    try {
      const res = await core_services.getAllEvents();
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
      setLoaded(true);
    }
  }, { queue: true });

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleClose = () => {
    setOpen(false);
    setEditingEvent(null);
    form.resetFields();
  };

  const [handleSubmit, submitting] = useAsyncAction(async () => {
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      return; // inline field errors are shown by the form
    }
    try {
      if (editingEvent) {
        await core_services.updateEvent(editingEvent.id, values);
        message.success("Event updated");
      } else {
        await core_services.createEvent(values);
        message.success("Event created");
      }
      handleClose();
      await fetchEvents();
    } catch (err: any) {
      message.error(err?.message || "Something went wrong");
    }
  });

  const handleEdit = (record: EventItem) => {
    setEditingEvent(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const openCreate = () => {
    form.resetFields();
    setEditingEvent(null);
    setOpen(true);
  };

  const remove = useKeyedAction(async (id: string) => {
    try {
      await core_services.deleteEvent(id);
      message.success("Event deleted");
      await fetchEvents();
    } catch {
      message.error("Delete failed");
    }
  });

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const [handleBulkDelete, bulkDeleting] = useAsyncAction(async () => {
    cancelRef.current = false;
    const keys  = [...selectedRowKeys];
    const total = keys.length;
    try {
      for (let i = 0; i < total; i++) {
        if (cancelRef.current) break;
        await core_services.deleteEvent(keys[i] as string);
        setBulkProgress(Math.round(((i + 1) / total) * 100));
      }
    } catch {
      message.error("Delete failed");
    } finally {
      setSelectedRowKeys([]);
      await fetchEvents();
      setBulkProgress(0);
    }
  });

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
      render: (_: unknown, record: EventItem) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="cms-icon-tile is-sm">
            <CalendarOutlined />
          </span>
          <div style={{ minWidth: 0 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, color: CMS_COLORS.navy, display: "block" }}>
              {record.eventTitle}
            </Text>
            <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted }}>{record.location || "—"}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Timeline",
      render: (_: unknown, record: EventItem) => <DurationCell record={record} />,
    },
    {
      title: "Capacity",
      render: (_: unknown, record: EventItem) => {
        const filled = record.maxAttendent - record.currentVacany;
        const pct    = record.maxAttendent ? Math.round((filled / record.maxAttendent) * 100) : 0;
        return (
          <div style={{ minWidth: 110 }}>
            <Text style={{ fontSize: 12, color: CMS_COLORS.navy, fontWeight: 500 }}>
              {filled} / {record.maxAttendent}
            </Text>
            <Bar pct={pct} color={pct > 80 ? CMS_COLORS.danger : CMS_COLORS.primary} />
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: number) =>
        status === 1 ? <Chip tone="success">Active</Chip> : <Chip tone="neutral">Inactive</Chip>,
    },
    {
      title: "",
      width: 190,
      align: "right",
      render: (_: unknown, record: EventItem) => {
        const deleting = remove.isPending(record.id);
        return (
          <Space size={6}>
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} disabled={deleting}>
              Edit
            </Button>
            <Popconfirm
              title="Delete this event?"
              onConfirm={() => remove.run(record.id)}
              okButtonProps={{ danger: true, size: "small" }}
              cancelButtonProps={{ size: "small" }}
              disabled={deleting}
            >
              <Button size="small" icon={<DeleteOutlined />} danger loading={deleting}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Event Management"
        subtitle="Review, edit and tidy up every event published on the platform."
        actions={
          <>
            <IconButton
              label="Refresh events"
              onClick={() => void fetchEvents()}
              disabled={loading}
              aria-busy={loading}
            >
              <ReloadOutlined spin={loading} />
            </IconButton>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Create Event
            </Button>
          </>
        }
      />

      <Surface
        title="All events"
        icon={<CalendarOutlined />}
        count={filteredEvents.length}
        bodyStyle={{ padding: 0 }}
        extra={
          <>
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => void handleBulkDelete()}
                loading={bulkDeleting}
              >
                Delete {selectedRowKeys.length} selected
              </Button>
            )}
            <Input
              prefix={<SearchOutlined style={{ color: CMS_COLORS.silver }} />}
              placeholder="Search events..."
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240, maxWidth: "100%" }}
            />
          </>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredEvents}
          columns={columns}
          size="middle"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: () => ({ disabled: bulkDeleting }),
          }}
          rowClassName={(r) => (remove.isPending(r.id) ? "cms-row-busy" : "")}
          locale={{
            emptyText:
              loading || !loaded ? (
                <div style={{ height: 160 }} />
              ) : (
                <EmptyState
                  title={search ? "No matching events" : "No events yet"}
                  description={search ? "Try a different search term." : "Create an event to get started."}
                  icon={<CalendarOutlined />}
                />
              ),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted }}>{total} events</Text>,
          }}
          scroll={{ x: "max-content" }}
        />
      </Surface>

      <style>{`.cms-row-busy > td { opacity: .5; transition: opacity .2s; }`}</style>

      {/* Bulk delete progress */}
      <Modal open={bulkDeleting} footer={null} closable={false} maskClosable={false} keyboard={false} width={380}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span className="cms-icon-tile is-sm" style={{ background: CMS_COLORS.dangerBg, color: CMS_COLORS.danger }}>
            <DeleteOutlined />
          </span>
          <Text style={{ fontSize: 14, fontWeight: 700, color: CMS_COLORS.navy }}>Deleting events...</Text>
        </div>
        <Progress percent={bulkProgress} strokeColor={CMS_COLORS.primary} trailColor={CMS_COLORS.light} />
        <Button
          danger
          block
          onClick={() => { cancelRef.current = true; message.warning("Cancelled"); }}
          style={{ marginTop: 14 }}
        >
          Cancel
        </Button>
      </Modal>

      {/* Create / Edit modal */}
      <Modal
        title={editingEvent ? "Edit Event" : "Create Event"}
        open={open}
        onOk={() => void handleSubmit()}
        onCancel={handleClose}
        confirmLoading={submitting}
        okText={editingEvent ? "Save Changes" : "Create"}
        cancelButtonProps={{ disabled: submitting }}
        maskClosable={!submitting}
        closable={!submitting}
        keyboard={!submitting}
        width={480}
      >
        <Form layout="vertical" form={form} disabled={submitting}>
          <Form.Item label="Event Title" name="eventTitle" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="eventDesc" rules={[{ required: true }]}>
            <Input.TextArea rows={3} style={{ resize: "none" }} />
          </Form.Item>
          <Form.Item label="Location" name="location" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Page>
  );
};

export default EventManagement;
