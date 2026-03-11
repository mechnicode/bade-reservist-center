<template>
  <div class="login-container fill-height">
    <v-container>
      <v-row justify="center" align="center">
        <v-col cols="12" md="8" lg="5" xl="4">
          <v-card class="login-card" elevation="0">
            <!-- Decorative Top Line -->
            <div class="card-top-line"></div>

            <div class="pa-8 pa-md-10">
              <!-- Header Section -->
              <div class="text-center mb-10">
                <div class="d-flex justify-center align-center gap-2 mb-3">
                  <v-icon color="primary" size="small">mdi-shield-lock-outline</v-icon>
                  <span
                    class="text-primary font-weight-bold text-uppercase tracking-widest text-caption"
                    >Restricted Access</span
                  >
                </div>
                <h2 class="text-h4 font-weight-black text-white mb-2 tracking-wide">
                  人員登入系統
                </h2>
                <p class="text-medium-emphasis text-caption">請輸入您的帳號密碼以存取系統</p>
              </div>

              <v-form @submit.prevent="loginHandler" ref="formRef">
                <v-text-field
                  v-model="form.account"
                  label="帳號 / Account"
                  :rules="[rules.required]"
                  variant="outlined"
                  class="mb-4 input-field"
                  bg-color="rgba(255,255,255,0.03)"
                  prepend-inner-icon="mdi-account-outline"
                  hide-details="auto"
                  color="primary"
                ></v-text-field>

                <v-text-field
                  v-model="form.password"
                  label="密碼 / Password"
                  type="password"
                  :rules="[rules.required]"
                  variant="outlined"
                  class="mb-8 input-field"
                  bg-color="rgba(255,255,255,0.03)"
                  prepend-inner-icon="mdi-lock-outline"
                  hide-details="auto"
                  color="primary"
                ></v-text-field>

                <v-btn
                  block
                  class="login-btn mb-6"
                  type="submit"
                  :loading="loading"
                  height="56"
                  variant="flat"
                >
                  確認登入
                </v-btn>

                <div class="text-center">
                  <router-link
                    to="/register"
                    class="text-decoration-none text-caption text-grey-lighten-1 hover-gold transition-colors"
                  >
                    還沒有帳號？ <span class="text-primary font-weight-bold">立即註冊</span>
                  </router-link>
                </div>
              </v-form>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Background Texture -->
    <div class="bg-texture"></div>

    <!-- Snackbar for feedback -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" top>
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();
const formRef = ref(null);
const loading = ref(false);
const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});

const form = reactive({
  account: "",
  password: "",
});

const rules = {
  required: (value) => !!value || "此欄位為必填項。",
};

const loginHandler = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const successMessage = await userStore.login(form);
    snackbar.text = successMessage;
    snackbar.color = "success";
    snackbar.show = true;
  } catch (error) {
    snackbar.text = error.message;
    snackbar.color = "error";
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  background-color: #0f172a; /* Military Blue fallback */
  position: relative;
  min-height: 100%;
}

.bg-texture {
  position: absolute;
  inset: 0;
  background-image: url("https://www.transparenttextures.com/patterns/carbon-fibre.png");
  opacity: 0.05;
  pointer-events: none;
  z-index: 0;
}

.login-card {
  background-color: #0a0c10 !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
}

.card-top-line {
  height: 4px;
  width: 100%;
  background: linear-gradient(90deg, transparent, #d4af37, transparent);
}

.tracking-widest {
  letter-spacing: 0.2em !important;
}

.tracking-wide {
  letter-spacing: 0.05em !important;
}

.login-btn {
  background-color: #d4af37 !important;
  color: #0f172a !important;
  font-weight: 900;
  letter-spacing: 0.15em;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background-color: white !important;
  transform: translateY(-2px);
}

.hover-gold {
  transition: color 0.3s ease;
}
.hover-gold:hover {
  color: #d4af37 !important;
}

.gap-2 {
  gap: 0.5rem;
}

/* Input Customization */
:deep(.v-field__outline__start),
:deep(.v-field__outline__notch),
:deep(.v-field__outline__end) {
  border-color: rgba(255, 255, 255, 0.15) !important;
}

:deep(.v-field--focused .v-field__outline__start),
:deep(.v-field--focused .v-field__outline__notch),
:deep(.v-field--focused .v-field__outline__end) {
  border-color: #d4af37 !important;
}

:deep(.v-label) {
  color: rgba(255, 255, 255, 0.5) !important;
}

:deep(.v-field__input) {
  color: white !important;
}
</style>
