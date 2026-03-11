<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12">
        <h1 class="text-h4 text-center my-8 text-primary">使用者管理</h1>

        <v-card class="pa-6 elevation-2" shaped :loading="loading">
          <v-card-title class="headline d-flex align-center">
            <v-icon left class="mr-2">mdi-account-group</v-icon>
            所有使用者
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="users"
              :no-data-text="users.length === 0 ? '沒有使用者資料' : '載入中...'"
              class="elevation-1"
            >
              <template v-slot:[`item.role`]="{ item }">
                <v-chip :color="getRoleColor(item.role)" dark>{{ getRoleText(item.role) }}</v-chip>
              </template>
              <template v-slot:[`item.actions`]="{ item }">
                <template v-if="userStore.role > item.role">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    color="primary"
                    size="small"
                    @click="openEditDialog(item)"
                    title="編輯角色"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click="openDeleteDialog(item)"
                    title="刪除使用者"
                  ></v-btn>
                </template>
              </template>
            </v-data-table>
          </v-card-text>
          <v-card-actions v-if="errorMessage">
            <v-alert type="error" dense dismissible>{{ errorMessage }}</v-alert>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Role Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">編輯使用者角色</v-card-title>
        <v-card-text>
          <v-list-item>
            <v-list-item-title>帳號:</v-list-item-title>
            <v-list-item-subtitle>{{ editingUser.account }}</v-list-item-subtitle>
          </v-list-item>
          <v-select
            v-model="newRole"
            :items="roleOptions"
            label="選擇新角色"
            variant="outlined"
            class="mt-4"
            hide-details
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" text @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" text @click="saveRole" :loading="savingRole">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">確認刪除</v-card-title>
        <v-card-text>
          您確定要刪除使用者 <strong>{{ deletingUser.account }}</strong> 嗎？此操作無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" text @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" text @click="confirmDeleteUser" :loading="isDeleting">刪除</v-btn>
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
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const loading = ref(true);
const errorMessage = ref('');
const users = ref([]);

const snackbar = reactive({
  show: false,
  text: "",
  color: "success",
});

// Role Edit Dialog states
const editDialog = ref(false);
const editingUser = reactive({ _id: '', account: '', role: 0 });
const newRole = ref(0);
const savingRole = ref(false);

// Delete Dialog states
const deleteDialog = ref(false);
const deletingUser = reactive({ _id: '', account: '' });
const isDeleting = ref(false);

const roleOptions = computed(() => {
  const options = [
    { title: '一般使用者', value: 0 },
    { title: '一般管理員', value: 1 },
    { title: '最高管理員', value: 2 },
  ];
  return options.filter(option => option.value < userStore.role);
});

const headers = [
  { title: '帳號', key: 'account' },
  { title: '姓名', key: 'name' },
  { title: '電話', key: 'phone' },
  { title: '軍種', key: 'militaryBranch' },
  { title: '階級', key: 'rank' },
  { title: '角色', key: 'role' },
  { title: '操作', key: 'actions', sortable: false },
];

const getRoleColor = (role) => {
  if (role === 2) return 'purple';
  return role === 1 ? 'red' : 'blue'; // Admin: Red, User: Blue
};

const getRoleText = (role) => {
  if (role === 2) return '最高管理員';
  return role === 1 ? '一般管理員' : '一般使用者';
};

const fetchUsers = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const { data } = await api.get('/users');
    users.value = data.result;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    errorMessage.value = error.response?.data?.message || '無法載入使用者資料。';
    snackbar.text = errorMessage.value;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    loading.value = false;
  }
};

const openEditDialog = (user) => {
  Object.assign(editingUser, user); // Copy user data to editingUser
  newRole.value = user.role; // Set initial role in dialog
  editDialog.value = true;
};

const saveRole = async () => {
  savingRole.value = true;
  try {
    const { data } = await api.patch(`/users/${editingUser._id}/role`, { role: newRole.value });
    snackbar.text = data.message || '角色更新成功！';
    snackbar.color = 'success';
    snackbar.show = true;
    editDialog.value = false; // Close dialog
    fetchUsers(); // Refresh user list
  } catch (error) {
    console.error('Failed to update role:', error);
    const msg = error.response?.data?.message || '角色更新失敗，請稍後再試。';
    snackbar.text = msg;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    savingRole.value = false;
  }
};

const openDeleteDialog = (user) => {
  Object.assign(deletingUser, user);
  deleteDialog.value = true;
};

const confirmDeleteUser = async () => {
  isDeleting.value = true;
  try {
    const { data } = await api.delete(`/users/${deletingUser._id}`);
    snackbar.text = data.message || '使用者已刪除';
    snackbar.color = 'success';
    snackbar.show = true;
    deleteDialog.value = false;
    fetchUsers(); // Refresh list
  } catch (error) {
    console.error('Failed to delete user:', error);
    const msg = error.response?.data?.message || '刪除失敗，請稍後再試。';
    snackbar.text = msg;
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    isDeleting.value = false;
  }
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.v-card {
  border-left: 5px solid var(--primary); /* Custom accent */
}
</style>