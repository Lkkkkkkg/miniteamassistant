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
    loging:false
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
        const newUser = {
          ...e.detail.userInfo,
          ...{
            teams: []
          }
        }
        wx.cloud.callFunction({
          name: 'login',
          success: res => {
            console.log('[数据库: users] [查询记录] 成功：', res);
            if (res.result.data.length === 0) { //未注册
              //注册
              db.collection('users')
                .add({
                  data: newUser
                })
                .then(res => {
                  console.log('[数据库: users] [添加记录] 成功：', res);
                  app.globalData.userInfo = {
                    ...{
                      _id: res._id
                    },
                    ...newUser
                  };
                  //缓存用户信息
                  wx.setStorageSync('userInfo', {
                    ...{
                      _id: res._id
                    },
                    ...newUser
                  });
                  this.triggerEvent('closeLoginDialog');
                  this.triggerEvent('onLoginSuccess');
                })
                .catch(err => {
                  wx.showToast({
                    icon: 'none',
                    title: '添加记录失败'
                  })
                  console.error('[数据库: users] [添加记录] 失败', err)
                })
            } else { //已注册
              app.globalData.userInfo = res.result.data[0]
              //缓存用户信息
              wx.setStorageSync('userInfo', res.result.data[0]);
              this.triggerEvent('closeLoginDialog');
              this.triggerEvent('onLoginSuccess');
            }
          },
          fail: err => {
            wx.showToast({
              icon: 'none',
              title: '查询记录失败',
            })
            console.log('[数据库: users] [查询记录] 失败：', err);
          },
        })

      } else {
        console.log('用户点击取消授权')
      }
    }
  }
})