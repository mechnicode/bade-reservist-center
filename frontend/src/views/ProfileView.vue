<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h4 text-center my-8 text-primary">個人資料</h1>

        <v-card class="pa-6 elevation-2 mb-8" shaped :loading="loading">
          <v-card-title class="headline d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon left class="mr-2">mdi-account-circle</v-icon>
              {{ profile.account }} 的個人檔案
            </div>
            <v-btn
              v-if="!isEditing"
              icon="mdi-pencil"
              variant="text"
              color="primary"
              @click="startEdit"
              title="編輯資料"
            ></v-btn>
          </v-card-title>
          <v-card-text>
            <v-list dense>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">帳號:</v-list-item-title>
                  <v-list-item-subtitle>{{ profile.account }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <!-- Name Field -->
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">姓名:</v-list-item-title>
                  <v-text-field
                    v-if="isEditing"
                    v-model="profile.name"
                    label="姓名"
                    variant="outlined"
                    density="compact"
                    hide-details
                  ></v-text-field>
                  <v-list-item-subtitle v-else>{{ profile.name || '未填寫' }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <!-- Phone Field -->
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">電話:</v-list-item-title>
                  <v-text-field
                    v-if="isEditing"
                    v-model="profile.phone"
                    label="電話"
                    variant="outlined"
                    density="compact"
                    hide-details
                  ></v-text-field>
                  <v-list-item-subtitle v-else>{{ profile.phone || '未填寫' }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <!-- Military Branch Field -->
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">軍種:</v-list-item-title>
                  <v-select
                    v-if="isEditing"
                    v-model="profile.militaryBranch"
                    :items="militaryBranches"
                    label="選擇軍種"
                    variant="outlined"
                    density="compact"
                    hide-details
                  ></v-select>
                  <v-list-item-subtitle v-else>{{ profile.militaryBranch || '未填寫' }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <!-- Rank Field -->
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">階級:</v-list-item-title>
                  <v-select
                    v-if="isEditing"
                    v-model="profile.rank"
                    :items="militaryRanks"
                    label="選擇階級"
                    variant="outlined"
                    density="compact"
                    hide-details
                  ></v-select>
                  <v-list-item-subtitle v-else>{{ profile.rank || '未填寫' }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <!-- Role Field (always read-only) -->
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="font-weight-bold">角色:</v-list-item-title>
                  <v-list-item-subtitle>{{ profile.role === 1 ? '管理員' : '一般使用者' }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

            </v-list>
          </v-card-text>
          <v-card-actions class="px-6 pb-6">
            <v-alert v-if="errorMessage" type="error" dense dismissible>{{ errorMessage }}</v-alert>
            <v-spacer></v-spacer>
            <v-btn v-if="isEditing" color="secondary" variant="outlined" @click="cancelEdit" :disabled="loading">取消</v-btn>
            <v-btn v-if="isEditing" color="primary" variant="flat" @click="saveProfile" :loading="loading">儲存</v-btn>
          </v-card-actions>
        </v-card>

        <!-- Registration History Section -->
        <v-card class="pa-6 elevation-2" shaped :loading="loadingRegistrations">
          <v-card-title class="headline d-flex align-center">
            <v-icon left class="mr-2">mdi-list-box</v-icon>
            我的報名紀錄
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="registrationHeaders"
              :items="registrationsHistory"
              :no-data-text="registrationsHistory.length === 0 ? '沒有報名紀錄' : '載入中...'"
              class="elevation-1"
            >
                          <template v-slot:[`item.activity.name`]="{ item }">
                            {{ item.activity.name }}
                          </template>
              
              <template v-slot:[`item.activity.eventDate`]="{ item }">
                {{ new Date(item.activity.eventDate).toLocaleDateString() }}
              </template>
              <template v-slot:[`item.status`]="{ item }">
                <v-chip :color="getRegistrationStatusColor(item.status)" dark>{{ getRegistrationStatusText(item.status) }}</v-chip>
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions v-if="errorMessageRegistrations">
            <v-alert type="error" dense dismissible>{{ errorMessageRegistrations }}</v-alert>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" top>
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import api from '@/api';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const loading = ref(true); // Initial loading for fetching profile
const loadingRegistrations = ref(true); // Loading for fetching registrations
const errorMessage = ref(''); // Error for profile
const errorMessageRegistrations = ref(''); // Error for registrations
const isEditing = ref(false);

const profile = reactive({
  account: '',
  name: '',
  phone: '',
  militaryBranch: '',
  rank: '',
  role: 0,
});

const originalProfile = reactive({}); // To store original data for cancellation

const registrationsHistory = ref([]);

const militaryBranches = ['陸軍', '海軍', '海軍陸戰隊', '空軍'];
const militaryRanks = [
  '二等兵', '一等兵', '上等兵', '下士', '中士', '上士', 
  '三等士官長', '二等士官長', '一等士官長', 
  '少尉', '中尉', '上尉', '少校', '中校', '上校', 
  '少將', '中將', '上將'
];

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});

const registrationHeaders = [
  { title: '活動名稱', key: 'activity.name' },
  { title: '活動日期', key: 'activity.eventDate' },
  { title: '報名狀態', key: 'status' },
  { title: '報名時間', key: 'createdAt', sortable: false },
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


const fetchProfile = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/users/profile');
    Object.assign(profile, data.result);
    Object.assign(originalProfile, data.result);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    errorMessage.value = error.response?.data?.message || '無法載入個人資料。';
  } finally {
    loading.value = false;
  }
};

const fetchRegistrations = async () => {
  loadingRegistrations.value = true;
  errorMessageRegistrations.value = '';
  try {
    const { data } = await api.get('/registrations/me');
    registrationsHistory.value = data.result;
  } catch (error) {
    console.error('Failed to fetch registrations:', error);
    errorMessageRegistrations.value = error.response?.data?.message || '無法載入報名紀錄。';
  } finally {
    loadingRegistrations.value = false;
  }
};

const startEdit = () => {
  Object.assign(originalProfile, profile);
  isEditing.value = true;
};

const cancelEdit = () => {
  Object.assign(profile, originalProfile);
  isEditing.value = false;
  errorMessage.value = '';
};

const saveProfile = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { name, phone, militaryBranch, rank } = profile;
    const { data } = await api.patch('/users/profile', { name, phone, militaryBranch, rank });
    Object.assign(profile, data.result);
    snackbar.text = data.message || '個人資料更新成功！';
    snackbar.color = 'success';
    snackbar.show = true;
    isEditing.value = false;
  } catch (error) {
    console.error('Failed to save profile:', error);
    errorMessage.value = error.response?.data?.message || '儲存失敗，請稍後再試。';
    snackbar.text = errorMessage.value;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (!userStore.isLoggedIn) {
    errorMessage.value = '請先登入才能查看個人資料。';
    loading.value = false;
    loadingRegistrations.value = false; // Also stop loading registrations
    return;
  }
  fetchProfile();
  fetchRegistrations(); // Fetch registrations when component mounts
});
</script>

<style scoped>
.v-card {
  border-left: 5px solid var(--primary); /* Custom accent */
}
</style>