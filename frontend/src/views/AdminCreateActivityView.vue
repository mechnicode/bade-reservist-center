<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h4 text-center my-8 text-primary">建立新活動</h1>

        <v-card class="pa-6 elevation-2" shaped :loading="loading">
          <v-card-title class="headline d-flex align-center">
            <v-icon left class="mr-2">mdi-plus-box</v-icon>
            活動資訊
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="submitForm" ref="formRef">
              <v-text-field
                v-model="form.title"
                label="活動名稱"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-4"
              ></v-text-field>

              <v-textarea
                v-model="form.description"
                label="活動描述"
                :rules="[rules.required]"
                variant="outlined"
                rows="4"
                class="mb-4"
              ></v-textarea>

              <v-select
                v-model="form.category"
                :items="categories"
                label="活動分類"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-4"
              ></v-select>

              <v-text-field
                v-model="form.date"
                label="活動日期"
                type="date"
                :rules="[rules.required]"
                variant="outlined"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model.number="form.capacity"
                label="人數上限"
                type="number"
                :rules="[rules.required, rules.positiveNumber]"
                variant="outlined"
                class="mb-4"
              ></v-text-field>

              <v-file-input
                v-model="form.image"
                label="活動圖片"
                :rules="[rules.requiredFile]"
                variant="outlined"
                prepend-icon="mdi-camera"
                accept="image/*"
                class="mb-4"
                show-size
              ></v-file-input>

              <v-checkbox
                v-model="form.sell"
                label="開放報名"
                class="mb-4"
              ></v-checkbox>

              <v-btn
                type="submit"
                color="primary"
                variant="flat"
                block
                :loading="loading"
                height="48"
                class="mt-4"
              >
                建立活動
              </v-btn>
            </v-form>
          </v-card-text>
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
import { ref, reactive, onMounted } from 'vue';
import api from '@/api';
import { useRouter } from 'vue-router';

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);
const categories = ref([]); // Store categories

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success',
});

const form = reactive({
  title: '',
  description: '',
  category: '', // This will now hold the selected category name
  date: '',
  capacity: 0,
  image: null,
  sell: false,
});

const rules = {
  required: (value) => !!value || '此欄位為必填項。',
  requiredFile: (value) => (value && value.length > 0) || '請選擇活動圖片。',
  positiveNumber: (value) => value > 0 || '人數上限必須為正數。',
};

onMounted(async () => {
  try {
    const { data } = await api.get('/categories');
    categories.value = data.result.map(c => c.name); // Extract names for the select
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
});

const submitForm = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    const formData = new FormData();
    // Map 'title' to 'name' if backend expects 'name', check backend model
    // Backend model uses 'name'. Frontend form uses 'title'.
    // Let's check api.post call in original code.
    // Original code: formData.append(key, form[key]);
    // Backend activity model has 'name', 'description', 'category', ...
    // Frontend form has 'title'.
    // Wait, AdminCreateActivityView.vue uses 'title' in v-model but AdminView uses 'name'.
    // I need to check if the backend controller maps 'title' to 'name' or if one of them is wrong.
    // Backend model: name, description, ...
    // Controller create: activities.create({...req.body...})
    // So backend expects 'name'.
    // AdminCreateActivityView.vue sends 'title'.
    // If I send 'title', backend 'name' will be undefined (required error).
    // I should fix this to 'name' as well while I'm here.
    
    formData.append('name', form.title); // Map title to name
    formData.append('description', form.description);
    formData.append('category', form.category);
    formData.append('eventDate', form.date); // Backend uses eventDate
    formData.append('capacity', form.capacity);
    formData.append('sell', form.sell);
    
    if (form.image) {
      formData.append('image', form.image[0]);
    }

    const { data } = await api.post('/activities', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    snackbar.text = data.message || '活動建立成功！';
    snackbar.color = 'success';
    snackbar.show = true;

    // Reset form
    formRef.value.reset();
    form.image = null;
    Object.assign(form, {
      title: '',
      description: '',
      category: '',
      date: '',
      capacity: 0,
      image: null,
      sell: false,
    });

  } catch (error) {
    console.error('Failed to create activity:', error);
    const msg = error.response?.data?.message || '建立活動失敗，請稍後再試。';
    snackbar.text = msg;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.v-card {
  border-left: 5px solid var(--primary); /* Custom accent */
}
</style>