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
    teamList: null,
    loginDialogShow: false,
    loading: true,
    dayType: 0,
    nowTime: null,
    dayTimes: null,
    adding: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      userInfo: app.globalData.userInfo
    })
    this.getTeamList();
  },
  handleClickTab(e) {
    this.setData({
      dayType: e.currentTarget.dataset.type
    });
    this.getTeamList();
  },
  getTeamList() {
    const date = new Date();
    const todayTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    this.setData({
      nowTime: date.getTime(),
      dayTimes: [todayTime, todayTime + 86400000, todayTime + 172800000, todayTime + 259200000]
    })
    return new Promise((resolve, reject) => {
      db.collection('teams')
        .orderBy('createTime', 'desc')
        .get()
        .then(res => {
          this.setData({
            teamList: res.data,
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
  closeLoginDialog() {
    this.setData({
      loginDialogShow: false
    })
  },
  handleClickAdd(e) {
    if (e.detail.userInfo) {
      if (!app.globalData.userInfo) { //未登录
        this.setData({
          adding: true
        })
        login(e.detail.userInfo)
          .then((res) => {
            wx.navigateTo({
              url: './pages/edit/edit',
              success: (() => {
                this.setData({
                  adding: false
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
  joinTeam(e, userInfo) {
    if (e.currentTarget.dataset.item._id.joining) return;
    const teamList = this.data.teamList;
    const teamItem = teamList.find(item => {
      return item._id === e.currentTarget.dataset.item._id
    });
    teamItem.joining = true;
    this.setData({
      teamList
    })
    wx.cloud.callFunction({
        name: 'joinTeam',
        data: {
          team_id: e.currentTarget.dataset.item._id,
          userInfo: app.globalData.userInfo
        }
      })
      .then(res => {
        if (res.result.code === 1000) {
          //本地修改队伍信息
          teamItem.participant.push(app.globalData.userInfo);
          teamItem.joining = false;
          this.setData({
            teamList
          });
          //本地修改用户信息
          app.globalData.userInfo.teams.push(e.currentTarget.dataset.item._id);
          //缓存用户信息
          wx.setStorageSync('userInfo', app.globalData.userInfo);
          wx.showToast({
            icon: 'none',
            title: '加入队伍成功'
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: res.result.message
          });
          teamItem.joining = false;
          this.setData({
            teamList
          });
        }
      })
      .catch(err => {
        teamItem.joining = false;
        this.setData({
          teamList
        });
        wx.showToast({
          icon: 'none',
          title: err.result.message
        })
      })
  },
  handleClickJoin(e) {
    if (e.detail.userInfo) {
      if (!app.globalData.userInfo) {
        login(e.detail.userInfo)
          .then((res) => {
            this.setData({
              userInfo: app.globalData.userInfo
            })
            this.joinTeam(e, e.detail.userInfo);
          })
      } else {
        this.joinTeam(e, e.detail.userInfo);
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