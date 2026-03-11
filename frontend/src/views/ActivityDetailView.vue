<template>
  <v-container class="activity-detail-container py-12">
    <div v-if="loading" class="text-center py-16">
      <v-progress-circular indeterminate color="primary" :size="60"></v-progress-circular>
      <p class="mt-4 text-medium-emphasis">正在載入活動詳情...</p>
    </div>

    <v-row v-else-if="activity">
      <!-- Activity Image & Summary -->
      <v-col cols="12" md="7">
        <v-card class="elevation-4 rounded-lg overflow-hidden">
          <v-img
            :src="activity.imageUrl || 'https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'"
            height="auto"
            max-height="450"
            min-height="250"
            aspect-ratio="16/9"
            cover
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
              </v-row>
            </template>
          </v-img>
          
          <div class="pa-6 pa-md-8">
            <div class="d-flex align-center gap-2 mb-4">
              <v-chip color="primary" label small>{{ activity.category }}</v-chip>
              <v-chip :color="getStatus().color" label small text-color="white">{{ getStatus().text }}</v-chip>
            </div>
            
            <h1 class="activity-title mb-6 text-military-blue">{{ activity.name }}</h1>
            
            <div class="activity-info-grid mb-8">
              <div class="info-item d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-calendar-clock</v-icon>
                <div>
                  <div class="text-caption text-medium-emphasis">活動日期</div>
                  <div class="text-body-1 font-weight-bold">{{ new Date(activity.eventDate).toLocaleDateString() }}</div>
                </div>
              </div>
              <div class="info-item d-flex align-center">
                <v-icon color="primary" class="mr-3">mdi-account-group</v-icon>
                <div>
                  <div class="text-caption text-medium-emphasis">剩餘名額 / 總名額</div>
                  <div class="text-body-1 font-weight-bold">{{ activity.capacity }} 位</div>
                </div>
              </div>
            </div>

            <v-divider class="mb-8"></v-divider>
            
            <h2 class="text-h5 font-weight-bold mb-4">活動介紹</h2>
            <div class="activity-description text-body-1 text-slate-600 mb-8" style="white-space: pre-wrap;">
              {{ activity.description }}
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Registration Card -->
      <v-col cols="12" md="5">
        <v-card class="registration-sidebar pa-6 elevation-4 rounded-lg" sticky>
          <h3 class="text-h5 font-weight-black mb-6">報名資訊</h3>
          
          <v-list class="mb-6 bg-transparent">
            <v-list-item prepend-icon="mdi-check-circle-outline" class="px-0">
              <v-list-item-title>官方審核</v-list-item-title>
              <v-list-item-subtitle>報名後需經輔導中心核對資料</v-list-item-subtitle>
            </v-list-item>
            <v-list-item prepend-icon="mdi-shield-check-outline" class="px-0">
              <v-list-item-title>身分限制</v-list-item-title>
              <v-list-item-subtitle>限八備區後備軍人或眷屬</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-btn
            block
            size="x-large"
            :color="getStatus().color"
            :disabled="getStatus().disabled"
            elevation="2"
            class="py-4 font-weight-black text-h6"
            @click="registerActivity"
          >
            {{ getStatus().text === '立即報名' ? '確認報名' : getStatus().text }}
          </v-btn>
          
          <p class="text-caption text-center mt-4 text-medium-emphasis">
            點擊報名即代表同意本中心活動規範與個資聲明
          </p>

          <v-divider class="my-6"></v-divider>

          <div class="contact-info">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">有任何問題？</h4>
            <div class="d-flex align-center text-body-2 mb-2">
              <v-icon size="small" class="mr-2">mdi-phone</v-icon>
              03-3644456
            </div>
            <div class="d-flex align-center text-body-2">
              <v-icon size="small" class="mr-2">mdi-map-marker</v-icon>
              桃園市桃園區介壽路322號
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-center py-16">
      <v-icon size="64" color="grey">mdi-alert-circle-outline</v-icon>
      <h2 class="text-h5 mt-4">找不到該活動</h2>
      <v-btn to="/" color="primary" class="mt-6">返回首頁</v-btn>
    </div>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" top>
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/api';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activity = ref(null);
const loading = ref(true);
const isRegistered = ref(false);

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const getStatus = () => {
  if (!activity.value) return { text: '載入中', color: 'grey', disabled: true };
  
  const now = new Date();
  const eventDate = new Date(activity.value.eventDate);

  if (isRegistered.value) return { text: '您已報名此活動', color: 'info', disabled: true };
  if (eventDate < now) return { text: '活動已結束', color: 'grey', disabled: true };
  if (!activity.value.sell) return { text: '暫停報名', color: 'warning', disabled: true };
  if (activity.value.capacity <= 0) return { text: '活動已額滿', color: 'error', disabled: true };

  return { text: '立即報名', color: 'primary', disabled: false };
};

const fetchActivityDetail = async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/activities/${route.params.id}`);
    if (data.success) {
      activity.value = data.result;
      
      // Check if user is already registered
      if (userStore.isLoggedIn) {
        const { data: regData } = await api.get('/registrations/me');
        if (regData.success) {
          isRegistered.value = regData.result.some(r => r.activity?._id === activity.value._id);
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch activity detail:', error);
  } finally {
    loading.value = false;
  }
};

const registerActivity = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login');
    return;
  }

  try {
    await api.post('/registrations', { activity: activity.value._id });
    snackbar.text = '報名成功！請等待管理員審核。';
    snackbar.color = 'success';
    snackbar.show = true;
    isRegistered.value = true;
    activity.value.capacity -= 1; // UI instant feedback
  } catch (error) {
    const msg = error.response?.data?.message || '報名失敗';
    snackbar.text = msg;
    snackbar.color = 'error';
    snackbar.show = true;
  }
};

onMounted(fetchActivityDetail);
</script>

<style scoped>
.activity-detail-container {
  max-width: 1200px;
}
.text-military-blue {
  color: #0f172a;
}
.activity-title {
  font-size: clamp(1.75rem, 5vw, 3rem);
  font-weight: 900;
  line-height: 1.2;
}
.activity-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}
.activity-description {
  line-height: 1.8;
  font-size: 1.1rem;
}
.registration-sidebar {
  border-top: 5px solid var(--primary);
  position: sticky;
  top: 110px;
}
.text-slate-600 {
  color: #475569;
}
</style>
