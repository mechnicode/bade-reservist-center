<template>
  <v-app>
    <!-- Left Navigation Drawer (For Authenticated Dashboard/Profile) -->
    <v-navigation-drawer
      v-if="isDashboardPage && userStore.isLoggedIn"
      v-model="adminDrawer"
      :permanent="mdAndUp"
      class="app-drawer"
      width="260"
      elevation="2"
    >
      <div class="drawer-header pa-6 d-flex flex-column align-center">
        <v-img src="./favicon-96x96.png" height="50" width="50" contain class="mb-3"></v-img>
        <div class="text-center">
          <div class="text-subtitle-2 font-weight-black text-white">{{ dashboardTitle }}</div>
          <div class="text-caption text-gold">{{ dashboardSubtitle }}</div>
        </div>
      </div>
      <v-divider color="rgba(255,255,255,0.1)"></v-divider>
      <v-list nav class="pa-4">
        <v-list-item
          v-for="link in dashboardLinks"
          :key="link.text"
          :to="link.to"
          :prepend-icon="link.icon"
          :title="link.text"
          rounded="lg"
          class="mb-1 nav-item"
        ></v-list-item>
      </v-list>
      <template v-slot:append>
        <div class="pa-4">
          <v-btn
            block
            color="error"
            variant="tonal"
            prepend-icon="mdi-logout"
            @click="userStore.logout"
          >
            登出系統
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Header (Original Dark Style) -->
    <v-app-bar app class="app-header" height="90" elevation="0">
      <v-container class="d-flex align-center px-6" fluid>
        <!-- Logo -->
        <router-link to="/" class="d-flex align-center text-decoration-none">
          <v-img
            src="./favicon-96x96.png"
            alt="Logo"
            height="45"
            width="45"
            contain
            class="mr-3"
          ></v-img>
          <div class="header-title d-flex flex-column justify-center d-none d-sm-flex">
            <span class="font-weight-black text-subtitle-1 text-white" style="line-height: 1.2">
              八德區後備軍人輔導中心
            </span>
            <span
              class="text-caption font-weight-light text-gold"
              style="letter-spacing: 0.5px; font-size: 0.65rem !important"
            >
              Bade District Reserve Affairs Center
            </span>
          </div>
        </router-link>

        <v-spacer></v-spacer>

        <!-- Desktop Navigation -->
        <div class="d-none d-md-flex align-center">
          <v-btn
            v-for="link in mainLinks"
            :key="link.text"
            @click="navigateToLink(link)"
            class="nav-link"
            variant="plain"
            :ripple="false"
            :class="{ 'router-link-active': route.path === link.to }"
          >
            {{ link.text }}
          </v-btn>

          <v-divider vertical class="mx-4" color="white" inset></v-divider>

          <!-- User Actions -->
          <div v-if="!userStore.isLoggedIn">
            <v-btn to="/login" class="header-btn-login mr-2" variant="outlined">登入</v-btn>
            <v-btn to="/register" class="header-btn-register ml-2" variant="flat">立即註冊</v-btn>
          </div>
          <div v-else class="d-flex align-center">
            <div class="text-right mr-3 d-none d-lg-block">
              <div class="text-body-2 font-weight-bold text-white">{{ userStore.account }}</div>
              <div class="text-caption text-gold">
                {{ userStore.isAdmin ? "系統管理員" : "一般會員" }}
              </div>
            </div>
            <v-avatar :image="userStore.avatar" size="38" class="mr-3 border-gold"></v-avatar>
            <v-btn
              to="/profile"
              icon="mdi-account"
              variant="text"
              color="white"
              class="mr-1"
              title="個人資料"
            ></v-btn>
            <v-btn
              v-if="!userStore.isAdmin"
              icon="mdi-logout"
              variant="text"
              color="white"
              @click="userStore.logout"
              title="登出"
            ></v-btn>
          </div>
        </div>

        <!-- Mobile Drawer Toggle (Moved to Right) -->
        <v-app-bar-nav-icon
          v-if="isDashboardPage"
          class="d-md-none ml-2"
          color="#d4af37"
          @click="adminDrawer = !adminDrawer"
        ></v-app-bar-nav-icon>
        <v-app-bar-nav-icon
          v-else
          class="d-md-none ml-2"
          color="#ff6b00"
          @click="mobileDrawer = !mobileDrawer"
        ></v-app-bar-nav-icon>
      </v-container>
    </v-app-bar>

    <!-- Mobile Navigation Drawer (For Guests/Normal Users on Frontend) -->
    <v-navigation-drawer
      v-model="mobileDrawer"
      temporary
      location="right"
      class="mobile-drawer"
      v-if="!isDashboardPage"
    >
      <v-list nav>
        <v-list-item
          v-for="link in mainLinks"
          :key="link.text"
          @click="navigateToLink(link)"
          :prepend-icon="link.icon"
          :title="link.text"
          :active="route.path === link.to"
        ></v-list-item>
      </v-list>
      <template v-slot:append>
        <div class="pa-4">
          <div v-if="!userStore.isLoggedIn">
            <v-btn to="/register" block color="primary" class="mb-2 font-weight-black">立即註冊</v-btn>
            <v-btn to="/login" block variant="outlined" class="mb-2">登入</v-btn>
          </div>
          <v-btn v-if="userStore.isLoggedIn" @click="userStore.logout" block color="error"
            >登出</v-btn
          >
        </div>
      </template>
    </v-navigation-drawer>

    <v-main :class="{ 'admin-main': isDashboardPage }">
      <router-view />
    </v-main>

    <!-- Footer (Restored Original Detailed Version) -->
    <v-footer class="app-footer" v-if="!isDashboardPage">
      <v-container>
        <v-row class="py-10" align="start">
          <v-col cols="12" md="4" lg="4" class="mb-8 mb-md-0 text-center text-md-left">
            <div class="d-flex justify-center justify-md-start mb-6">
              <router-link to="/" class="d-inline-flex align-center text-decoration-none">
                <v-img
                  src="./favicon-96x96.png"
                  alt="Logo"
                  height="50"
                  width="50"
                  contain
                  class="ma-0 mr-4"
                ></v-img>
                <div class="d-flex flex-column justify-center text-left">
                  <h3 class="footer-title" style="line-height: 1.2">八德區後備軍人輔導中心</h3>
                  <span
                    class="text-caption font-weight-light text-gold"
                    style="letter-spacing: 0.5px; font-size: 0.7rem !important"
                  >
                    Bade District Reserve Affairs Center
                  </span>
                </div>
              </router-link>
            </div>
            <p class="footer-text">
              致力於連結後備夥伴，強化動員準備，並積極參與社區服務，共同守護家園。
            </p>
            <div class="mt-6">
              <v-btn
                v-for="icon in socialIcons"
                :key="icon"
                class="mx-1 mx-md-0 mr-md-2"
                :icon="icon"
                variant="text"
                size="small"
              ></v-btn>
            </div>
          </v-col>
          <v-col cols="12" sm="6" md="2" offset-lg="1" class="mb-8 mb-md-0 text-center text-md-left">
            <h4 class="footer-subtitle">網站導覽</h4>
            <div class="d-flex flex-column align-center align-md-start">
              <a href="#" class="footer-link" @click.prevent="scrollToActivities">最新活動</a>
              <a href="#" class="footer-link">常見問題</a>
            </div>
          </v-col>
          <v-col cols="12" sm="6" md="2" class="mb-8 mb-md-0 text-center text-md-left">
            <h4 class="footer-subtitle">相關連結</h4>
            <div class="d-flex flex-column align-center align-md-start">
              <a href="#" class="footer-link">國防部後備指揮部</a>
              <a href="#" class="footer-link">全民國防教育網</a>
              <a href="#" class="footer-link">我的E政府</a>
            </div>
          </v-col>
          <v-col cols="12" md="4" lg="3" class="mb-8 mb-md-0 text-center text-md-left">
            <h4 class="footer-subtitle">聯絡資訊</h4>
            <div class="d-flex flex-column align-center align-md-start">
              <div class="footer-link">
                <v-icon size="18" class="mr-3" color="primary">mdi-map-marker-outline</v-icon>
                <span class="text-no-wrap">桃園市桃園區介壽路322號</span>
              </div>
              <div class="footer-link">
                <v-icon size="18" class="mr-3" color="primary">mdi-phone-outline</v-icon>
                <span>03-3644456</span>
              </div>
            </div>
          </v-col>
        </v-row>
        <v-divider class="my-4" color="rgba(255,255,255,0.1)"></v-divider>
        <div class="d-flex flex-column flex-md-row justify-space-between align-center py-6">
          <div class="text-caption footer-copyright mb-4 mb-md-0 text-center text-md-left">
            &copy; {{ new Date().getFullYear() }} 八德區後備軍人輔導中心. ALL RIGHTS RESERVED.
          </div>
          <div class="d-flex" style="gap: 1.5rem">
            <a href="#" class="footer-policy-link text-caption">Privacy Policy</a>
            <a href="#" class="footer-policy-link text-caption">Security Policy</a>
          </div>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { useDisplay } from "vuetify";

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();

const adminDrawer = ref(true);
const mobileDrawer = ref(false);

const isDashboardPage = computed(() => {
  return route.path.startsWith("/admin") || route.path === "/profile";
});

const isAdminPage = computed(() => {
  return userStore.isAdmin && route.path.startsWith("/admin");
});

const dashboardTitle = computed(() => {
  return userStore.isAdmin ? "管理控制台" : "個人中心";
});

const dashboardSubtitle = computed(() => {
  return userStore.isAdmin ? "Admin Dashboard" : "User Center";
});

const mainLinks = [
  { text: "首頁", to: "/", icon: "mdi-home" },
  { text: "最新活動", to: "/#latest-activities", icon: "mdi-calendar-star" },
];

const navigateToLink = (link) => {
  if (link.to === "/#latest-activities") {
    mobileDrawer.value = false;
    if (route.path === "/") {
      scrollToActivities();
    } else {
      router.push("/").then(() => {
        // Wait for page to load then scroll
        setTimeout(scrollToActivities, 100);
      });
    }
  } else if (link.to === "/") {
    mobileDrawer.value = false;
    if (route.path === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/");
    }
  } else {
    router.push(link.to);
    mobileDrawer.value = false;
  }
};

const scrollToActivities = () => {
  const el = document.getElementById("latest-activities");
  if (el) {
    const headerHeight = 90;
    const elementPosition = el.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  }
};

const adminLinks = [
  { text: "活動列表", to: "/admin", icon: "mdi-view-dashboard" },
  { text: "輪播圖管理", to: "/admin/carousel", icon: "mdi-image-multiple" },
  { text: "成員管理", to: "/admin/users", icon: "mdi-account-group" },
  { text: "建立活動", to: "/admin/activities/create", icon: "mdi-plus-box" },
  { text: "報名審核", to: "/admin/registrations", icon: "mdi-clipboard-check" },
  { text: "分類設定", to: "/admin/categories", icon: "mdi-shape" },
];

const dashboardLinks = computed(() => {
  const links = [{ text: "個人中心", to: "/profile", icon: "mdi-account-circle" }];

  if (userStore.isAdmin) {
    links.push(...adminLinks);
  }

  links.push({ text: "回到首頁", to: "/", icon: "mdi-home" });

  return links;
});

const socialIcons = ["mdi-facebook", "mdi-twitter", "mdi-youtube", "mdi-instagram"];

watch(
  () => route.path,
  () => {
    window.scrollTo(0, 0);
    mobileDrawer.value = false;
  },
);
</script>

<style>
:root {
  --primary: #d4af37;
  --military-dark: #0a0c10;
  --slate-900: #0f172a;
  --slate-600: #475569;
  --slate-300: #cbd5e1;
}

.admin-main {
  background-color: #f8fafc !important;
  min-height: 100vh;
  padding-bottom: 2rem;
}

/* --- Header Styles --- */
.app-header {
  background-color: var(--military-dark) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.text-gold {
  color: var(--primary) !important;
}

.nav-link {
  font-weight: 700;
  color: var(--slate-300) !important;
  letter-spacing: 0.1em;
  opacity: 1 !important;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--primary) !important;
}

.header-btn-login {
  color: white !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.header-btn-register {
  background-color: #ff6b00 !important;
  color: white !important;
  font-weight: 900;
}

/* --- Admin Drawer Styles --- */
.app-drawer {
  background-color: #111827 !important;
  color: white !important;
}

.drawer-header {
  background-color: #1f2937;
}

.nav-item {
  color: #9ca3af !important;
}

.v-list-item--active.nav-item {
  background-color: var(--primary) !important;
  color: var(--military-dark) !important;
}

.border-gold {
  border: 2px solid var(--primary);
}

/* --- Footer Styles (Restored) --- */
.app-footer {
  background-color: var(--military-dark);
  color: var(--slate-300);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.footer-title {
  color: white;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.footer-subtitle {
  color: var(--primary);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.8rem;
  margin: 0 0 1.5rem 0 !important; /* Explicitly set margin to 24px (mb-6 equivalent) */
  line-height: 1.2;
}
.footer-text {
  font-size: 0.9rem;
  line-height: 1.8;
  color: var(--slate-300);
}
.footer-link {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  line-height: 1; /* Reset line-height to avoid calculation drift */
  height: 32px; /* Strict fixed height */
  color: var(--slate-300);
  text-decoration: none;
  margin-bottom: 12px; /* Fixed pixel margin */
  transition: color 0.3s ease;
}
.footer-link span {
  line-height: 1.5; /* Restore visual line-height for text */
}
.footer-link .v-icon {
  height: 18px;
  width: 18px;
}
.footer-link:hover {
  color: var(--primary);
}
.footer-copyright {
  color: var(--slate-600);
}
.footer-policy-link {
  color: var(--slate-600);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}
.footer-policy-link:hover {
  color: var(--primary);
}
</style>
