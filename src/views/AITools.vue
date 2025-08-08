<template>
    <div class="ai-tools-page">
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

      <!-- 预加载关键图片 -->
      <link rel="preload" as="image" href="../assets/ai-tools/一键抠图1.jpg">
      <link rel="preload" as="image" href="../assets/ai-tools/一键抠图2.1.jpg">
      
      <!-- 左侧菜单 -->
      <div class="side-menu">
        <router-link to="/dashboard" class="menu-link">首 页</router-link>
        <router-link to="/design" class="menu-link">设计区</router-link>
        <router-link to="/ai-tools" class="menu-link">AI小工具</router-link>
        <router-link to="/history" class="menu-link">历史记录</router-link>
      </div>
  
      <!-- 主内容区 -->
      <template v-if="$route.path === '/ai-tools'">
        <link rel="preload" as="image" href="../assets/ai-tools/一键抠图1.jpg">
        <link rel="preload" as="image" href="../assets/ai-tools/一键抠图2.1.jpg">
        <div class="ai-tools-content">
          <button class="show-btn">AI小工具</button>
          <div class="tools-grid">
            <!-- AI换图卡片 -->
            <router-link to="/ai-tools/image-swap" class="tool-card">
              <div class="card-images">
                <div class="extension-images">
                  <img loading="lazy" height="180" src="../assets/ai-tools/一键抠图1.jpg" alt="一键抠图1" class="extension-img" />
                  <img loading="lazy" height="180" src="../assets/ai-tools/一键抠图2-1.jpg" alt="一键抠图2" class="extension-img" />
                </div>
              </div>
              <div class="card-title">
                <h3>一键抠图</h3>
                <p>模型上传照片，一键生成</p>
              </div>
            </router-link>
  
            <!-- 高清放大卡片 -->
            <router-link to="/ai-tools/hd-enhance" class="tool-card">
              <div class="card-images">
                <div class="hd-upscale-images">
                  <div class="small-image">
                    <img loading="lazy" height="140" src="../assets/ai-tools/高清放大1-1.jpg" alt="高清放大-小图" class="upscale-img" />
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>高清放大</h3>
                <p>图片高清化处理</p>
              </div>
            </router-link>
  
            <!-- 元素消除卡片 -->
            <router-link to="/ai-tools/element-remove" class="tool-card">
              <div class="card-images">
                <div class="hd-upscale-images">
                  <div class="small-image">
                  <img loading="lazy" height="180" src="../assets/ai-tools/元素消除1-1.jpg" alt="元素消除1" class="upscale-img" />
               </div>
                </div>
              </div>
              <div class="card-title">
                <h3>元素消除</h3>
                <p>智能去除图片元素</p>
              </div>
            </router-link>
  
            <!-- 图片修复卡片 -->
            <router-link to="/ai-tools/image-restore" class="tool-card">
              <div class="card-images">
                <div class="extension-images">
                  <img loading="lazy" height="180" src="../assets/ai-tools/图片修复1-2.jpg" alt="图片修复1" class="upscale-img" />
                </div>
              </div>
              <div class="card-title">
                <h3>图片修复</h3>
                <p>修复受损或模糊图片</p>
              </div>
            </router-link>
            <!-- 一键去水印卡片 -->
            <router-link to="/ai-tools/watermark-remove" class="tool-card">
              <div class="card-images">
                <div class="extension-images">
                  <img loading="lazy" height="180" src="../assets/ai-tools/水印1-1.jpg" alt="去水印" class="upscale-img" />
                </div>
              </div>
              <div class="card-title">
                <h3>一键去水印</h3>
                <p>智能去除图片水印</p>
              </div>
            </router-link>
            <!-- 一键线稿图卡片 -->
            <router-link to="/ai-tools/line-art" class="tool-card">
              <div class="card-images">
                <div class="extension-images">
                  <img loading="lazy" height="180" src="../assets/ai-tools/线稿1-2.jpg" alt="线稿图" class="upscale-img" />
                </div>
              </div>
              <div class="card-title">
                <h3>一键线稿图</h3>
                <p>智能生成线稿图</p>
              </div>
            </router-link>
          </div>
        </div>
      </template>
      <template v-else>
        <router-view />
      </template>
  
      <!-- 底部旋转效果 -->
      <!-- <div class="rotating-background">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div> -->
    </div>
  </template>
  
  <style scoped>
  .ai-tools-page {
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
    display: flex;
    flex-direction: column;
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
  
  .menu-item {
    position: relative;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 8px 0;
    text-decoration: none;
  }
  
  .menu-item.active {
    color: #fff;
  }
  
  .item-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #00A3FF, #0AFFFF);
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 0 5px 5px 0;
    z-index: -1;
  }
  
  .menu-item.active .item-bg {
    opacity: 1;
  }
  
  .menu-item span {
    z-index: 1;
  }
  
  .ai-tools-content {
    position: relative;
    flex: 1 1 0%;
    min-height: 0;
    padding: 30px 120px 80px 120px;
    margin-top: 20px;
  }
  
  .show-btn {
    position: absolute;
    top: 0;
    left: 50;
    transform: translate(0%, -50%);
    background: #c8ad7f;
    color: #fff;
    border: none;
    border-radius: 18px;
    padding: 6px 22px;
    font-size: 16px;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(200, 173, 127, 0.15);
    cursor: pointer;
    z-index: 2;
    transition: background 0.2s;
  }
  .show-btn:hover {
    background: #b89a5e;
  }
  
  .tools-grid {
    margin-top: 0px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
    border: 1px solid #c8ad7f;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(200, 173, 127, 0.15), 0 1.5px 6px rgba(0,0,0,0.08);
    padding: 20px;
    overflow-y: auto;
    max-height: 90vh;
  }
  
  .tool-card {
    background-color: rgb(255,255,255);
    border-radius: 15px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.1);
    min-height: 0;
    height: auto;
    display: flex;
    flex-direction: column;
    max-width: 350px;
    width: 100%;
    text-decoration: none;
  }
  
  .tool-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    border-color: rgba(0, 163, 255, 0.5);
  }
  
  .card-images {
    width: 100%;
    height: 200px;
    overflow: hidden;
    position: relative;
    border-radius: 8px;
    background: rgb(235,235,235);
  }
  
  .extension-images {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    height: auto;
    padding: 10px;
    gap: 10px;
  }
  
  .extension-img {
    width: 48%;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
    transition: transform 0.5s ease;
    transform: translateZ(0);
    display: block;
  }
  
  .tool-card:hover .extension-img {
    transform: scale(1.05);
  }
  
  .card-title {
    padding: 15px;
    text-align: center;
  }
  
  .card-title h3 {
    margin: 0 0 5px;
    font-size: 18px;
    font-weight: normal;
    color: #c8ad7f;
  }
  
  .card-title p {
    margin: 0;
    font-size: 14px;
    opacity: 0.7;
    color: #333;
  }
  
  .rotating-background {
    position: fixed;
    bottom: -300px;
    left: 0;
    right: 0;
    height: 800px;
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
  
  .hd-upscale-images {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 10px;
  }
  
  .small-image {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .upscale-img {
    width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
    transition: transform 0.5s ease;
    transform: translateZ(0);
  }
  
  .tool-card:hover .upscale-img {
    transform: scale(1.05);
  }
  
  .extension-img::before, .upscale-img::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: loading-shimmer 1.5s infinite;
  }
  
  @keyframes loading-shimmer {
    0% {
      left: -100%;
    }
    100% {
      left: 100%;
    }
  }
  
  .extension-img, .upscale-img {
    background-color: rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
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
  </style>

<script setup lang="ts">
import { useShoeStore } from '../store'

// 获取store
const shoeStore = useShoeStore()
</script>