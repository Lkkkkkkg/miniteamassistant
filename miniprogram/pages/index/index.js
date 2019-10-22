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
    userInfo: app.globalData.userInfo,
    teamListArr: [null, null, null, null],
    loginDialogShow: false,
    loading: true,
    dayType: 1,
    adding: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.getTeamList();
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
        .orderBy('endTime', 'desc')
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
    if (e.currentTarget.dataset.item._id.cardButtonLoading) return;
    const teamListArr = this.data.teamListArr;
    const teamItem = teamListArr[this.data.dayType].find(item => item._id === e.currentTarget.dataset.item._id);
    teamItem.cardButtonLoading = true;
    this.setData({
      teamListArr
    })
    wx.cloud.callFunction({
        name: 'joinTeam',
        data: {
          team_id: e.currentTarget.dataset.item._id,
          userInfo: app.globalData.userInfo,
          formId: this.formId
        }
      })
      .then(res => {
        if (res.result.code === 1000) {
          //本地修改队伍信息
          teamItem.participant.push(app.globalData.userInfo);
          teamItem.cardButtonLoading = false;
          this.setData({
            teamListArr
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
          teamItem.cardButtonLoading = false;
          this.setData({
            teamListArr
          });
        }
      })
      .catch(err => {
        teamItem.cardButtonLoading = false;
        this.setData({
          teamListArr
        });
        wx.showToast({
          icon: 'none',
          title: err.message
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
  submitTemplateMessageForm(e) {
    this.formId = e.detail.formId;
  },
  quitTeam(e) {
    if (e.currentTarget.dataset.item._id.cardButtonLoading) return;
    const teamListArr = this.data.teamListArr;
    const teamItem = teamListArr[this.data.dayType].find(item => item._id === e.currentTarget.dataset.item._id);
    teamItem.cardButtonLoading = true;
    this.setData({
      teamListArr
    });
    wx.cloud.callFunction({
        name: 'quitTeam',
        data: {
          team_id: e.currentTarget.dataset.item._id,
          userInfo: app.globalData.userInfo
        }
      })
      .then(res => {
        if (res.result.code === 1000) {
          //本地修改队伍信息
          const findParticipantIndex = teamItem.participant.findIndex(item => item._id === app.globalData.userInfo._id)
          teamItem.participant.splice(findParticipantIndex, 1);
          teamItem.cardButtonLoading = false;
          this.setData({
            teamListArr
          });
          //本地修改用户信息
          app.globalData.userInfo.teams.pop();
          //缓存用户信息
          wx.setStorageSync('userInfo', app.globalData.userInfo);
          wx.showToast({
            icon: 'none',
            title: '退出队伍成功'
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: res.result.message
          });
          teamItem.cardButtonLoading = false;
          this.setData({
            teamListArr
          });
        }
      })
      .catch(err => {
        teamItem.cardButtonLoading = false;
        this.setData({
          teamListArr
        });
        wx.showToast({
          icon: 'none',
          title: err.message
        })
      })
  },
  disbandTeam(e) {
    if (e.currentTarget.dataset.item._id.cardButtonLoading) return;
    const teamListArr = this.data.teamListArr;
    const teamItem = teamListArr[this.data.dayType].find(item => item._id === e.currentTarget.dataset.item._id);
    teamItem.cardButtonLoading = true;
    this.setData({
      teamListArr
    });
    wx.cloud.callFunction({
        name: 'disbandTeam',
        data: {
          team_id: e.currentTarget.dataset.item._id,
          userInfo: app.globalData.userInfo
        }
      })
      .then(res => {
        if (res.result.code === 1000) {
          teamItem.cardButtonLoading = false;
          //本地修改队伍信息
          const teamListArr = this.data.teamListArr;
          const teamItemIndex = teamListArr[this.data.dayType].findIndex(item => item._id === e.currentTarget.dataset.item._id);
          teamListArr[this.data.dayType].splice(teamItemIndex, 1);
          this.setData({
            teamListArr
          });
          wx.showToast({
            icon: 'none',
            title: '解散队伍成功'
          })
        }
      })
      .catch(err => {
        teamItem.cardButtonLoading = false;
        this.setData({
          teamListArr
        });
        wx.showToast({
          icon: 'none',
          title: err.message
        })
      })
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