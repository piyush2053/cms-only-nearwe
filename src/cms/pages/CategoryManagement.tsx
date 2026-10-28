import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, Popconfirm, message, Space, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  AppstoreOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { core_services } from "../../utils/api";
import { CMS_COLORS } from "../cmstheme";
import { Page, PageHeader, Surface, EmptyState, IconButton } from "../../components/ui";
import { useAsyncAction, useKeyedAction } from "../../hooks/useAsyncAction";

const { Text } = Typography;

interface Category {
  CategoryId: number;
  CategoryName: string;
  CategoryDesc: string;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const [fetchCategories, loading] = useAsyncAction(async () => {
    try {
      const res = await core_services.getCategories();
      setCategories(res);
    } catch {
      message.error("Failed to load categories");
    } finally {
      setLoaded(true);
    }
  }, { queue: true });

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  const [handleSubmit, submitting] = useAsyncAction(async () => {
    let values: { CategoryName: string; CategoryDesc: string };
    try {
      values = await form.validateFields();
    } catch {
      return; // inline field errors are shown by the form
    }
    try {
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
      await fetchCategories();
    } catch {
      message.error("Operation failed");
    }
  });

  const remove = useKeyedAction(async (id: number) => {
    try {
      await core_services.deleteCategory(String(id));
      message.success("Category deleted");
      await fetchCategories();
    } catch {
      message.error("Delete failed");
    }
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue(category);
    setOpen(true);
  };

  const openCreate = () => {
    form.resetFields();
    setEditingCategory(null);
    setOpen(true);
  };

  const columns: ColumnsType<Category> = [
    {
      title: "ID",
      dataIndex: "CategoryId",
      width: 80,
      render: (id: number) => (
        <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted, fontFamily: "monospace" }}>#{id}</Text>
      ),
    },
    {
      title: "Name",
      dataIndex: "CategoryName",
      render: (name: string) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="cms-icon-tile is-sm">
            <AppstoreOutlined />
          </span>
          <Text style={{ fontSize: 13, fontWeight: 600, color: CMS_COLORS.navy }}>{name}</Text>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "CategoryDesc",
      render: (desc: string) =>
        desc ? (
          <Text style={{ fontSize: 12, color: CMS_COLORS.textSecondary }}>{desc}</Text>
        ) : (
          <Text style={{ fontSize: 12, color: CMS_COLORS.textMuted, fontStyle: "italic" }}>No description</Text>
        ),
    },
    {
      title: "",
      width: 190,
      align: "right",
      render: (_: unknown, record: Category) => {
        const deleting = remove.isPending(record.CategoryId);
        return (
          <Space size={6}>
            <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} disabled={deleting}>
              Edit
            </Button>
            <Popconfirm
              title="Delete category?"
              description="This action cannot be undone."
              onConfirm={() => remove.run(record.CategoryId)}
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
        title="Category Management"
        subtitle="Organise events into categories that people can browse and filter by."
        actions={
          <>
            <IconButton
              label="Refresh categories"
              onClick={() => void fetchCategories()}
              disabled={loading}
              aria-busy={loading}
            >
              <ReloadOutlined spin={loading} />
            </IconButton>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Category
            </Button>
          </>
        }
      />

      <Surface
        title="All categories"
        icon={<AppstoreOutlined />}
        count={categories.length}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          rowKey="CategoryId"
          dataSource={categories}
          columns={columns}
          loading={loading}
          size="middle"
          scroll={{ x: "max-content" }}
          rowClassName={(r) => (remove.isPending(r.CategoryId) ? "cms-row-busy" : "")}
          locale={{
            emptyText:
              loading || !loaded ? (
                <div style={{ height: 160 }} />
              ) : (
                <EmptyState
                  title="No categories yet"
                  description="Create your first category to start organising events."
                  icon={<AppstoreOutlined />}
                  action={
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                      Add Category
                    </Button>
                  }
                />
              ),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => (
              <Text style={{ fontSize: 11, color: CMS_COLORS.textMuted }}>{total} categories</Text>
            ),
          }}
        />
      </Surface>

      <style>{`.cms-row-busy > td { opacity: .5; transition: opacity .2s; }`}</style>

      <Modal
        title={editingCategory ? "Edit Category" : "Add Category"}
        open={open}
        onOk={() => void handleSubmit()}
        onCancel={handleClose}
        confirmLoading={submitting}
        okText={editingCategory ? "Save Changes" : "Create"}
        cancelButtonProps={{ disabled: submitting }}
        maskClosable={!submitting}
        closable={!submitting}
        keyboard={!submitting}
        width={460}
      >
        <Form layout="vertical" form={form} disabled={submitting}>
          <Form.Item
            label="Category Name"
            name="CategoryName"
            rules={[{ required: true, message: "Please enter a category name" }]}
          >
            <Input placeholder="e.g. Technology, Sports, Culture" />
          </Form.Item>

          <Form.Item label="Description" name="CategoryDesc">
            <Input.TextArea
              rows={3}
              placeholder="Brief description of this category..."
              style={{ resize: "none" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Page>
  );
};

export default CategoryManagement;
