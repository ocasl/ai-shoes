<template>
  <div class="home-page">
    <!-- 全局Loading进度条 -->
    <div v-if="shoeStore.aiTaskStatus === 'running'" class="global-loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <el-progress 
          :percentage="shoeStore.aiTaskProgress" 
          :stroke-width="8"
          :show-text="false"
          color="#c8ad7f"
          class="loading-progress"
        />
        <div class="loading-percentage">{{ shoeStore.aiTaskProgress }}%</div>
        <div class="loading-text">AI任务执行中</div>
      </div>
    </div>

    <!-- 左侧菜单 -->
    <div class="side-menu">
      <router-link  to="/dashboard" class="menu-link">首 页</router-link>
      <router-link to="/design" class="menu-link">设计区</router-link>
      <router-link  to="/ai-tools" class="menu-link">AI小工具</router-link>
      <router-link  to="/history" class="menu-link">历史记录</router-link>
    </div>

    <!-- 主内容区 -->
    <div class="content-area">
      <!-- 标题和介绍 -->
      <div class="title-section">
        <h1 class="main-title">用AI设计，解锁无限鞋款创意</h1>
        <p class="subtitle">D-Design是一个AI鞋款设计平台，致力于为设计师及鞋企提供更强设计灵感辅助，让创意不再受限。</p>
      </div>
    </div>
    
    <!-- 底部旋转效果 -->
   
  </div>
</template>

<script setup lang="ts">
import { useShoeStore } from '../store'

// 获取store
const shoeStore = useShoeStore()
</script>

<style scoped>
.home-page {
  width: 100%;
  min-height: 100vh;
  background-image: url('../assets/bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: white;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  font-size: 16px;
  display: flex;
  flex-direction: column;
}

/* 左侧菜单样式 - 纯文字链接 */
.side-menu {
  position: fixed;
  left: 0;
  top: 40%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  z-index: 10;
  width: 100px;
  background: none;
  padding: 0;
}

.menu-link {
  color: #fff;
  font-size: 16px;
  text-decoration: none;
  margin: 30px 0;
  text-align: center;
  transition: color 0.2s;
}

.menu-link.router-link-active {
  color: #c8ad7f;
  font-weight: bold;
  text-decoration: underline;
}
.menu-link:hover {
  color: #c8ad7f;
}

/* 主内容区样式 */
.content-area {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 5;
}

.title-section {
  margin-top: 3vh;
  margin-left: 13vw;
  max-width: 650px;
  position: relative;
}

  .main-title {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  /* 全局Loading样式 */
  .global-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    backdrop-filter: blur(5px);
    pointer-events: auto;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    color: #fff;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(200, 173, 127, 0.3);
    border-top: 3px solid #c8ad7f;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-progress {
    width: 200px;
  }

  .loading-percentage {
    color: #00d4ff;
    font-size: 18px;
    font-weight: bold;
  }

  .loading-text {
    color: #c8ad7f;
    font-size: 16px;
    font-weight: 500;
  }

  .main-title {
    letter-spacing: 2px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

.subtitle {
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.6;
  max-width: 550px;
}

/* 底部旋转效果 */
.rotating-background {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100vh;
  z-index: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(0, 163, 255, 0.2);
}

.circle-1 {
  width: 1200px;
  height: 1200px;
  animation: rotate 60s linear infinite;
}

.circle-2 {
  width: 900px;
  height: 900px;
  animation: rotate 45s linear reverse infinite;
}

.circle-3 {
  width: 600px;
  height: 600px;
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 