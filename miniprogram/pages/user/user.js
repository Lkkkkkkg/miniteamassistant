const app = getApp();
const {
  login
} = require("../../api/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo:null,
    logining: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (!app.globalData.userInfo) {
      this.autoLogin();
    }
  },
  onShow: function (options) {
    if (!this.data.userInfo && app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
  },
  autoLogin() {
    this.setData({
      logining: true
    })
    login(0)
      .then((res) => {
        if (res.result.code === 1000) {
          this.setData({
            userInfo: res.result.data.userInfo,
            logining: false
          })
        } else {
          this.setData({
            logining: false
          })
        }
      })
  },
  handleClickLogin(e) {
    if (e.detail.userInfo) {
      if(this.data.logining) return;
      this.setData({
        logining: true
      })
      login(1, e.detail.userInfo)
        .then((res) => {
          this.setData({
            logining: false,
            userInfo: res.result.data.userInfo
          })
        })
    }
  },
  handleClickPanelItem() {
    if(this.data.userInfo) {
      wx.showToast({
        icon: 'none',
        title: '暂未开放'
      })
    }else {
      wx.showToast({
        icon: 'none',
        title: '请先登录'
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

})