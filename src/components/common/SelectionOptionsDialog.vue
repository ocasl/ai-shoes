<template>
  <el-dialog 
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="title" 
    width="400px" 
    :close-on-click-modal="true"
    custom-class="selection-dialog"
  >
     <div class="selection-options">
     <!-- <div class="selection-option" @click="handleSelectOption('smart')">
        <div class="option-icon">
          <el-icon><Crop /></el-icon>
        </div>
        <div class="option-content">
          <h4>智能选区</h4>
          <p>使用AI自动识别物体轮廓进行选择</p>
        </div>
      </div>  -->
      <div class="selection-option" @click="handleSelectOption('brush')">
        <div class="option-icon">
          <el-icon><EditPen /></el-icon>
        </div>
        <div class="option-content">
          <h4>涂抹选区</h4>
          <p>手动涂抹标记需要修改的区域</p>
        </div>
      </div>
    </div> 
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, withDefaults } from 'vue';
import { Crop, EditPen } from "@element-plus/icons-vue";


interface Props {
  modelValue: boolean;
  title?: string;
}


const props = withDefaults(defineProps<Props>(), {
  title: "选择标记方式"
});


const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'select', option: string): void;
}>();

// Handle option selection
const handleSelectOption = (option: string) => {
  emit('update:modelValue', false);
  emit('select', option);
};


</script>

<style scoped>
/* 标记可选区域选项弹窗样式 */
.selection-dialog {
  border: 2px solid #c8ad7f;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(200, 173, 127, 0.15);
  background: rgba(30, 30, 30, 0.98);
  color: #fff;
  max-width: 95vw;
  max-height: 95vh;
}

.selection-options {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.selection-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.3);
}

.selection-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.option-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  background: rgba(200, 173, 127, 0.2);
  border-radius: 50%;
  border: 2px solid #c8ad7f;
  font-size: 24px;
  color: #c8ad7f;
}

.option-content {
  display: flex;
  flex-direction: column;
}

.option-content h4 {
  color: #c8ad7f;
  font-size: 18px;
  margin-bottom: 8px;
}

.option-content p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}
</style> 