<script setup>
import { ref, onMounted, reactive, computed } from "vue";
import api from "@/api";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

const userStore = useUserStore();
const router = useRouter();
const { xs } = useDisplay();

const scrollToActivities = () => {
  const el = document.getElementById("latest-activities");
  if (el) {
    const headerHeight = 90;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
};

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});

const registerForActivity = async (activityId) => {
  if (!userStore.isLoggedIn) {
    router.push("/login");
    return;
  }

  try {
    await api.post("/registrations", { activity: activityId });
    snackbar.text = "報名成功！";
    snackbar.color = "success";
    snackbar.show = true;
  } catch (error) {
    const errorMessage = error.response?.data?.message || "報名失敗，請稍後再試";
    snackbar.text = `錯誤: ${errorMessage}`;
    snackbar.color = "error";
    snackbar.show = true;
  }
};

// 預設的活動圖片
const activityImages = [
  "https://images.pexels.com/photos/442150/pexels-photo-442150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // 健行
  "https://images.pexels.com/photos/1106468/pexels-photo-1106468.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", // 講座
  "https://as2.ftcdn.net/v2/jpg/02/03/34/35/1000_F_203343538_5dDildsISbC1q55qD2N0sC1vGadh6zBU.jpg", // 親子
];

const defaultCarousel = [
  {
    src: "https://images.pexels.com/photos/163834/military-army-soldiers-soldiers-163834.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    pretitle: "Unity & Defense",
    title: "團結一致<br/><span class='hero-title-highlight'>保家衛國</span>",
    subtitle: "加入我們的行列，共同守護家園，建立強韌的國防後盾。",
  },
];

// 輪播圖資料
const carouselItems = ref([]);
const carouselModel = ref(0);
const carouselLoading = ref(true);

// 分類與搜尋
const categories = ref([{ _id: "all", name: "全部活動" }]);
const selectedCategory = ref("全部活動");
const searchQuery = ref("");
const loading = ref(true);

// 使用者已報名資料
const userRegistrations = ref([]);

// 活動列表資料
const activities = ref([]);

// 過濾後的活動列表
const filteredActivities = computed(() => {
  return activities.value.filter((activity) => {
    const matchCategory =
      selectedCategory.value === "全部活動" || activity.category === selectedCategory.value;
    const name = activity.name || "";
    const description = activity.description || "";
    const search = searchQuery.value.toLowerCase();

    const matchSearch =
      name.toLowerCase().includes(search) || description.toLowerCase().includes(search);
    return matchCategory && matchSearch;
  });
});

// 判斷活動狀態
const getActivityStatus = (activity) => {
  const now = new Date();
  const eventDate = new Date(activity.eventDate);

  if (userRegistrations.value.some((r) => r.activity?._id === activity._id))
    return { text: "已報名", color: "info", disabled: true };
  if (eventDate < now) return { text: "已結束", color: "grey", disabled: true };
  if (!activity.sell) return { text: "暫停報名", color: "warning", disabled: true };
  if (activity.capacity <= 0) return { text: "已額滿", color: "error", disabled: true };

  return { text: "立即報名", color: "primary", disabled: false };
};

onMounted(async () => {
  // 1. 獨立獲取輪播圖資料，確保不受其他 API 失敗影響
  try {
    const carRes = await api.get("/carousel?activeOnly=true");
    if (carRes.data.success && carRes.data.result.length > 0) {
      carouselItems.value = carRes.data.result.map((item) => ({
        src: item.image,
        pretitle: item.pretitle,
        title: item.title,
        subtitle: item.subtitle,
      }));
    } else {
      carouselItems.value = defaultCarousel;
    }
  } catch (error) {
    console.error("輪播圖載入失敗:", error);
    carouselItems.value = defaultCarousel;
  } finally {
    carouselLoading.value = false;
  }

  // 2. 獲取其他頁面資料
  try {
    const [actRes, catRes] = await Promise.all([api.get("/activities"), api.get("/categories")]);

    if (actRes.data.success) {
      activities.value = actRes.data.result;
    }

    if (catRes.data.success) {
      categories.value = [{ _id: "all", name: "全部活動" }, ...catRes.data.result];
    }

    if (userStore.isLoggedIn) {
      const { data: regData } = await api.get("/registrations/me");
      if (regData.success) {
        userRegistrations.value = regData.result;
      }
    }
  } catch (error) {
    console.error("無法獲取活動資料:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="home-view-container">
    <!-- Hero Carousel Section -->
    <v-carousel
      v-model="carouselModel"
      cycle
      :height="xs ? 500 : 600"
      hide-delimiter-background
      show-arrows="hover"
      class="hero-section"
      :key="carouselItems.length"
      :loading="carouselLoading"
    >
      <v-carousel-item v-for="(item, i) in carouselItems" :key="i" :src="item.src" cover>
        <v-container class="hero-content fill-height">
          <v-row align="center" justify="center" justify-md="start">
            <v-col cols="12" md="10" lg="9">
              <div class="hero-card pa-6 pa-md-8 rounded-lg">
                <div class="d-flex align-center gap-3 mb-6">
                  <span class="section-heading-line"></span>
                  <span class="hero-subtitle">{{ item.pretitle }}</span>
                </div>
                <h1 class="hero-title mb-8" v-html="item.title"></h1>
                <p class="hero-text mb-10">
                  {{ item.subtitle }}
                </p>
                <v-btn class="hero-btn" size="x-large" variant="flat" @click="scrollToActivities">
                  查看更多活動
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-container>
      </v-carousel-item>
    </v-carousel>

    <!-- About Section -->
    <section class="about-section py-16">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8" class="text-center">
            <p class="about-subtitle mb-4">Bade District</p>
            <h2 class="about-title mb-8">八德區後備軍人輔導中心</h2>
            <div class="d-flex justify-center align-center gap-2 mb-10">
              <div class="divider-line-short"></div>
              <div class="divider-line-long"></div>
              <div class="divider-line-short"></div>
            </div>
            <p class="about-text">
              本中心致力於連結後備夥伴，強化動員準備，並積極參與社區服務。我們秉持「專業、服務、榮譽」的精神，為八德區後備軍人提供最完善的輔導與協助。無論是活動辦理、政策宣導或是榮民關懷，我們始終與您站在第一線。
            </p>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Activities Section -->
    <section id="latest-activities" class="activities-section py-16">
      <v-container>
        <div class="d-flex flex-column flex-md-row justify-space-between align-md-end mb-8 text-center text-md-left">
          <div class="w-100">
            <div class="d-flex align-center justify-center justify-md-start gap-3 mb-4">
              <v-icon color="primary" size="x-large">mdi-shield-star</v-icon>
              <h2 class="activities-title">Latest Activities</h2>
            </div>
            <p class="activities-subtitle">最新活動資訊與召集公告</p>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <v-row class="mb-8" align="center">
          <v-col cols="12" md="8">
            <v-tabs
              v-model="selectedCategory"
              color="primary"
              align-tabs="start"
              class="category-tabs"
            >
              <v-tab
                v-for="cat in categories"
                :key="cat._id"
                :value="cat.name"
                class="font-weight-bold"
              >
                {{ cat.name }}
              </v-tab>
            </v-tabs>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="搜尋活動名稱或內容..."
              variant="outlined"
              density="comfortable"
              hide-details
              class="search-input"
            ></v-text-field>
          </v-col>
        </v-row>

        <!-- 載入中 -->
        <div v-if="loading" class="text-center py-16">
          <v-progress-circular indeterminate color="primary" :size="60"></v-progress-circular>
          <p class="mt-4 text-medium-emphasis">正在載入活動...</p>
        </div>

        <!-- 載入後 -->
        <div v-else>
          <!-- 無資料提示 -->
          <v-alert
            v-if="filteredActivities.length === 0"
            type="info"
            variant="tonal"
            color="blue-grey"
            prominent
            icon="mdi-information-outline"
            title="尚無相關活動"
            class="mx-auto"
            max-width="800"
          >
            目前沒有符合條件的活動，請嘗試更換分類或搜尋詞！
          </v-alert>

          <!-- 活動卡片列表 -->
          <v-row v-else>
            <v-col
              v-for="(activity, index) in filteredActivities"
              :key="activity._id"
              cols="12"
              sm="6"
              lg="4"
            >
              <v-card class="activity-card" height="100%" variant="outlined">
                <div class="card-img-wrapper">
                  <v-img
                    :src="activity.imageUrl || activityImages[index % activityImages.length]"
                    height="220px"
                    cover
                  >
                    <v-chip
                      v-if="getActivityStatus(activity).text !== '立即報名'"
                      :color="getActivityStatus(activity).color"
                      class="ma-2 status-chip"
                      label
                    >
                      {{ getActivityStatus(activity).text }}
                    </v-chip>
                  </v-img>
                </div>

                <div class="pa-6">
                  <div class="d-flex align-center justify-space-between mb-4">
                    <div class="d-flex align-center text-caption text-medium-emphasis">
                      <v-icon start size="small">mdi-calendar-blank</v-icon>
                      <span>{{ new Date(activity.eventDate).toLocaleDateString() }}</span>
                    </div>
                    <div
                      class="d-flex align-center text-caption font-weight-bold"
                      :class="activity.capacity <= 5 ? 'text-error' : 'text-success'"
                    >
                      <v-icon start size="small">mdi-account-multiple</v-icon>
                      <span>剩餘名額: {{ activity.capacity }}</span>
                    </div>
                  </div>
                  <h3
                    class="card-title mb-3 cursor-pointer"
                    @click="router.push(`/activities/${activity._id}`)"
                  >
                    {{ activity.name }}
                  </h3>
                  <p class="card-description mb-6">{{ activity.description }}</p>
                  <v-btn
                    block
                    :variant="getActivityStatus(activity).disabled ? 'flat' : 'outlined'"
                    :color="getActivityStatus(activity).color"
                    class="card-btn"
                    @click="router.push(`/activities/${activity._id}`)"
                  >
                    {{
                      getActivityStatus(activity).text === "立即報名"
                        ? "查看詳情"
                        : getActivityStatus(activity).text
                    }}
                  </v-btn>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </div>
      </v-container>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-top-line"></div>
      <div class="cta-bg-texture"></div>
      <v-container class="cta-content" fluid>
        <v-row justify="center">
          <v-col cols="12" lg="10" xl="8">
            <div class="cta-card text-center relative overflow-hidden">
              <div class="cta-card-decoration"></div>
              <h2 class="cta-title mb-10">你的參與，<br />決定後備力量的厚度</h2>
              <p class="cta-text mb-14">
                每一份投入都是對國家安全最實質的貢獻。加入我們，不僅是履行義務，更是展現守護家園的決心與榮耀。
              </p>
              <div class="d-flex flex-column flex-sm-row justify-center gap-8">
                <v-btn class="cta-btn-primary" size="x-large" to="/register" elevation="12">
                  立即加入我們
                </v-btn>
                <v-btn
                  class="cta-btn-secondary"
                  size="x-large"
                  variant="outlined"
                  href="mailto:contact@example.com"
                >
                  聯絡諮詢
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>
    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" top>
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.home-view-container {
  background-color: white;
  font-family: "Public Sans", "Noto Sans TC", sans-serif;
}

/* --- Hero Section --- */
.hero-section {
  position: relative;
  height: 600px;
  color: white;
  background-color: #0f172a;
}
.hero-content {
  position: relative;
  z-index: 2;
}
.hero-card {
  background-color: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 550px;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 960px) {
  .hero-card {
    width: fit-content;
    max-width: 90vw;
    margin-left: 0;
    margin-right: 0;
  }
}

.section-heading-line {
  height: 4px;
  width: 48px;
  background-color: #d4af37;
}
.hero-subtitle {
  color: #d4af37;
  font-weight: 700;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  font-size: 0.8rem;
}
.hero-title {
  font-size: clamp(1.75rem, 6vw, 4.5rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  max-width: 100%;
}
.hero-title-highlight,
:deep(.hero-title span) {
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  background-image: linear-gradient(to right, #d4af37, #fde047);
}
.hero-text {
  font-size: 1.125rem;
  color: #cbd5e1;
  border-left: 4px solid #d4af37;
  padding-left: 20px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 600px) {
  .hero-text {
    font-size: 1.25rem;
    padding-left: 24px;
  }
}

.hero-btn {
  background-color: #d4af37 !important;
  color: #0f172a !important;
  font-weight: 900;
  letter-spacing: 0.1em;
}

/* 移除舊的手機版 RWD 調整，因為已整合到上方 */

/* --- About Section --- */
.about-section {
  background-color: white;
}
.about-subtitle {
  color: #d4af37;
  font-weight: 900;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  font-size: 0.75rem;
}
.about-title {
  color: #0f172a;
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 900;
  letter-spacing: -0.02em;
}
.divider-line-short {
  height: 4px;
  width: 32px;
  background-color: #e2e8f0;
}
.divider-line-long {
  height: 4px;
  width: 64px;
  background-color: #d4af37;
}
.about-text {
  color: #475569;
  font-size: 1.125rem;
  line-height: 2;
  font-weight: 500;
}

/* --- Activities Section --- */
.activities-section {
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}
.activities-title {
  color: #0f172a;
  font-size: 1.875rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.02em;
}
.activities-subtitle {
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.1em;
  font-size: 0.875rem;
}
.activity-card {
  transition: all 0.3s ease-in-out;
  border-color: #e2e8f0;
}
.activity-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}
.card-img-wrapper {
  overflow: hidden;
}
.activity-card:hover .v-img {
  transform: scale(1.05);
}
.v-img {
  transition: transform 0.7s ease;
}
.card-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #0f172a;
  line-height: 1.3;
  transition: color 0.3s ease;
}
.activity-card:hover .card-title {
  color: #d4af37;
}
.card-description {
  font-size: 0.9rem;
  color: #475569;
  font-weight: 500;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  height: 2.8rem; /* 1.4rem * 2 lines */
}
.card-btn {
  --v-btn-height: 48px;
  border-width: 2px;
  border-color: #0f172a;
  color: #0f172a;
  font-weight: 900;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
}
.card-btn:hover {
  background-color: #0f172a;
  color: white;
}

/* --- CTA Section --- */
.cta-section {
  position: relative;
  padding: 8rem 0;
  background-color: #0f172a; /* Military Blue */
  overflow: hidden;
}
.cta-top-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to right, transparent, #d4af37, transparent);
  z-index: 3;
}
.cta-bg-texture {
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background-image: url("https://www.transparenttextures.com/patterns/carbon-fibre.png");
  pointer-events: none;
}
.cta-content {
  position: relative;
  z-index: 2;
}
.cta-card {
  padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 5vw, 4rem);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}
.cta-card-decoration {
  position: absolute;
  top: -48px;
  right: -48px;
  width: 256px;
  height: 256px;
  background: rgba(212, 175, 55, 0.05);
  border-radius: 50%;
  filter: blur(64px);
  pointer-events: none;
}
.cta-title {
  color: white;
  font-size: clamp(2.25rem, 6vw, 4.5rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
}
.cta-text {
  color: #cbd5e1;
  font-size: clamp(1.125rem, 2vw, 1.5rem);
  line-height: 1.8;
  font-weight: 500;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}
.cta-btn-primary {
  background-color: #d4af37 !important;
  color: #0f172a !important;
  font-weight: 900;
  letter-spacing: 0.2em;
  padding: 0 3rem !important;
  height: 64px !important;
}
.cta-btn-primary:hover {
  background-color: white !important;
}
.cta-btn-secondary {
  color: white !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  background: rgba(255, 255, 255, 0.05) !important;
  font-weight: 900;
  letter-spacing: 0.2em;
  padding: 0 3rem !important;
  height: 64px !important;
}
.cta-btn-secondary:hover {
  border-color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
}

/* Utility classes */
.gap-2 {
  gap: 0.5rem;
}
.gap-3 {
  gap: 0.75rem;
}
.gap-4 {
  gap: 1rem;
}
.gap-6 {
  gap: 1.5rem;
}
.gap-8 {
  gap: 2rem;
}
</style>
