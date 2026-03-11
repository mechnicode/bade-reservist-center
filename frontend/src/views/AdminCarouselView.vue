<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4">輪播圖管理</h1>
      <v-btn color="primary" @click="openDialog()" prepend-icon="mdi-plus"> 新增輪播圖 </v-btn>
    </div>

    <!-- 預覽區塊 - Preview Card -->
    <v-card class="mb-6 pa-4 border-dashed" variant="outlined" v-if="items.length > 0">
      <div class="text-subtitle-1 font-weight-bold text-primary mb-2">
        <v-icon start>mdi-eye</v-icon> 首頁顯示預覽
      </div>
      <v-carousel
        cycle
        height="400"
        hide-delimiter-background
        show-arrows="hover"
        class="rounded-lg"
      >
        <v-carousel-item
          v-for="(item, i) in items.filter((i) => i.isActive)"
          :key="i"
          :src="item.image"
          cover
        >
          <!-- 移除 hero-overlay，改用卡片樣式 -->
          <v-container class="fill-height position-relative z-index-2">
            <v-row align="center" justify="center" justify-md="start">
              <v-col cols="12" md="10">
                <div class="hero-card pa-6 rounded-lg">
                  <div class="d-flex align-center gap-3 mb-4">
                    <span class="section-heading-line"></span>
                    <span class="hero-subtitle">{{ item.pretitle }}</span>
                  </div>
                  <h1 class="hero-title mb-6" v-html="item.title"></h1>
                  <p class="hero-text mb-6">{{ item.subtitle }}</p>
                  <v-btn color="primary" variant="flat" size="small" class="font-weight-black">
                    查看更多活動
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-carousel-item>
      </v-carousel>
    </v-card>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-data-table :headers="headers" :items="items" :loading="loading" item-value="_id">
            <template v-slot:[`item.image`]="{ item }">
              <v-img :src="item.image" width="100" height="60" cover class="my-2 rounded"></v-img>
            </template>
            <template v-slot:[`item.isActive`]="{ item }">
              <v-chip :color="item.isActive ? 'success' : 'grey'" size="small">
                {{ item.isActive ? "啟用" : "停用" }}
              </v-chip>
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <v-btn
                icon="mdi-pencil"
                variant="text"
                color="primary"
                @click="openDialog(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                @click="openDeleteDialog(item)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="800px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ isEditing ? "編輯輪播圖" : "新增輪播圖" }}</span>
        </v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="submitForm">
            <v-row>
              <v-col cols="12">
                <v-file-input
                  :model-value="form.image"
                  @change="onFileChange"
                  label="圖片上傳 (建議尺寸 1920x800)"
                  accept="image/*"
                  :rules="isEditing ? [] : [rules.required]"
                  prepend-icon="mdi-camera"
                  variant="outlined"
                ></v-file-input>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.pretitle"
                  label="頂部小標 (Pre-title)"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="form.title"
                  label="主標題"
                  variant="outlined"
                  hint="提示：您可以使用特殊標籤讓部分文字變色。例如輸入：<span>想變色的文字</span>，該段文字就會呈現金黃色漸層。"
                  persistent-hint
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="form.subtitle"
                  label="副標題 (描述)"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="form.sort"
                  label="排序 (數字越小越前面)"
                  type="number"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch v-model="form.isActive" label="是否啟用" color="primary"></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" text @click="dialog = false">取消</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitForm">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">確認刪除</v-card-title>
        <v-card-text>確定要刪除此輪播圖嗎？此操作無法復原。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" text @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" text @click="confirmDelete" :loading="deleting">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Cropper Dialog -->
    <v-dialog v-model="showCropper" max-width="900px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">圖片裁切</span>
        </v-card-title>
        <v-card-text>
          <div style="height: 500px; width: 100%">
            <vue-cropper
              ref="cropperRef"
              :src="cropperImg"
              alt="Source Image"
              :aspect-ratio="1920 / 800"
              :view-mode="1"
              drag-mode="move"
              :auto-crop-area="1"
              :background="false"
              preview=".preview"
            ></vue-cropper>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue-darken-1" text @click="showCropper = false">取消</v-btn>
          <v-btn color="primary" @click="onCropConfirm">確認裁切</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">{{
      snackbar.text
    }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import api from "@/api";
import VueCropper from "vue-cropperjs";
import "cropperjs/dist/cropper.css";

const items = ref([]);
const loading = ref(true);
const dialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const formRef = ref(null);
const currentId = ref(null);
const itemToDelete = ref(null);

// Cropper refs
const showCropper = ref(false);
const cropperImg = ref("");
const cropperRef = ref(null);
const tempFile = ref(null); // Store the selected file temporarily

const snackbar = reactive({ show: false, text: "", color: "success" });

const form = reactive({
  image: null,
  pretitle: "",
  title: "",
  subtitle: "",
  sort: 0,
  isActive: true,
});

const rules = {
  required: (value) => !!value || "此欄位必填",
};

const headers = [
  { title: "預覽", key: "image", sortable: false },
  { title: "主標題", key: "title" },
  { title: "排序", key: "sort" },
  { title: "狀態", key: "isActive" },
  { title: "操作", key: "actions", sortable: false },
];

const fetchItems = async () => {
  loading.value = true;
  try {
    const { data } = await api.get("/carousel");
    items.value = data.result;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const openDialog = (item = null) => {
  if (item) {
    isEditing.value = true;
    currentId.value = item._id;
    form.pretitle = item.pretitle;
    form.title = item.title;
    form.subtitle = item.subtitle;
    form.sort = item.sort;
    form.isActive = item.isActive;
    form.image = null; // Reset file input
  } else {
    isEditing.value = false;
    currentId.value = null;
    Object.assign(form, {
      image: null,
      pretitle: "",
      title: "",
      subtitle: "",
      sort: 0,
      isActive: true,
    });
  }
  dialog.value = true;
};

// Handle file selection
const onFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.type.indexOf("image/") === -1) {
    alert("請選擇圖片檔案");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    cropperImg.value = event.target.result;
    showCropper.value = true;
    tempFile.value = null;

    snackbar.text = "正在開啟裁切器...";
    snackbar.color = "info";
    snackbar.show = true;
  };
  reader.readAsDataURL(file);
};

const onCropConfirm = () => {
  if (!cropperRef.value) return;

  cropperRef.value.cropper
    .getCroppedCanvas({
      width: 1920,
      height: 800,
    })
    .toBlob(
      (blob) => {
        // Create a new File object
        const newFile = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });
        form.image = [newFile]; // Vuetify file input expects an array
        showCropper.value = false;

        // Feedback to user that crop was successful
        snackbar.text = "圖片裁切完成";
        snackbar.color = "success";
        snackbar.show = true;
      },
      "image/jpeg",
      0.9,
    );
};

const submitForm = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  submitting.value = true;
  const formData = new FormData();
  if (form.image && form.image.length > 0) formData.append("image", form.image[0]);
  formData.append("pretitle", form.pretitle);
  formData.append("title", form.title);
  formData.append("subtitle", form.subtitle);
  formData.append("sort", form.sort);
  formData.append("isActive", form.isActive); // This will be string 'true' or 'false' in FormData

  try {
    if (isEditing.value) {
      await api.patch(`/carousel/${currentId.value}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      snackbar.text = "更新成功";
    } else {
      await api.post("/carousel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      snackbar.text = "新增成功";
    }
    snackbar.color = "success";
    snackbar.show = true;
    dialog.value = false;
    fetchItems();
  } catch (error) {
    const msg = error.response?.data?.message || "操作失敗";
    snackbar.text = msg;
    snackbar.color = "error";
    snackbar.show = true;
  } finally {
    submitting.value = false;
  }
};

const openDeleteDialog = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  deleting.value = true;
  try {
    await api.delete(`/carousel/${itemToDelete.value._id}`);
    snackbar.text = "刪除成功";
    snackbar.show = true;
    deleteDialog.value = false;
    fetchItems();
  } catch (error) {
    snackbar.text = "刪除失敗";
    snackbar.color = "error";
    snackbar.show = true;
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  fetchItems();
});
</script>

<style scoped>
/* Copying Hero styles for preview with Card */
.hero-card {
  background-color: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 960px) {
  .hero-card {
    width: fit-content;
    margin-left: 0;
    margin-right: 0;
  }
}
.z-index-2 {
  position: relative;
  z-index: 2;
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
  font-size: 0.7rem;
}
.hero-title {
  color: white;
  font-size: clamp(1.25rem, 4vw, 1.8rem);
  font-weight: 900;
  max-width: 100%;
}
.hero-text {
  color: #cbd5e1;
  font-size: 0.8rem;
  border-left: 3px solid #d4af37;
  padding-left: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 600px) {
  .hero-text {
    font-size: 0.9rem;
  }
}
.border-dashed {
  border-style: dashed !important;
  border-color: #cbd5e1 !important;
}
/* 讓使用者只需要用 <span> 標籤就能變色，不需要記複雜的 class */
:deep(.hero-title span),
:deep(.hero-title-highlight) {
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  background-image: linear-gradient(to right, #d4af37, #fde047);
}
</style>
