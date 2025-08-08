<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="选择二创功能"
    width="480px"
    :close-on-click-modal="true"
    custom-class="selection-dialog"
  >
    <div class="selection-options">
      <div
        v-for="item in options"
        :key="item.value"
        class="selection-option"
        @click="handleSelectOption(item)"
      >
        <div class="option-icon">
          <el-icon><component :is="item.icon" /></el-icon>
        </div>
        <div class="option-content">
          <h4>{{ item.label }}</h4>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, withDefaults } from 'vue'

interface Option {
  label: string
  value: string
  desc: string
  icon: any
  path: string
}

interface Props {
  modelValue: boolean
  options: Option[]
}

const props = withDefaults(defineProps<Props>(), {
  options: () => []
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', option: Option): void
}>()

const handleSelectOption = (option: Option) => {
  emit('update:modelValue', false)
  emit('select', option)
}
</script>

<style scoped>
.selection-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
  padding: 16px 0;
}
.selection-option {
  width: 110px;
  background: #f7f7f7;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 6px;
  transition: box-shadow 0.2s, background 0.2s;
  border: 2px solid transparent;
}
.selection-option:hover {
  background: #fffbe6;
  border-color: #c8ad7f;
  box-shadow: 0 4px 16px rgba(200,173,127,0.12);
}
.option-icon {
  font-size: 28px;
  color: #c8ad7f;
  display: flex;
  align-items: center;
  justify-content: center;
}
.option-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
  text-align: center;
}
.option-content p {
  margin: 0;
  font-size: 11px;
  color: #888;
  text-align: center;
}
@media (min-width: 400px) {
  .selection-options {
    justify-content: flex-start;
  }
  .selection-option {
    flex: 0 0 calc(25% - 12px);
    margin-right: 0;
  }
}
</style>

<script lang="ts">
// 兼容默认导出
export default {};
</script> 