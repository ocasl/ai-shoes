<template>
  <div class="materials-page">
    <!-- 左侧菜单 -->
    <div class="side-menu">
      <router-link to="/dashboard" class="menu-link">首 页</router-link>
      <router-link to="/design" class="menu-link">设计区</router-link>
      <router-link to="/ai-tools" class="menu-link">AI小工具</router-link>
      <router-link to="/materials" class="menu-link">材质库</router-link>
      <router-link to="/history" class="menu-link">历史记录</router-link>
    </div>
    
    <!-- 主内容区 -->
    <div class="main-content">
      <MaterialLibrary mode="browse" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MaterialLibrary from '../components/material/MaterialLibrary.vue'
</script>

<style scoped>
.materials-page {
  width: 100%;
  min-height: 100vh;
  background-image: url('@/assets/bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  color: white;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  display: flex;
  flex-direction: row;
}

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

.main-content {
  flex: 1;
  margin-left: 120px;
  min-height: 100vh;
  padding: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .materials-page {
    flex-direction: column;
  }
  
  .side-menu {
    position: relative;
    top: auto;
    transform: none;
    flex-direction: row;
    width: 100%;
    justify-content: center;
    padding: 10px 0;
    background: rgba(0, 0, 0, 0.3);
  }
  
  .menu-link {
    margin: 0 15px;
    font-size: 14px;
  }
  
  .main-content {
    margin-left: 0;
  }
}
</style>