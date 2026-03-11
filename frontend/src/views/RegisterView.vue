<template>
  <div class="register-container fill-height">
    <v-container>
      <v-row justify="center" align="center">
        <v-col cols="12" md="8" lg="6" xl="5">
          <v-card class="register-card" elevation="0">
            <!-- Decorative Top Line -->
            <div class="card-top-line"></div>

            <div class="pa-8 pa-md-10">
              <!-- Header Section -->
              <div class="text-center mb-10">
                <div class="d-flex justify-center align-center gap-2 mb-3">
                  <v-icon color="primary" size="small">mdi-account-plus-outline</v-icon>
                  <span
                    class="text-primary font-weight-bold text-uppercase tracking-widest text-caption"
                    >New Personnel</span
                  >
                </div>
                <h2 class="text-h4 font-weight-black text-white mb-2 tracking-wide">
                  人員註冊系統
                </h2>
                <p class="text-medium-emphasis text-caption">建立您的帳號以加入後備輔導體系</p>
              </div>

              <v-form @submit.prevent="registerHandler" ref="formRef">
                <v-row dense>
                  <v-col cols="12">
                    <v-text-field
                      v-model="form.account"
                      label="帳號 / Account"
                      :rules="[rules.required, rules.account]"
                      variant="outlined"
                      class="input-field mb-2"
                      bg-color="rgba(255,255,255,0.03)"
                      prepend-inner-icon="mdi-account-outline"
                      hide-details="auto"
                      color="primary"
                      counter="20"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.password"
                      label="密碼 / Password"
                      type="password"
                      :rules="[rules.required, rules.password]"
                      variant="outlined"
                      class="input-field mb-2"
                      bg-color="rgba(255,255,255,0.03)"
                      prepend-inner-icon="mdi-lock-outline"
                      hide-details="auto"
                      color="primary"
                      counter="20"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="form.confirmPassword"
                      label="確認密碼 / Confirm"
                      type="password"
                      :rules="[rules.required, (value) => value === form.password || '密碼不相符']"
                      variant="outlined"
                      class="input-field mb-2"
                      bg-color="rgba(255,255,255,0.03)"
                      prepend-inner-icon="mdi-lock-check-outline"
                      hide-details="auto"
                      color="primary"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-btn
                  block
                  class="register-btn mt-8 mb-6"
                  type="submit"
                  :loading="loading"
                  height="56"
                  variant="flat"
                >
                  提交註冊申請
                </v-btn>

                <div class="text-center">
                  <router-link
                    to="/login"
                    class="text-decoration-none text-caption text-grey-lighten-1 hover-gold transition-colors"
                  >
                    已經有帳號？ <span class="text-primary font-weight-bold">返回登入</span>
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
import { useRouter } from "vue-router";
import api from "@/api";

const router = useRouter();
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
  confirmPassword: "",
});

const rules = {
  required: (value) => !!value || "此欄位為必填項。",
  account: (value) => (value.length >= 4 && value.length <= 20) || "帳號長度需為 4-20 字",
  password: (value) => (value.length >= 4 && value.length <= 20) || "密碼長度需為 4-20 字",
};

const registerHandler = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    await api.post("/users", { account: form.account, password: form.password });
    snackbar.text = "註冊成功！將導向登入頁。";
    snackbar.color = "success";
    snackbar.show = true;
    setTimeout(() => router.push("/login"), 2000);
  } catch (error) {
    const errorMessage = error.response?.data?.message || "發生錯誤，請稍後再試。";
    snackbar.text = `註冊失敗：${errorMessage}`;
    snackbar.color = "error";
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  background-color: #0f172a;
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

.register-card {
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

.register-btn {
  background-color: #ff6b00 !important; /* Safety Orange */
  color: white !important;
  font-weight: 900;
  letter-spacing: 0.15em;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.register-btn:hover {
  background-color: #e65100 !important;
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
