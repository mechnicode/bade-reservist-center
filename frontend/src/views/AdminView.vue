<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import api from '@/api';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

// Reactive state
const activities = ref([]);
const categories = ref([]); // Store categories
const search = ref(''); // Search text
const selectedCategory = ref(null); // Category filter
const stats = ref({
  users: 0,
  activities: 0,
  registrations: 0,
  categories: 0,
  registrationStatus: {}
});
const loading = ref(false);
const dialog = ref(false);
const isEditing = ref(false);
const formRef = ref(null);
const currentActivityId = ref(null);

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

// Chart Data
const chartData = computed(() => {
  const statusData = stats.value.registrationStatus || {};
  return {
    labels: ['待審核', '已通過', '未通過'],
    datasets: [
      {
        backgroundColor: ['#3ABEF9', '#059212', '#C40C0C'],
        data: [
          statusData[0] || 0,
          statusData[1] || 0,
          statusData[2] || 0
        ]
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    }
  }
};

// Computed properties for filtering
const filteredActivities = computed(() => {
  return activities.value.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(search.value.toLowerCase());
    const matchesCategory = selectedCategory.value ? activity.category === selectedCategory.value : true;
    return matchesSearch && matchesCategory;
  });
});

const form = reactive({
  name: '',
  description: '',
  category: '',
  capacity: null,
  eventDate: '',
  image: null,
});

// Validation rules (content from original file, but might need translation)
const rules = {
  required: value => !!value || '此欄位為必填',
  positive: value => value > 0 || '必須是正數',
};

// Table headers
const headers = [
  { title: '名稱', key: 'name' },
  { title: '分類', key: 'category' },
  { title: '日期', key: 'eventDate' },
  { title: '名額', key: 'capacity' },
  { title: '操作', key: 'actions', sortable: false },
];

// Fetch dashboard stats
const fetchStats = async () => {
  try {
    const { data } = await api.get('/stats');
    if (data.success) {
      stats.value = data.result;
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }
};

// Fetch activities from the server
const fetchActivities = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/activities');
    if (data.success) {
      activities.value = data.result.map(activity => ({
        ...activity,
        // Format date for display
        eventDate: new Date(activity.eventDate).toLocaleDateString(),
      }));
    }
  } catch (error) {
    snackbar.text = '無法載入活動資料';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const { data } = await api.get('/categories');
    categories.value = data.result.map(c => c.name);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};

// Lifecycle hook
onMounted(() => {
  fetchActivities();
  fetchCategories();
  fetchStats();
});

// Functions to handle dialog and form
const openDialog = (activity = null) => {
  if (activity) {
    // Edit mode
    isEditing.value = true;
    currentActivityId.value = activity._id;
    form.name = activity.name;
    form.description = activity.description;
    form.category = activity.category;
    form.capacity = activity.capacity;
    // Format date for the input field
    form.eventDate = activity.eventDate.split('/').reverse().join('-');
    form.image = null; // Image is handled separately
  } else {
    // Create mode
    isEditing.value = false;
    currentActivityId.value = null;
    formRef.value?.reset(); // Reset validation and fields
    Object.assign(form, {
      name: '',
      description: '',
      category: '',
      capacity: null,
      eventDate: '',
      image: null,
    });
  }
  dialog.value = true;
};

const closeDialog = () => {
  dialog.value = false;
};

const submitForm = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;

  const formData = new FormData();
  formData.append('name', form.name);
  formData.append('description', form.description);
  formData.append('category', form.category);
  formData.append('capacity', form.capacity);
  formData.append('eventDate', form.eventDate);
  if (form.image && form.image.length > 0) {
    formData.append('image', form.image[0]);
  }

  try {
    if (isEditing.value) {
      // Update existing activity
      await api.patch(`/activities/${currentActivityId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      snackbar.text = '活動更新成功';
    } else {
      // Create new activity
      await api.post('/activities', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      snackbar.text = '活動新增成功';
    }
    snackbar.color = 'success';
    snackbar.show = true;
    closeDialog();
    fetchActivities(); // Refresh table
  } catch (error) {
    const errorMessage = error.response?.data?.message || '操作失敗';
    snackbar.text = `錯誤: ${errorMessage}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

const deleteDialog = ref(false);
const activityToDelete = ref(null);

const openDeleteDialog = (activity) => {
  activityToDelete.value = activity;
  deleteDialog.value = true;
};

const closeDeleteDialog = () => {
  deleteDialog.value = false;
  activityToDelete.value = null;
};

const confirmDelete = async () => {
  if (!activityToDelete.value) return;

  loading.value = true;
  try {
    await api.delete(`/activities/${activityToDelete.value._id}`);
    snackbar.text = '活動已刪除';
    snackbar.color = 'success';
    snackbar.show = true;
    closeDeleteDialog();
    fetchActivities(); // Refresh table
  } catch (error) {
    const errorMessage = error.response?.data?.message || '刪除失敗';
    snackbar.text = `錯誤: ${errorMessage}`;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};


</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4">數據總覽</h1>
      <v-btn color="primary" @click="openDialog(null)" prepend-icon="mdi-plus">
        新增活動
      </v-btn>
    </div>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="mx-auto" prepend-icon="mdi-account-group" title="總會員數">
          <v-card-text class="text-h4 font-weight-bold">
            {{ stats.users }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mx-auto" prepend-icon="mdi-calendar-check" title="活動總數">
          <v-card-text class="text-h4 font-weight-bold">
            {{ stats.activities }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mx-auto" prepend-icon="mdi-clipboard-text" title="報名總人次">
          <v-card-text class="text-h4 font-weight-bold">
            {{ stats.registrations }}
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mx-auto" prepend-icon="mdi-tag" title="分類數">
          <v-card-text class="text-h4 font-weight-bold">
            {{ stats.categories }}
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Section -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100" title="報名狀態分佈">
          <div style="height: 300px;">
            <Pie :data="chartData" :options="chartOptions" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100" title="系統公告">
          <v-list lines="two">
            <v-list-item
              prepend-icon="mdi-information"
              title="歡迎使用管理系統"
              subtitle="您可以在此管理活動、審核報名以及查看統計數據。"
            ></v-list-item>
            <v-divider></v-divider>
            <v-list-item
              prepend-icon="mdi-alert"
              title="分類更新提示"
              subtitle="刪除分類前請確保沒有活動正在使用該分類。"
            ></v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <h2 class="text-h5 mb-4">活動列表</h2>
    
    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          label="搜尋活動名稱"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="selectedCategory"
          :items="categories"
          label="依分類篩選"
          prepend-inner-icon="mdi-filter-variant"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        ></v-select>
      </v-col>
    </v-row>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredActivities"
        :loading="loading"
        class="elevation-1"
        item-value="_id"
      >
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@5"></v-skeleton-loader>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn icon="mdi-pencil" variant="text" color="primary" @click="openDialog(item)"></v-btn>
          <v-btn icon="mdi-delete" variant="text" color="error" @click="openDeleteDialog(item)"></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog for Add/Edit Activity -->
    <v-dialog v-model="dialog" persistent max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? '編輯活動' : '新增活動' }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-text-field
              v-model="form.name"
              label="活動名稱"
              :rules="[rules.required]"
              variant="outlined" class="mb-3"
            ></v-text-field>
            <v-textarea
              v-model="form.description"
              label="活動描述"
              :rules="[rules.required]"
              variant="outlined" class="mb-3"
            ></v-textarea>
            <v-select
              v-model="form.category"
              :items="categories"
              label="活動分類"
              :rules="[rules.required]"
              variant="outlined" class="mb-3"
            ></v-select>
            <v-text-field
              v-model.number="form.capacity"
              label="名額"
              type="number"
              :rules="[rules.required, rules.positive]"
              variant="outlined" class="mb-3"
            ></v-text-field>
            <v-text-field
              v-model="form.eventDate"
              label="活動日期"
              type="date"
              :rules="[rules.required]"
              variant="outlined" class="mb-3"
            ></v-text-field>
            <v-file-input
              v-model="form.image"
              label="活動圖片"
              accept="image/*"
              :rules="isEditing ? [] : [rules.required]"
              prepend-icon="mdi-camera"
              variant="outlined" class="mb-3"
            ></v-file-input>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" text @click="closeDialog">取消</v-btn>
          <v-btn color="primary" :loading="loading" @click="submitForm">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" persistent max-width="400px">
      <v-card>
        <v-card-title class="text-h5">確認刪除</v-card-title>
        <v-card-text>
          您確定要刪除活動 <strong>{{ activityToDelete?.name }}</strong> 嗎？此操作無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" text @click="closeDeleteDialog">取消</v-btn>
          <v-btn color="red-darken-1" :loading="loading" @click="confirmDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" top>
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
/* Optional: Add some spacing */
.v-container {
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>