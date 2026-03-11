import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useUserStore } from "@/stores/user";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
      meta: {
        title: "八德區後備軍人輔導中心",
        login: false,
        admin: false,
      },
    },
    {
      path: "/admin",
      name: "admin",
      component: () => import("../views/AdminView.vue"),
      meta: {
        title: "管理後台 | 八德區後備軍人輔導中心",
        login: true,
        admin: true,
      },
    },
    {
      path: "/activities/:id",
      name: "activity-detail",
      component: () => import("../views/ActivityDetailView.vue"),
      meta: {
        title: "活動詳情 | 八德區後備軍人輔導中心",
        login: false,
        admin: false,
      },
    },
    {
      path: "/admin/users",
      name: "admin-users",
      component: () => import("../views/AdminUsersView.vue"),
      meta: {
        title: "使用者管理 | 八德區後備軍人輔導中心",
        login: true,
        admin: true,
      },
    },
    {
      path: "/admin/activities/create",
      name: "admin-activities-create",
      component: () => import("../views/AdminCreateActivityView.vue"),
      meta: {
        title: "建立活動 | 八德區後備軍人輔導中心",
        login: true,
        admin: true,
      },
    },
    {
      path: "/admin/registrations",
      name: "admin-registrations",
      component: () => import("../views/AdminRegistrationsView.vue"),
      meta: {
        title: "報名管理 | 八德區後備軍人輔導中心",
        login: true,
        admin: true,
      },
    },
    {
      path: "/admin/categories",
      name: "admin-categories",
      component: () => import("../views/AdminCategoriesView.vue"),
      meta: {
        title: "分類管理 | 八德區後備軍人輔導中心",
        login: true,
        admin: true,
      },
    },
    {
      path: "/admin/carousel",
      name: "admin-carousel",
      component: () => import("../views/AdminCarouselView.vue"),
      meta: {
        title: "輪播圖管理 | 八德區後備軍人輔導中心",
        login: true,
        admin: true,
      },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/LoginView.vue"),
      meta: {
        title: "登入 | 八德區後備軍人輔導中心",
        login: false,
        admin: false,
      },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("../views/RegisterView.vue"),
      meta: {
        title: "註冊 | 八德區後備軍人輔導中心",
        login: false,
        admin: false,
      },
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("../views/ProfileView.vue"),
      meta: {
        title: "個人資料 | 八德區後備軍人輔導中心",
        login: true, // Requires login
        admin: false,
      },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: () => import("../views/NotFoundView.vue"),
      meta: {
        title: "404 | 八德區後備軍人輔導中心",
        login: false,
        admin: false,
      },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  // Change page title
  document.title = to.meta.title;

  if (to.meta.login && !userStore.isLoggedIn) {
    // Requires login but user is not logged in
    next("/login");
  } else if (to.meta.admin && !userStore.isAdmin) {
    // Requires admin but user is not admin
    next("/");
  } else if (userStore.isLoggedIn && (to.name === "login" || to.name === "register")) {
    // Logged in user tries to access login/register page
    next("/");
  } else {
    next();
  }
});

export default router;
