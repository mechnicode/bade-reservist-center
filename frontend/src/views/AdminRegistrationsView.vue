<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12">
        <h1 class="text-h4 text-center my-8 text-primary">報名管理</h1>

        <!-- Filters -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="搜尋帳號或姓名"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedActivity"
              :items="activities"
              item-title="name"
              item-value="_id"
              label="依指定活動篩選"
              prepend-inner-icon="mdi-calendar-search"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              label="依狀態篩選"
              prepend-inner-icon="mdi-filter-variant"
              variant="outlined"
              density="compact"
              hide-details
              clearable
              class="mr-2"
            ></v-select>
            <v-btn
              color="success"
              variant="tonal"
              icon="mdi-file-export"
              title="匯出 CSV"
              @click="exportToCSV"
              :disabled="filteredRegistrations.length === 0"
            ></v-btn>
          </v-col>
        </v-row>

        <!-- Activity Progress Summary -->
        <v-expand-transition>
          <v-card v-if="selectedActivityData" class="mb-6 bg-blue-grey-lighten-5 border-dashed" variant="outlined">
            <v-card-text>
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-subtitle-1 font-weight-bold text-blue-grey-darken-3">
                  <v-icon start color="primary">mdi-chart-line</v-icon>
                  {{ selectedActivityData.name }} - 報名進度概覽
                </div>
                <div class="text-caption text-blue-grey">
                  總名額：{{ selectedActivityData.capacityLimit }} | 剩餘：{{ selectedActivityData.capacity }}
                </div>
              </div>
              <v-progress-linear
                :model-value="(selectedActivityData.totalRegs / selectedActivityData.capacityLimit) * 100"
                height="20"
                rounded
                color="primary"
                striped
              >
                <template v-slot:default="{ value }">
                  <span class="text-caption font-weight-black text-white">
                    {{ selectedActivityData.totalRegs }} / {{ selectedActivityData.capacityLimit }} ({{ Math.ceil(value) }}%)
                  </span>
                </template>
              </v-progress-linear>
              <div class="d-flex mt-2" style="gap: 20px">
                <div class="text-caption"><v-chip size="x-small" color="success" class="mr-1"></v-chip> 已通過：{{ selectedActivityData.approvedCount }}</div>
                <div class="text-caption"><v-chip size="x-small" color="info" class="mr-1"></v-chip> 待審核：{{ selectedActivityData.pendingCount }}</div>
                <div class="text-caption"><v-chip size="x-small" color="error" class="mr-1"></v-chip> 未通過：{{ selectedActivityData.totalRegs - selectedActivityData.approvedCount - selectedActivityData.pendingCount }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <v-card class="pa-6 elevation-2" shaped :loading="loading">
          <v-card-title class="headline d-flex align-center">
            <v-icon left class="mr-2">mdi-list-box</v-icon>
            所有報名紀錄
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="filteredRegistrations"
              :no-data-text="registrations.length === 0 ? '沒有報名紀錄' : '查無符合條件的紀錄'"
              class="elevation-1"
            >
              <template v-slot:[`item.user.account`]="{ item }">
                {{ item.user.account }}
              </template>
              <template v-slot:[`item.activity.name`]="{ item }">
                <v-chip
                  color="blue-grey-darken-3"
                  variant="flat"
                  size="small"
                  label
                >
                  {{ item.activity.name }}
                </v-chip>
              </template>
              <template v-slot:[`item.createdAt`]="{ item }">
                {{ new Date(item.createdAt).toLocaleDateString() }}
              </template>
              <template v-slot:[`item.status`]="{ item }">
                <v-chip :color="getRegistrationStatusColor(item.status)" dark>{{ getRegistrationStatusText(item.status) }}</v-chip>
              </template>
              <template v-slot:[`item.actions`]="{ item }">
                <v-btn
                  v-if="item.status === 0"
                  icon="mdi-check"
                  variant="text"
                  color="success"
                  size="small"
                  @click="updateStatus(item, 1)"
                  title="通過審核"
                ></v-btn>
                <v-btn
                  v-if="item.status === 0"
                  icon="mdi-close"
                  variant="text"
                  color="warning"
                  size="small"
                  @click="updateStatus(item, 2)"
                  title="拒絕報名"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  size="small"
                  @click="confirmDelete(item)"
                  title="刪除報名"
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

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">確認刪除</v-card-title>
        <v-card-text>您確定要刪除這筆報名紀錄嗎？此操作無法復原。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" text @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" text @click="deleteRegistration" :loading="deleting">刪除</v-btn>
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
import { ref, onMounted, reactive, computed } from 'vue';
import api from '@/api';

const loading = ref(true);
const errorMessage = ref('');
const registrations = ref([]);
const activities = ref([]); // Store activities for filtering
const search = ref('');
const selectedStatus = ref(null);
const selectedActivity = ref(null); // Activity filter

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});

const statusOptions = [
  { title: '待審核', value: 0 },
  { title: '已通過', value: 1 },
  { title: '未通過', value: 2 },
];

// Computed properties for filtering
const filteredRegistrations = computed(() => {
  return registrations.value.filter(reg => {
    const matchesSearch = 
      (reg.user?.account || '').toLowerCase().includes(search.value.toLowerCase()) || 
      (reg.user?.name || '').toLowerCase().includes(search.value.toLowerCase()); // Support name search
    
    const matchesStatus = selectedStatus.value !== null ? reg.status === selectedStatus.value : true;
    const matchesActivity = selectedActivity.value ? reg.activity?._id === selectedActivity.value : true;
    
    return matchesSearch && matchesStatus && matchesActivity;
  });
});

// Summary data for selected activity
const selectedActivityData = computed(() => {
  if (!selectedActivity.value) return null;
  const activity = activities.value.find(a => a._id === selectedActivity.value);
  if (!activity) return null;

  const relevantRegs = registrations.value.filter(r => r.activity?._id === selectedActivity.value);
  const approvedCount = relevantRegs.filter(r => r.status === 1).length;
  const pendingCount = relevantRegs.filter(r => r.status === 0).length;
  const totalRegs = relevantRegs.length;

  return {
    ...activity,
    approvedCount,
    pendingCount,
    totalRegs,
    // Note: in our backend, activity.capacity is "remaining spots"
    // Total spots = remaining + total registrations
    capacityLimit: activity.capacity + totalRegs
  };
});

const exportToCSV = () => {
  if (filteredRegistrations.value.length === 0) return;

  const headers = ['帳號', '姓名', '電話', '活動名稱', '報名日期', '狀態'];
  const rows = filteredRegistrations.value.map(reg => [
    reg.user?.account,
    reg.user?.name,
    `'${reg.user?.phone}`, // Force string to prevent Excel scientific notation
    reg.activity?.name,
    new Date(reg.createdAt).toLocaleDateString(),
    getRegistrationStatusText(reg.status)
  ]);

  const csvContent = [
    '\uFEFF' + headers.join(','), // Add BOM for Excel UTF-8 support
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `報名清單_${new Date().toLocaleDateString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const fetchActivities = async () => {
  try {
    const { data } = await api.get('/activities');
    activities.value = data.result;
  } catch (error) {
    console.error('Failed to fetch activities:', error);
  }
};

// Delete Dialog states
const deleteDialog = ref(false);
const deletingRegistration = reactive({ _id: '' });
const deleting = ref(false);

const headers = [
  { title: '報名者帳號', key: 'user.account' },
  { title: '活動名稱', key: 'activity.name' },
  { title: '報名日期', key: 'createdAt' },
  { title: '報名狀態', key: 'status' },
  { title: '操作', key: 'actions', sortable: false },
];

const getRegistrationStatusColor = (status) => {
  switch (status) {
    case 0: return 'info'; // 待審核
    case 1: return 'success'; // 已通過
    case 2: return 'error'; // 未通過
    default: return 'grey';
  }
};

const getRegistrationStatusText = (status) => {
  switch (status) {
    case 0: return '待審核';
    case 1: return '已通過';
    case 2: return '未通過';
    default: return '未知';
  }
};

const fetchRegistrations = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/registrations');
    registrations.value = data.result;
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
    errorMessage.value = error.response?.data?.message || '無法載入報名紀錄。';
    snackbar.text = errorMessage.value;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (item, status) => {
  loading.value = true;
  try {
    await api.patch(`/registrations/${item._id}`, { status });
    snackbar.text = status === 1 ? '已通過報名審核' : '已拒絕報名';
    snackbar.color = 'success';
    snackbar.show = true;
    fetchRegistrations(); // Refresh list
  } catch (error) {
    console.error('Failed to update status:', error);
    const msg = error.response?.data?.message || '狀態更新失敗，請稍後再試。';
    snackbar.text = msg;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

const confirmDelete = (item) => {
  Object.assign(deletingRegistration, item);
  deleteDialog.value = true;
};

const deleteRegistration = async () => {
  deleting.value = true;
  try {
    const { data } = await api.delete(`/registrations/${deletingRegistration._id}`);
    snackbar.text = data.message || '報名紀錄刪除成功！';
    snackbar.color = 'success';
    snackbar.show = true;
    deleteDialog.value = false;
    fetchRegistrations(); // Refresh list
  } catch (error) {
    console.error('Failed to delete registration:', error);
    const msg = error.response?.data?.message || '刪除失敗，請稍後再試。';
    snackbar.text = msg;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchRegistrations();
  fetchActivities();
});
</script>

<style scoped>
.v-card {
  border-left: 5px solid var(--primary); /* Custom accent */
}
.border-dashed {
  border-style: dashed !important;
  border-width: 2px !important;
  border-color: #cfd8dc !important;
}
</style>
