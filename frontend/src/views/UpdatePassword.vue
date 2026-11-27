<script lang="ts" setup>
import AuthLayout from '@/components/AuthLayout.vue'
import { reactive } from 'vue'
import { useToast } from '@/toasts'
import { useI18n } from 'vue-i18n';
import api from '@/api';

export interface Props {
  resetId: string
}

const props = defineProps<Props>()

interface UpdatePassword {
  password: string
}

const reset = reactive<UpdatePassword>({
  password: '',
})

const { t } = useI18n()

async function updatePassword() {
  await api.put(`password-reset/${props.resetId}`, { password : reset.password })
  toast.success(t("passwordUpdatedSuccessfully"), { timeout: 3000 })
}

const toast = useToast()
</script>

<template>
  <AuthLayout>
    <form @submit.prevent="updatePassword">
      <section>
        <div>
          <input
            v-model="reset.password"
            type="password"
            :placeholder="$t('newPassword')"
          />
        </div>
        <div>
          <button>{{$t('updatePassword')}}</button>
        </div>
      </section>
    </form>
  </AuthLayout>
</template>

<style scoped>
form {
  width: 100%;
}

section {
  border-radius: 3px;
  padding: 10px;
}

input {
  outline: 0;
  border: 1px solid #000;
  padding: 15px;
  background: #F2F2F2;
  width: 100%;
  margin-bottom: 10px;
}

button {
  outline: 0;
  padding: 15px;
  background: var(--button-1);
  text-transform: uppercase;
  color: white;
  border: 0;
  width: 100%;
  &:hover {
    background: hsl(80, 35%, 32%);
  }
}

.error {
  background:#E3CCCD;
  color: #900000;
  border-radius: 5px;
  margin: 10px 5px;
  padding: 5px 10px;
}
</style>
