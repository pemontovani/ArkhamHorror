<script lang="ts" setup>
import AuthLayout from '@/components/AuthLayout.vue'
import { reactive, ref } from 'vue'
import { useToast } from '@/toasts'
import { useI18n } from 'vue-i18n';
import api from '@/api';

const submitted = ref(false)

interface PasswordReset {
  email: string
}

const reset = reactive<PasswordReset>({
  email: '',
})

const { t } = useI18n()

async function resetPassword() {
  submitted.value = true
  await api.post('password-reset', { email : reset.email })
  toast.success(t("passwordResetRequested"), { timeout: 3000 })
}

const toast = useToast()
</script>

<template>
  <AuthLayout>
    <form v-if="!submitted" @submit.prevent="resetPassword">
      <section>
        <div>
          <input
            v-model="reset.email"
            type="email"
            :placeholder="$t('email')"
          />
        </div>
        <div>
          <button>{{$t('resetPassword')}}</button>
        </div>
      </section>
    </form>
    <div v-else class="submitted">
      <p>{{ $t('deckUi.checkEmailForReset') }}</p>
    </div>
  </AuthLayout>
</template>

<style scoped>
form {
  width: 100%;
}

.submitted {
  padding: 0 10px 10px;
  text-align: center;
}

input {
  outline: 0;
  border: 0;
  padding: 15px;
  background: var(--background-dark);
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
