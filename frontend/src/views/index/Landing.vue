<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ShieldCheckmarkOutline,
  FlashOutline,
  SpeedometerOutline,
  AddOutline,
} from '@vicons/ionicons5'
import { useGlobalState } from '../../store'
import { api } from '../../api'

const {
  jwt,
  loading,
  openSettings,
  showAddressCredential,
  userSettings,
  addressPassword,
} = useGlobalState()

const message = useMessage()
const notification = useNotification()

const { t } = useI18n({
  messages: {
    en: {
      welcomeTitle: 'Temporary Email',
      welcomeDesc: 'Use our free temporary anonymous email service, protect your personal email address from spam, bots, phishing and other online abuse.',
      welcomeSubDesc: 'No commitment, no risk — only safety, and immediate access to a temporary mailbox address.',
      oneClickCreate: 'One-click Create Temp Mailbox',
      feature1Title: 'Secure Temp Mail',
      feature1Desc: 'Your temporary email address is protected by password, randomly generated in browser, providing prevention against unauthorized access and potential leaks.',
      feature2Title: 'Instant One-time Mail',
      feature2Desc: 'No more wasted time for registration, filling forms or unlocking verification codes. Your temporary email address can be used immediately, letting you take control of everything.',
      feature3Title: 'Fast Anonymous Mail',
      feature3Desc: 'Experience fast message delivery, without any delay or restriction. Our service is carefully tuned to ensure maximum transfer speed, keeping you seamlessly connected.',
      bindUserAddressError: 'Error binding address to user',
    },
    zh: {
      welcomeTitle: '临时邮件',
      welcomeDesc: '使用我们的免费临时匿名邮件服务，保护您的个人邮箱地址免受垃圾邮件、机器人、钓鱼和其他在线滥用的侵害。',
      welcomeSubDesc: '无需承诺，无风险——只需安全、即时地访问临时邮箱地址。',
      oneClickCreate: '一键创建临时邮箱',
      feature1Title: '安全的临时邮箱',
      feature1Desc: '您的临时邮箱地址受到密码保护，在浏览器中随机生成，为您提供防止未经授权访问和潜在泄露的屏障。',
      feature2Title: '即时一次性邮箱',
      feature2Desc: '不再浪费时间进行注册、填表或解决验证码。您的临时邮箱地址可立即使用，让您轻松掌控一切。',
      feature3Title: '快速匿名邮件服务',
      feature3Desc: '体验快速的消息传递，无延迟或限制。我们的服务经过精心调优，确保最大传递速度，让您保持无缝连接。',
      bindUserAddressError: '绑定邮箱地址到用户时错误',
    },
  },
})

const createNewEmail = async () => {
  try {
    loading.value = true
    const domains = openSettings.value.domains || []
    if (domains.length === 0) {
      await api.getOpenSettings(message, notification)
    }
    const defaultDomain = openSettings.value.domains[0]?.value || ''
    
    const res = await api.fetch('/api/new_address', {
      method: 'POST',
      body: JSON.stringify({
        name: '', // random
        domain: defaultDomain,
        cf_token: '', // maybe needed if turnstile is on
        enableRandomSubdomain: false,
      }),
    })
    
    jwt.value = res.jwt
    addressPassword.value = res.password || ''
    await api.getSettings()
    showAddressCredential.value = true
    
    try {
      await api.bindUserAddress()
    } catch (error) {
      message.error(`${t('bindUserAddressError')}: ${error.message}`)
    }
  } catch (error) {
    message.error(error.message || 'Error occurred')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="landing-container">
    <div class="landing-hero">
      <div class="duck-logo-wrapper">
        <img src="/logo.png" alt="Logo" class="duck-logo" />
        <span class="logo-text">DUCKMAIL</span>
      </div>
      
      <h1 class="hero-title">{{ t('welcomeTitle') }}</h1>
      <p class="hero-desc">{{ t('welcomeDesc') }}</p>
      <p class="hero-subdesc">{{ t('welcomeSubDesc') }}</p>
      
      <n-button 
        type="primary" 
        size="large" 
        class="create-btn"
        @click="createNewEmail"
        :loading="loading"
      >
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        {{ t('oneClickCreate') }}
      </n-button>
    </div>

    <div class="feature-grid">
      <n-card class="feature-card" :bordered="false">
        <div class="feature-icon-box blue-box">
          <n-icon :component="ShieldCheckmarkOutline" />
        </div>
        <h3 class="feature-title">{{ t('feature1Title') }}</h3>
        <p class="feature-desc">{{ t('feature1Desc') }}</p>
      </n-card>

      <n-card class="feature-card" :bordered="false">
        <div class="feature-icon-box purple-box">
          <n-icon :component="FlashOutline" />
        </div>
        <h3 class="feature-title">{{ t('feature2Title') }}</h3>
        <p class="feature-desc">{{ t('feature2Desc') }}</p>
      </n-card>

      <n-card class="feature-card" :bordered="false">
        <div class="feature-icon-box cyan-box">
          <n-icon :component="SpeedometerOutline" />
        </div>
        <h3 class="feature-title">{{ t('feature3Title') }}</h3>
        <p class="feature-desc">{{ t('feature3Desc') }}</p>
      </n-card>
    </div>
    
    <div class="landing-footer">
      <p>DuckMail 使用后端 API 服务，Mail.tm 作为部分用户的备选提供商。</p>
    </div>
  </div>
</template>

<style scoped>
.landing-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
}

.landing-hero {
  margin-bottom: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.duck-logo-wrapper {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.duck-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 12px;
}

.logo-text {
  font-size: 14px;
  font-weight: 700;
  color: #94A3B8;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.hero-title {
  font-size: 36px;
  font-weight: 800;
  color: #1E293B;
  margin-bottom: 20px;
}

.hero-desc {
  max-width: 700px;
  font-size: 18px;
  color: #64748B;
  line-height: 1.6;
  margin: 0 auto 12px;
}

.hero-subdesc {
  font-size: 15px;
  color: #94A3B8;
  margin-bottom: 32px;
}

.create-btn {
  height: 54px;
  padding: 0 40px;
  font-size: 18px;
  font-weight: 700;
  border-radius: 16px;
  background-color: #6366F1;
  box-shadow: 0 10px 20px -10px #6366F1;
  transition: all 0.3s ease;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px -10px #6366F1;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 40px;
}

.feature-card {
  padding: 32px 24px;
  border-radius: 24px;
  background: #FFFFFF;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
}

.feature-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin: 0 auto 24px;
}

.blue-box { background-color: #EFF6FF; color: #3B82F6; }
.purple-box { background-color: #F5F3FF; color: #8B5CF6; }
.cyan-box { background-color: #ECFEFF; color: #06B6D4; }

.feature-title {
  font-size: 18px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 12px;
}

.feature-desc {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
}

.landing-footer {
  margin-top: 80px;
  font-size: 12px;
  color: #94A3B8;
}

@media (max-width: 900px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
