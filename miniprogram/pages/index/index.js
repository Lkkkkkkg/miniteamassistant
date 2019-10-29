const app = getApp();
const db = wx.cloud.database();
const {
  login
} = require("../../api/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    teamListArr: [null, null, null, null],
    loginDialogShow: false,
    loading: true,
    dayType: 1,
    adding: false,
    logining: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.autoLogin();
    this.getTeamList();
  },
  autoLogin() {
    login(0)
      .then((res) => {
          if(res.result.code === 1000) {
            this.setData({
              userInfo: res.result.data.userInfo,
              logining: false
            })
          }else {
            this.setData({
              logining: false
            })
          }
      })
  },
  handleClickTab(e) {
    this.setData({
      dayType: e.currentTarget.dataset.type
    });
    if (!this.data.teamListArr[e.currentTarget.dataset.type]) {
      this.setData({
        loading: true
      })
      this.getTeamList();
    }
  },
  getTeamList() {
    return new Promise((resolve, reject) => {
      const date = new Date();
      const todayTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime(); //今天的时间
      const timeArr = [0, todayTime, todayTime + 86400000, todayTime + 172800000]
      db.collection('teams')
        .where({
          endTime: db.command.gt(timeArr[this.data.dayType])
        })
        .orderBy('createTime', 'desc')
        .get()
        .then(res => {
          const teamListArr = this.data.teamListArr;
          teamListArr[this.data.dayType] = res.data;
          this.setData({
            teamListArr,
            loading: false
          });
          resolve(res);
        })
        .catch(err => {
          wx.showToast({
            icon: 'none',
            title: '查询记录失败'
          })
          reject(err);
        })
    })
  },
  toDetail(e) {
    app.globalData.teamDetail = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: './pages/detail/detail?_id=' + e.currentTarget.dataset.item._id,
    })
  },
  handleClickAdd(e) {
    if (e.detail.userInfo) {
      if (!app.globalData.userInfo) { //未登录
        this.setData({
          adding: true
        })
        login(1,e.detail.userInfo)
          .then((res) => {
            wx.navigateTo({
              url: './pages/edit/edit',
              success: (() => {
                this.setData({
                  adding: false,
                  userInfo: res.result.data.userInfo
                })
              })
            })
          })
      } else {
        wx.navigateTo({
          url: './pages/edit/edit'
        })
      }
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.getTeamList();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.getTeamList().then(() => {
      wx.stopPullDownRefresh();
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})