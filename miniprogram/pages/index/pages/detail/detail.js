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
    userInfo: null,
    detail: null,
    logining: false,
    joining: false,
    textContent: '',
    messageList: null,
    scrollTop: 0,
    scrollWithAnimation: false,
    showTips: false,
    quiting: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.team_id = options._id;
    this.title = options.activityName + '：' + options.teamName;
    wx.setNavigationBarTitle({
      title: this.title
    })
    if (!app.globalData.teamDetail) {
      this.getTeamDetail()
    } else {
      this.setData({
        detail: app.globalData.teamDetail
      })
    }
    if (!app.globalData.userInfo && !app.globalData.unRegister) {
      this.autoLogin();
    }
    this.initChat(options.team);
  },
  onShow: function(options) {
    if (!this.data.userInfo && app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
  },
  bindTextContentInput(e) {
    this.setData({
      textContent: e.detail.value
    })
  },
  onFocus() {
    this.hasMove = false;
    this.setData({
      scrollWithAnimation: true
    })
    this.setData({
      scrollTop: 100000
    })
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
  initChat() {
    const db = wx.cloud.database()
    const watcher = db.collection('chatroom').where({
      team_id: this.team_id
    }).watch({
      onChange: snapshot => {
        console.log(this.hasMove)
        this.setData({
          messageList: snapshot.docs,
          scrollWithAnimation: !this.hasMove && snapshot.type !== 'init',
          showTips: this.hasMove
        })
        if (!(snapshot.type !== 'init' && this.hasMove)) {
          this.setData({
            scrollTop: 100000
          })
        }
      },
      onError: function(err) {
      }
    })
    // ...
    // 等到需要关闭监听的时候调用 close() 方法
    // watcher.close()
  },
  getTeamDetail() {
    return new Promise((resolve, rejcet) => {
      db.collection('teams')
        .where({
          _id: this.team_id
        })
        .get()
        .then(res => {
          db.collection('users')
            .where({
              _id: db.command.in(res.data[0].participant)
            })
            .get()
            .then((res1) => {
              res.data[0].participant = res1.data;
              this.setData({
                detail: res.data[0],
              });
              resolve(res);
            })
            .catch((err) => {
              reject(err)
            })
        })
        .catch(err => {
          rejcet(err);
        })
    })
  },
  handleClickJoin(e) {
    if (e.detail.userInfo) {
      if (!this.data.textContent) return;
      if (!this.data.userInfo) {
        login(1, e.detail.userInfo)
          .then((res) => {
            this.setData({
              userInfo: res.result.data.userInfo
            })
            this.joinTeam(e, e.detail.userInfo);
          })
      } else {
        if (!this.data.textContent) return;
        this.joinTeam(e, e.detail.userInfo);
      }
    }
  },
  handleClickJoinFast(e) {
    this.joinTeam(e, this.data.userInfo);
  },
  joinTeam(e, userInfo) {
    if (this.data.joining) return;
    this.setData({
      joining: true
    })
    wx.cloud.callFunction({
        name: 'joinTeam',
        data: {
          team_id: this.data.detail._id,
          userInfo: this.data.userInfo
        }
      })
      .then(res => {
        if (res.result.code === 1000) {
          //本地修改信息
          const {
            detail,
            userInfo
          } = this.data;
          detail.participant.push(this.data.userInfo);
          userInfo.teams.push(this.data.detail._id);
          app.globalData.userInfo.teams.push(this.data.detail._id);
          this.setData({
            detail,
            userInfo,
            joining: false
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
            joining: false
          });
        }
      })
      .catch(err => {
        this.setData({
          joining: false
        });
        wx.showToast({
          icon: 'none',
          title: err.message
        })
      })
  },
  quitTeam() {
    if(this.data.userInfo._id === this.data.detail.participant[0]._id)  {
      this.disbandTeam();
      return;
    }
    if (this.data.quiting) return;
    this.setData({
      quiting: true
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
          const { detail, userInfo } = this.data;
          //本地修改队伍信息
          const findParticipantIndex = detail.participant.findIndex(item => item === this.data.userInfo._id)
          detail.participant.splice(findParticipantIndex, 1);
          userInfo.teams.pop();
          app.globalData.userInfo.teams.pop();
          this.setData({
            detail,
            userInfo,
            quiting: false
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
            quiting: false
          });
        }
      })
      .catch(err => {
        this.setData({
          quiting: false
        });
        wx.showToast({
          icon: 'none',
          title: err.message
        })
      })
  },
  disbandTeam() {
    if (this.data.quiting) return;
    this.setData({
      quiting: true
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
            quiting: false
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
          } else {
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
          quiting: false
        })
        wx.showToast({
          icon: 'none',
          title: err.message
        })
      })
  },
  handleClickSend(e) {
    if (e.detail.userInfo) {
      login(1, e.detail.userInfo)
        .then((res) => {
          this.setData({
            userInfo: res.result.data.userInfo
          })
          this.sendMessage(res.result.data.userInfo);
        })
    }
  },
  sendMessageFast() {
    if(!this.data.textContent) return;
    this.sendMessage(this.data.userInfo)
  },
  sendMessage(userInfo) {
    if (this.data.sending) return;
    this.setData({
      sending: true
    })
    const data = {
      sendTime: Date.now(),
      team_id: this.team_id,
      author_id: userInfo._id,
      avatar: userInfo.avatarUrl,
      nickName: userInfo.nickName,
      msgType: 'text',
      textContent: this.data.textContent,
    }
    wx.cloud.callFunction({
        name: "sendMessage",
        data: {
          data
        }
      })
      .then((res) => {
        if (res.result.code === 1000) {
          this.setData({
            sending: false,
            textContent: ''
          })
        } else {
          wx.showToast({
            icon: 'none',
            title: res.result.message
          })
          this.setData({
            sending: false
          })
        }
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: err.message
        })
        this.setData({
          sending: false
        })
      })
  },
  onScroll(e) {
    if (!this.hasMove && e.detail.deltaY > 0) this.hasMove = true;
  },
  scrollToBottom() {
    this.hasMove = false;
    this.setData({
      scrollWithAnimation: true
    });
    this.setData({
      scrollTop: 100000,
      showTips: false
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

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
    this.getTeamDetail()
      .then(() => {
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
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
    console.log(this.title)
    return {
      title: this.title
    }
  }
})