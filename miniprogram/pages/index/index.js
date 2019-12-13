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
    activiTypeList: [{
      typeName: '全部',
      type: 0
    }, {
      typeName: '网游竞技',
      type: 1
    }, {
      typeName: '手游休闲',
      type: 2
    }, {
      typeName: '户外',
      type: 3
    }, {
      typeName: '正能量',
      type: 4
    }],
    tabScrollLeft: 0,
    teamListArr: [],
    activityType: 0,
    adding: false,
    logining: false,
    joining: false,
    tabBarMove: 15,
    refreshing: false,
    scrollTopArr: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.tabScrollNowLeft = 0;
    this.windowWidth = wx.getSystemInfoSync().windowWidth;
    this.currentScrollTop = 0;
    const query = wx.createSelectorQuery().in(this)
    query.select('#tab_bar').boundingClientRect(res => {
      this.tabBarWidth = res.width;
    }).exec()
    query.select('#tab_0').boundingClientRect(res => {
      this.setData({
        tabBarWidth: res.width - 30
      })
    }).exec()
    if (!app.globalData.userInfo && !app.globalData.unRegister) {
      this.autoLogin();
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.getTeamList();
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
  getTeamList() {
    return new Promise((resolve, reject) => {
      // const date = new Date();
      // const todayTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0).getTime(); //今天的时间
      // const timeArr = [0, todayTime, todayTime + 86400000, todayTime + 172800000]
      // const whereObj = this.data.activityType !== 0 ? {
      //     ['activity.activityType']: this.data.activityType
      //   } : {},
      //   currentType = this.data.activityType
      // db.collection('teams')
      //   .where(whereObj)
      //   .orderBy('createTime', 'desc')
      //   .get()
      //   .then(res => {
      //     if (this.data.activityType === currentType) {
      //       res.data.forEach(item => {
      //         item.overdue = new Date().valueOf() > item.endTime ? 1 : 0
      //       })
      //       res.data.sort((a, b) => {
      //         return a.overdue - b.overdue;
      //       })
      //       this.setData({
      //         [`teamListArr[${this.data.activityType}]`]: res.data
      //       });
      //       resolve(res);
      //     }
      //   })
      //   .catch(err => {
      //     wx.showToast({
      //       icon: 'none',
      //       title: '查询记录失败'
      //     })
      //     reject(err);
      //   })
      const currentType = this.data.activityType;
      wx.cloud.callFunction({
          name: "getTeamList",
          data: {
            activityType: this.data.activityType
          }
        })
        .then(res => {
          console.log(res)
          if (this.data.activityType === currentType) {
            res.result.data.forEach(item => {
              item.overdue = new Date().valueOf() > item.endTime ? 1 : 0
            })
            res.result.data.sort((a, b) => {
              return a.overdue - b.overdue;
            })
            this.setData({
              [`teamListArr[${this.data.activityType}]`]: res.result.data
            });
            resolve(res);
          }
        })
        .catch(err => {
          wx.showToast({
            icon: 'none',
            title: '云函数调用失败'
          })
          reject(err);
        })
    })
  },
  handleClickTab(e) {
    this.handleTabsChange(e.currentTarget.dataset.type)
  },
  onTabsChange(e) {
    this.handleTabsChange(e.detail.current)
  },
  handleTabScroll(e) {
    this.tabScrollNowLeft = e.detail.scrollLeft;
  },
  handleTabsChange(activityType) {
    if (this.data.activityType !== activityType) {
      const query = wx.createSelectorQuery().in(this)
      query.select(`#tab_${activityType}`).boundingClientRect(res => {
        this.setData({
          tabScrollLeft: this.tabScrollNowLeft - this.windowWidth / 2 + res.left + res.width / 2,
          tabBarMove: this.tabScrollNowLeft + res.left + res.width / 2 - (res.width - 30) / 2,
          tabBarWidth: res.width - 30
        })
      }).exec()
      this.setData({
        activityType,
        [`scrollTopArr[${this.data.activityType}]`]: this.currentScrollTop
      });
      if (!this.data.teamListArr[activityType]) this.getTeamList();
    }
    wx.pageScrollTo({
      scrollTop: this.data.scrollTopArr[activityType],
      duration: 0
    });
  },

  toDetail(e) {
    app.globalData.teamDetail = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: './pages/detail/detail?_id=' + e.currentTarget.dataset.item._id + '&teamName=' + e.currentTarget.dataset.item.teamName + '&activityName=' + e.currentTarget.dataset.item.activity.activityName,
    })
  },
  handleClickRefresh() {
    if (this.data.refreshing) return;
    this.setData({
      refreshing: true
    })
    this.getTeamList().then(() => {
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
      wx.showToast({
        icon: 'none',
        title: '刷新成功'
      })
      this.setData({
        refreshing: false
      })
    })
  },
  handleClickAdd(e) {
    if (e.detail.userInfo) {
      if (this.data.adding) return;
      this.setData({
        adding: true
      })
      login(1, e.detail.userInfo)
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
    }
  },
  handleClickJoin(e) {
    if (e.detail.userInfo) {
      const teamListArr = this.data.teamListArr;
      const team = teamListArr[this.data.activityType].find((item) => {
        return item._id === e.currentTarget.dataset.team_id
      })
      team.participant[e.currentTarget.dataset.index] = {
        joining: true
      };
      this.setData({
        teamListArr
      })
      if (!this.data.userInfo) {
        login(1, e.detail.userInfo)
          .then((res) => {
            this.setData({
              userInfo: res.result.data.userInfo
            })
            this.joinTeam(teamListArr, team, e, e.detail.userInfo);
          })
      } else {
        this.joinTeam(teamListArr, team, e, e.detail.userInfo);
      }
    }
  },
  joinTeam(teamListArr, team, e, userInfo) {
    wx.cloud.callFunction({
        name: 'joinTeam',
        data: {
          team_id: team._id,
          userInfo: this.data.userInfo,
          index: e.currentTarget.dataset.index
        }
      })
      .then(res => {
        if (res.result.code === 1000) {
          //本地修改信息
          const {
            userInfo
          } = this.data;
          team.participant[e.currentTarget.dataset.index] = {
            joining: false
          };
          team.participant[e.currentTarget.dataset.index].player = this.data.userInfo;
          userInfo.teams.push(team._id);
          app.globalData.userInfo.teams.push(team._id);
          this.setData({
            userInfo,
            teamListArr
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
          team.participant[e.currentTarget.dataset.index] = {
            joining: false
          };
          this.setData({
            teamListArr
          })
        }
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: err.message
        });
        team.participant[e.currentTarget.dataset.index] = {
          joining: false
        };
        this.setData({
          teamListArr
        })
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
  onPullDownRefresh: function() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },
  onPageScroll: function(e) { // 获取滚动条当前位置
    this.currentScrollTop = e.scrollTop;
  },
})