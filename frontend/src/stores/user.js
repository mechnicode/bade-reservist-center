import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import { useRouter } from 'vue-router'

export const useUserStore = defineStore(
  'user',
  () => {
    const router = useRouter()

    const token = ref('')
    const account = ref('')
    const role = ref(0) // 0 = 一般使用者, 1 = 管理員

    const isLoggedIn = computed(() => token.value.length > 0)
    const isAdmin = computed(() => role.value === 1 || role.value === 2)
    const isSuperAdmin = computed(() => role.value === 2)
    const avatar = computed(() => `https://source.boringavatars.com/beam/120/${account.value}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`)

    const login = async (form) => {
      try {
        const { data } = await api.post('/users/login', form)
        token.value = data.result.token
        account.value = data.result.account
        role.value = data.result.role
        router.push('/profile')
        return '登入成功'
      } catch (error) {
        console.error('Login error:', error)
        const text = error?.response?.data?.message || '發生錯誤，請稍後再試'
        throw new Error(text)
      }
    }

    const logout = () => {
      token.value = ''
      account.value = ''
      role.value = 0
      router.push('/')
    }

    return {
      token,
      account,
      role,
      isLoggedIn,
      isAdmin,
      isSuperAdmin,
      avatar,
      login,
      logout
    }
  },
  {
    persist: {
      key: 'bade-system-user',
      paths: ['token', 'account', 'role']
    }
  }
)
