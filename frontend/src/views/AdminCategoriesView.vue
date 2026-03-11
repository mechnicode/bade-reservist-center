<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12">
        <h1 class="text-h4 text-center my-8 text-primary">分類管理</h1>

        <v-card class="pa-6 elevation-2" shaped :loading="loading">
          <v-card-title class="headline d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon left class="mr-2">mdi-shape</v-icon>
              所有分類
            </div>
            <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus">
              新增分類
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="categories"
              :no-data-text="categories.length === 0 ? '沒有分類資料' : '載入中...'"
              class="elevation-1"
            >
              <template v-slot:[`item.createdAt`]="{ item }">
                {{ new Date(item.createdAt).toLocaleDateString() }}
              </template>
              <template v-slot:[`item.actions`]="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  color="primary"
                  size="small"
                  @click="openDialog(item)"
                  title="編輯分類"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  size="small"
                  @click="openDeleteDialog(item)"
                  title="刪除分類"
                ></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions v-if="errorMessage">
            <v-alert type="error" dense dismissible>{{ errorMessage }}</v-alert>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog for Add/Edit Category -->
    <v-dialog v-model="dialog" persistent max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '編輯分類' : '新增分類' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="submitForm">
            <v-text-field
              v-model="form.name"
              label="分類名稱"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-3"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" text @click="closeDialog">取消</v-btn>
          <v-btn color="primary" :loading="saving" @click="submitForm">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">確認刪除</v-card-title>
        <v-card-text>
          您確定要刪除分類 <strong>{{ categoryToDelete?.name }}</strong> 嗎？此操作無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" text @click="closeDeleteDialog">取消</v-btn>
          <v-btn color="error" text @click="confirmDelete" :loading="deleting">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" top>
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import api from '@/api';

const loading = ref(true);
const errorMessage = ref('');
const categories = ref([]);

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});

// Dialog states
const dialog = ref(false);
const isEditing = ref(false);
const formRef = ref(null);
const form = reactive({ name: '' });
const currentCategoryId = ref(null);
const saving = ref(false);

// Delete Dialog states
const deleteDialog = ref(false);
const categoryToDelete = ref(null);
const deleting = ref(false);

const headers = [
  { title: '分類名稱', key: 'name' },
  { title: '建立時間', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false },
];

const rules = {
  required: value => !!value || '此欄位為必填',
};

const fetchCategories = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/categories');
    categories.value = data.result;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    errorMessage.value = error.response?.data?.message || '無法載入分類資料。';
    snackbar.text = errorMessage.value;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

const openDialog = (category = null) => {
  if (category) {
    isEditing.value = true;
    currentCategoryId.value = category._id;
    form.name = category.name;
  } else {
    isEditing.value = false;
    currentCategoryId.value = null;
    form.name = '';
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
  formRef.value?.resetValidation();
};

const submitForm = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (isEditing.value) {
      await api.patch(`/categories/${currentCategoryId.value}`, { name: form.name });
      snackbar.text = '分類更新成功';
    } else {
      await api.post('/categories', { name: form.name });
      snackbar.text = '分類新增成功';
    }
    snackbar.color = 'success';
    snackbar.show = true;
    closeDialog();
    fetchCategories();
  } catch (error) {
    console.error('Failed to save category:', error);
    const msg = error.response?.data?.message || '操作失敗';
    snackbar.text = msg;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    saving.value = false;
  }
};

const openDeleteDialog = (category) => {
  categoryToDelete.value = category;
  deleteDialog.value = true;
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  categoryToDelete.value = null;
};

const confirmDelete = async () => {
  if (!categoryToDelete.value) return;

  deleting.value = true;
  try {
    await api.delete(`/categories/${categoryToDelete.value._id}`);
    snackbar.text = '分類已刪除';
    snackbar.color = 'success';
    snackbar.show = true;
    closeDeleteDialog();
    fetchCategories();
  } catch (error) {
    console.error('Failed to delete category:', error);
    const msg = error.response?.data?.message || '刪除失敗，請稍後再試。';
    snackbar.text = msg;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchCategories();
});
</script>

<style scoped>
.v-card {
  border-left: 5px solid var(--primary); /* Custom accent */
}
</style>
