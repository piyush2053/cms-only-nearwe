import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Space,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AppstoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { core_services } from "../../utils/api";

const { Text } = Typography;

const INDIGO = "#3F51B5";

interface Category {
  CategoryId: number;
  CategoryName: string;
  CategoryDesc: string;
}

const CategoryManagement: React.FC = () => {
  

  const [categories, setCategories]     = useState<Category[]>([]);
  const [loading, setLoading]           = useState(false);
  const [open, setOpen]                 = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await core_services.getCategories();
      setCategories(res);
    } catch {
      message.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingCategory) {
        await core_services.updateCategory(String(editingCategory.CategoryId), {
          categoryName: values.CategoryName,
          categoryDesc: values.CategoryDesc,
        });
        message.success("Category updated successfully");
      } else {
        await core_services.createCategory({
          categoryName: values.CategoryName,
          categoryDesc: values.CategoryDesc,
        });
        message.success("Category created successfully");
      }

      handleClose();
      fetchCategories();
    } catch {
      message.error("Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await core_services.deleteCategory(String(id));
      message.success("Category deleted");
      fetchCategories();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const columns: ColumnsType<Category> = [
    {
      title: "ID",
      dataIndex: "CategoryId",
      width: 70,
      render: (id: number) => (
        <Text style={{ fontSize: 11, color: "#BDBDBD", fontFamily: "monospace" }}>#{id}</Text>
      ),
    },
    {
      title: "Name",
      dataIndex: "CategoryName",
      render: (name: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "#E8EAF6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AppstoreOutlined style={{ fontSize: 14, color: INDIGO }} />
          </div>
          <Text style={{ fontSize: 13, fontWeight: 600, color: "#212121" }}>{name}</Text>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "CategoryDesc",
      render: (desc: string) => (
        <Text style={{ fontSize: 12, color: "#757575" }}>
          {desc || <span style={{ color: "#BDBDBD", fontStyle: "italic" }}>No description</span>}
        </Text>
      ),
    },
    {
      title: "",
      width: 130,
      render: (_: any, record: Category) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{
              color: INDIGO,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              background: "#E8EAF6",
              border: "none",
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete category?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.CategoryId)}
            okButtonProps={{ danger: true, size: "small" }}
            cancelButtonProps={{ size: "small" }}
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              style={{ borderRadius: 8, fontSize: 12, fontWeight: 500 }}
            >
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
        style={{
          borderRadius: 16,
          border: "1px solid #E3E6F0",
          boxShadow: "0 2px 12px rgba(63,81,181,0.08)",
          overflow: "hidden",
        }}
        styles={{
          header: {
            borderBottom: "1px solid #F5F5F5",
            padding: "0 24px",
            minHeight: 60,
            background: "#FFFFFF",
          },
          body: { padding: 0 },
        }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "#E8EAF6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppstoreOutlined style={{ color: INDIGO, fontSize: 15 }} />
            </div>
            <Text style={{ fontSize: 15, fontWeight: 700, color: "#212121" }}>
              Category Management
            </Text>
            <span
              style={{
                background: "#E8EAF6",
                color: INDIGO,
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 9px",
                borderRadius: 20,
              }}
            >
              {categories.length}
            </span>
          </div>
        }
        extra={
          <Space size={8}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCategories}
              loading={loading}
              style={{ borderRadius: 10 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { form.resetFields(); setEditingCategory(null); setOpen(true); }}
              style={{
                borderRadius: 10,
                background: INDIGO,
                boxShadow: "0 4px 12px rgba(63,81,181,0.30)",
                fontWeight: 600,
              }}
            >
              Add Category
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="CategoryId"
          dataSource={categories}
          columns={columns}
          loading={loading}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => (
              <Text style={{ fontSize: 11, color: "#9E9E9E" }}>{total} categories</Text>
            ),
          }}
          rowClassName={() => "cms-table-row"}
          style={{ borderRadius: 0 }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={
          <div style={{ fontSize: 15, fontWeight: 700, color: "#212121" }}>
            {editingCategory ? "Edit Category" : "Add Category"}
          </div>
        }
        open={open}
        onOk={handleSubmit}
        onCancel={handleClose}
        confirmLoading={submitting}
        okText={editingCategory ? "Save Changes" : "Create"}
        okButtonProps={{
          style: {
            background: INDIGO,
            borderRadius: 10,
            fontWeight: 600,
            boxShadow: "0 4px 12px rgba(63,81,181,0.30)",
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 10 } }}
        width={460}
        styles={{ body: { paddingTop: 20 } }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label={<span style={{ fontSize: 12, fontWeight: 600, color: "#424242" }}>Category Name</span>}
            name="CategoryName"
            rules={[{ required: true, message: "Please enter a category name" }]}
          >
            <Input
              placeholder="e.g. Technology, Sports, Culture"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 12, fontWeight: 600, color: "#424242" }}>Description</span>}
            name="CategoryDesc"
          >
            <Input.TextArea
              rows={3}
              placeholder="Brief description of this category..."
              style={{ borderRadius: 10, resize: "none" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CategoryManagement;