const app = getApp();
const db = wx.cloud.database();
const {
  login
} = require("../../../../api/api.js")
Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail: null,
    userInfo: null,
    buttonLoading: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      detail: app.globalData.teamDetail,
      userInfo: app.globalData.userInfo
    });
    if(!app.globalData.userInfo) this.autoLogin();
    this.team_id = options._id;
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
  getTeamDetail() {
    return new Promise((resolve, rejcet) => {
      db.collection('teams')
        .where({
          _id: this.team_id
        })
        .get()
        .then(res => {
          console.log(res)
          this.setData({
            detail: res.data[0],
            loading: false
          });
          resolve(res);
        })
        .catch(err => {
          this.setData({
            loading: false
          })
          wx.showToast({
            icon: 'none',
            title: '查询记录失败'
          })
          rejcet(err);
        })
    })
  },
  handleClickJoin(e) {
    if (e.detail.userInfo) {
      if (!this.data.userInfo) {
        login(1, e.detail.userInfo)
          .then((res) => {
            this.setData({
              userInfo: res.result.data.userInfo
            })
            this.joinTeam(e, e.detail.userInfo);
          })
      } else {
        this.joinTeam(e, e.detail.userInfo);
      }
    }
  },
  joinTeam(e, userInfo) {
    if (this.data.buttonLoading) return;
    this.setData({
      buttonLoading: true
    })
    wx.cloud.callFunction({
      name: 'joinTeam',
      data: {
        team_id: this.data.detail._id,
        userInfo: this.data.userInfo,
        formId: this.formId
      }
    })
      .then(res => {
        if (res.result.code === 1000) {
          //本地修改信息
          const {detail,userInfo} = this.data;
          detail.participant.push(this.data.userInfo);
          userInfo.teams.push(this.data.detail._id);
          app.globalData.userInfo.teams.push(this.data.detail._id);
          this.setData({
            detail,
            userInfo,
            buttonLoading: false
          });
          wx.showToast({
            icon: 'none',
            title: '加入队伍成功'
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: res.result.message
          });
          this.setData({
            buttonLoading: false
          });
        }
      })
      .catch(err => {
        this.setData({
          buttonLoading: false
        });
        wx.showToast({
          icon: 'none',
          title: err.message
        })
      })
  },
  quitTeam(e) {
    if (this.data.buttonLoading) return;
    this.setData({
      buttonLoading: true
    })
    wx.cloud.callFunction({
      name: 'quitTeam',
      data: {
        team_id: this.data.detail._id,
        userInfo: this.data.userInfo
      }
    })
      .then(res => {
        if (res.result.code === 1000) {
          const {detail,userInfo} = this.data;
          //本地修改队伍信息
          const findParticipantIndex = detail.participant.findIndex(item => item._id === this.data.userInfo._id)
          detail.participant.splice(findParticipantIndex, 1);
          userInfo.teams.pop();
          app.globalData.userInfo.teams.pop();
          this.setData({
            detail,
            userInfo,
            buttonLoading: false
          });
          //本地修改用户信息
          wx.showToast({
            icon: 'none',
            title: '退出队伍成功'
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: res.result.message
          });
          this.setData({
            buttonLoading: false
          });
        }
      })
      .catch(err => {
        this.setData({
          buttonLoading: false
        });
        wx.showToast({
          icon: 'none',
          title: err.message
        })
      })
  },
  disbandTeam(e) {
    if (this.data.buttonLoading) return;
    this.setData({
      buttonLoading: true
    })
    wx.cloud.callFunction({
      name: 'disbandTeam',
      data: {
        team_id: this.data.detail._id,
        userInfo: this.data.userInfo
      }
    })
      .then(res => {
        if (res.result.code === 1000) {
          this.setData({
            buttonLoading: false
          });
          if (getCurrentPages().length === 1) {
            wx.switchTab({
              url: '/pages/index/index',
              success: () => {
                wx.showToast({
                  icon: 'none',
                  title: '解散队伍成功'
                })
              }
            })
          }else  {
            wx.navigateBack({
              success() {
                wx.showToast({
                  icon: 'none',
                  title: '解散队伍成功'
                })
              }
            });
          }
        }
      })
      .catch(err => {
        this.setData({
          buttonLoading: false
        })
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
  onShow: function () {
    this.getTeamDetail();
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
    return {
      title: `这有一支${this.data.detail.activity.activityName}的队伍，快来加入吧`,
      imageUrl: this.data.detail.activity.activityIcon
    }
  }
})