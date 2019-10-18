const app = getApp();
const db = wx.cloud.database();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    loging: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    closeDialog() {
      this.triggerEvent('closeLoginDialog')
    },
    bindgetuserinfo(e) {
      if (e.detail.userInfo) {
        this.setData({
          loging: true
        })
        wx.cloud.callFunction({
            name: 'login',
            data: {
              userInfo: e.detail.userInfo
            }
          })
          .then(res => {
            if (res.result.code === 1000) {
              app.globalData.userInfo = res.result.data.userInfo;
              //缓存用户信息
              wx.setStorageSync('userInfo', res.result.data.userInfo);
              this.triggerEvent('closeLoginDialog');
              this.triggerEvent('onLoginSuccess');
            }
          })
          .catch(err => {
            wx.showToast({
              icon: 'none',
              title: err.result.message
            })
          })
      } else {
        console.log('用户点击取消授权')
      }
    }
  }
})