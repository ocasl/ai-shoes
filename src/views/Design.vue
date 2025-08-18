<template>
    <div class="design-page">
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
      <link rel="preload" as="image" href="../assets/shoes/融合鞋1.jpg">
      <link rel="preload" as="image" href="../assets/shoes/融合鞋2.jpg">
      <link rel="preload" as="image" href="../assets/shoes/融合1+2.png">
      
      <!-- 左侧菜单 -->
      <div class="side-menu">
        <router-link to="/dashboard" class="menu-link">首 页</router-link>
        <router-link to="/design" class="menu-link">设计区</router-link>
        <router-link to="/ai-tools" class="menu-link">AI小工具</router-link>
        <router-link to="/history" class="menu-link">历史记录</router-link>
      </div>
  
      <!-- 主内容区 -->
      <template v-if="$route.path === '/design'">
        <div class="design-content">
          <button class="show-btn">设计区</button>
          <div class="design-grid">
            <!-- 款式融合卡片 -->
            <router-link to="/design/style-fusion" class="design-card">
              <div class="card-images">
                <div class="fusion-images">
                  <div class="fusion-auto"> 
                    <img loading="lazy" src="../assets/shoes/融合图1-4.jpg" alt="融合鞋1" class="fusion-img fusion-auto-img" />
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>款式融合</h3>
                <p>跨品类融合，A/B元素</p>
              </div>
            </router-link>
  
            <!-- 鞋底换面卡片 -->
            <router-link to="/design/sole-fusion" class="design-card">
              <div class="card-images">
                <div class="fusion-images">
                  <div class="fusion-auto"> 
                    <img loading="lazy" src="../assets/shoes/鞋底互换1-5.jpg" alt="融合鞋1" class="fusion-img fusion-auto-img" />
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>鞋底换面</h3>
                <p>替换鞋底，帮面一键式变化</p>
              </div>
            </router-link>
  
            <!-- 款式延伸卡片 -->
            <router-link to="/design/style-extension" class="design-card">
              <div class="card-images">
                <div class="fusion-images">
                  <div class="fusion-auto"> 
                    <img loading="lazy" src="../assets/shoes/款式延申1-2.jpg" alt="款式延申1" class="fusion-img fusion-auto-img" />
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>款式延伸</h3>
                <p>一张鞋型，快速创造系列化设计</p>
              </div>
            </router-link>
  
            <!-- 局部修改卡片 -->
            <router-link to="/design/partial-modify" class="design-card">
              <div class="card-images">
                <div class="fusion-images">
                  <div class="fusion-auto"> 
                    <img loading="lazy" src="../assets/shoes/局部修改1-3.jpg" alt="局部修改1" class="fusion-img fusion-auto-img" />
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>局部修改</h3>
                <p>保留鞋型特点，针对局部进行变更</p>
              </div>
            </router-link>
  
            <!-- 文字创意卡片 -->
            <router-link to="/design/text-design" class="design-card text-design-card">
              <div class="card-images">
                <div class="text-design-container">
                  <div class="text-content">
                    一双白色和棕色相间的靴子，靴侧有一只爪印。这双靴子有厚实的鞋底和系带。靴子的上部由皮革和合成材料组合而成，鞋底则是浅棕色。背景是纯白色，使靴子子成为图像的焦点
                  </div>
                  <div class="fusion-auto"> 
                    <img loading="lazy" src="../assets/shoes/文字图1-1.jpg" alt="文字图1" class="fusion-img fusion-auto-img" />
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>文字创款</h3>
                <p>代入文字创意，部署生成整体设计</p>
              </div>
            </router-link>
  
            <!-- 配色换新卡片 -->

            <!-- 配色换新卡片 -->
            <router-link to="/design/color-change" class="design-card">
              <div class="card-images">
                <div class="fusion-images">
                  <div class="fusion-auto"> 
                    <img loading="lazy" src="../assets/shoes/配色替换1-4.jpg" alt="配色替换1" class="fusion-img fusion-auto-img" />
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>一键配色</h3>
                <p>款式不变，自动替换颜色搭配</p>
              </div>
            </router-link>

            <!-- 材质库卡片 -->
            <router-link to="/materials" class="design-card material-library-card">
              <div class="card-images">
                <div class="material-grid-preview">
                  <div class="material-item">
                    <div class="material-sample leather"></div>
                    <span>皮革</span>
                  </div>
                  <div class="material-item">
                    <div class="material-sample fabric"></div>
                    <span>布料</span>
                  </div>
                  <div class="material-item">
                    <div class="material-sample rubber"></div>
                    <span>橡胶</span>
                  </div>
                  <div class="material-item">
                    <div class="material-sample metal"></div>
                    <span>金属</span>
                  </div>
                  <div class="material-item">
                    <div class="material-sample plastic"></div>
                    <span>塑料</span>
                  </div>
                  <div class="material-item">
                    <div class="material-sample more"></div>
                    <span>更多</span>
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>材质库</h3>
                <p>管理和应用各种材质纹理</p>
              </div>
            </router-link>


            <!-- <div class="design-card">
              <div class="card-images">
                <div class="fusion-images">
                  <div class="fusion-auto"> 
                    <img loading="lazy" src="../assets/shoes/配色替换1-4.jpg" alt="配色替换1" class="fusion-img fusion-auto-img" />
                  </div>
                </div>
              </div>
              <div class="card-title">
                <h3>配色换新</h3>
                <p>款式不变，自动替换颜色搭配</p>
              </div>
            </div> -->
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
  .design-page {
    width: 100%;
    min-height: 100vh;
    background-image: url('../assets/bg.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    color: white;
    position: relative;
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
  .fusion-auto{}
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
  .design-content {
    position: relative;
    flex: 1;
    padding: 80px 120px;
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
  .design-grid {
    margin-top: -50px;
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
  .design-card {
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
  .design-card:hover {
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
  .fusion-images {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 10px;
    gap: 10px;
  }
  .fusion-left {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }
  .fusion-right {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
  }
  .fusion-left .fusion-img {
    width: 100%;
    height: calc(50% - 5px);
    object-fit: cover;
    border-radius: 8px;
    margin: 0;
    transform: translateZ(0);
  }
  .fusion-right .fusion-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    margin: 0;
    transform: translateZ(0);
  }
  .design-card:hover .fusion-img {
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
  .design-card:hover .extension-img {
    transform: scale(1.05);
  }
  .text-design-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 10px;
    gap: 10px;
  }
  .text-content {
    width: 160px;
    min-width: 120px;
    max-width: 180px;
    padding: 10px;
    font-size: 12px;
    line-height: 1.4;
    color: #333;
    background: rgb(235,235,235);
    border-radius: 8px;
    height: 100%;
    display: flex;
    align-items: center;
    text-align: left;
    box-sizing: border-box;
  }
  .design-image {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
  }
  .text-design-img {
    width: 100%;
    height: 90%;
    object-fit: cover;
    border-radius: 8px;
    transition: transform 0.5s ease;
    transform: translateZ(0);
  }
  .design-card:hover .text-design-img {
    transform: scale(1.05);
  }
  .fusion-img::before, .extension-img::before, .text-design-img::before {
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
  .fusion-left .fusion-img {
    width: 100%;
    height: calc(50% - 5px);
    object-fit: cover;
    border-radius: 8px;
    margin: 0;
    transform: translateZ(0);
  }
  .fusion-right .fusion-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
    margin: 0;
    transform: translateZ(0);
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
  .text-design-img {
    width: 100%;
    height: 90%;
    object-fit: cover;
    border-radius: 8px;
    transition: transform 0.5s ease;
    transform: translateZ(0);
  }
  .fusion-img, .extension-img, .text-design-img {
    background-color: rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;
  }
  .fusion-auto-img {
    width: 100%;
    height: 200px;
    object-fit: contain;
    display: block;
    margin: 0 auto;
    border-radius: 8px;
    background: rgb(235,235,235);
  }
  .text-design-card .text-content {
    background: rgb(235,235,235);
  }
  .text-design-card .fusion-auto-img {
    background: rgb(235,235,235);
  }
  .dialog-fade-enter-active, .dialog-fade-leave-active {
    transition: opacity 0.25s cubic-bezier(.4,0,.2,1);
  }
  .dialog-fade-enter-from, .dialog-fade-leave-to {
    opacity: 0;
  }
  .dialog-fade-enter-to, .dialog-fade-leave-from {
    opacity: 1;
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

  /* 材质库卡片样式 */
  .material-library-card .card-images {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .material-grid-preview {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 8px;
    padding: 15px;
    height: 100%;
  }

  .material-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: transform 0.3s ease;
  }

  .material-item:hover {
    transform: scale(1.1);
  }

  .material-sample {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .material-sample.leather {
    background: linear-gradient(45deg, #8B4513 0%, #A0522D 50%, #CD853F 100%);
    background-image: 
      radial-gradient(circle at 20% 20%, rgba(139, 69, 19, 0.3) 2px, transparent 2px),
      radial-gradient(circle at 80% 80%, rgba(160, 82, 45, 0.3) 1px, transparent 1px);
  }

  .material-sample.fabric {
    background: linear-gradient(90deg, #E6E6FA 0%, #D8BFD8 50%, #DDA0DD 100%);
    background-image: 
      repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.3) 2px, rgba(255,255,255,0.3) 4px);
  }

  .material-sample.rubber {
    background: linear-gradient(135deg, #2F4F4F 0%, #708090 50%, #778899 100%);
    background-image: 
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
  }

  .material-sample.metal {
    background: linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 25%, #808080 50%, #696969 75%, #C0C0C0 100%);
    background-image: 
      linear-gradient(90deg, rgba(255,255,255,0.2) 50%, transparent 50%);
    background-size: 4px 4px;
  }

  .material-sample.plastic {
    background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #45B7D1 100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .material-sample.more {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 18px;
  }

  .material-sample.more::before {
    content: '+';
  }

  .material-item span {
    font-size: 10px;
    color: #666;
    font-weight: 500;
    text-align: center;
  }

  .design-card:hover .material-sample {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  </style>

<script setup lang="ts">
import { useShoeStore } from '../store'

// 获取store
const shoeStore = useShoeStore()
</script>