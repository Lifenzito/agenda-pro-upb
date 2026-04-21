<script setup>
import { computed, watch } from 'vue'
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY_CODE,
  getPhoneRequirementMessage,
  getPhoneRuleByCountryCode,
  sanitizeLocalPhoneByCountry
} from '../utils/phoneUtils'

const props = defineProps({
  countryCode: {
    type: String,
    default: DEFAULT_COUNTRY_CODE
  },
  localNumber: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: 'Teléfono'
  },
  placeholder: {
    type: String,
    default: 'Ej: 3105622260'
  },
  helper: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:countryCode', 'update:localNumber'])

const activeRule = computed(() => getPhoneRuleByCountryCode(props.countryCode))
const maxLocalLength = computed(() => activeRule.value.maxLength)
const dynamicHelper = computed(() => getPhoneRequirementMessage(props.countryCode))

const currentCountryCode = computed({
  get: () => props.countryCode,
  set: (value) => emit('update:countryCode', value)
})

const currentLocalNumber = computed({
  get: () => props.localNumber,
  set: (value) => {
    emit('update:localNumber', sanitizeLocalPhoneByCountry(props.countryCode, value))
  }
})

watch(
  () => [props.countryCode, props.localNumber],
  ([countryCode, localNumber]) => {
    const sanitized = sanitizeLocalPhoneByCountry(countryCode, localNumber)

    if (sanitized !== localNumber) {
      emit('update:localNumber', sanitized)
    }
  }
)
</script>

<template>
  <label class="phone-field">
    <span>{{ label }}</span>

    <div class="phone-row">
      <select
        v-model="currentCountryCode"
        :class="['country-code', { invalid: errorMessage }]"
        :disabled="disabled"
        :required="required"
      >
        <option v-for="country in COUNTRY_OPTIONS" :key="country.code" :value="country.code">
          {{ country.code }} · {{ country.country }}
        </option>
      </select>

      <input
        v-model="currentLocalNumber"
        :class="['local-number', { invalid: errorMessage }]"
        type="tel"
        inputmode="numeric"
        autocomplete="tel-national"
        pattern="[0-9]*"
        :maxlength="maxLocalLength"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
      />
    </div>

    <small v-if="errorMessage" class="error-text">{{ errorMessage }}</small>
    <small v-if="helper" class="helper">{{ helper }}</small>
    <small v-else class="helper">{{ dynamicHelper }}</small>
  </label>
</template>

<style scoped>
.phone-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.phone-field > span {
  font-weight: 600;
  color: var(--text-dark);
}

.phone-row {
  display: grid;
  grid-template-columns: minmax(170px, 240px) 1fr;
  gap: 0.55rem;
}

.country-code,
.local-number {
  border: 1px solid #c7dfd3;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  background-color: #fcfffd;
  color: var(--text-dark);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  min-width: 0;
}

.country-code:focus,
.local-number:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(0, 103, 71, 0.12);
  outline: none;
}

.country-code.invalid,
.local-number.invalid {
  border-color: #b3261e;
  box-shadow: 0 0 0 2px rgba(179, 38, 30, 0.12);
}

.error-text {
  color: #b3261e;
  font-size: 0.8rem;
  font-weight: 600;
}

.helper {
  color: #5e7b54;
  font-size: 0.8rem;
}

@media (max-width: 680px) {
  .phone-row {
    grid-template-columns: 1fr;
  }
}
</style>
