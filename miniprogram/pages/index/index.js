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
    logining: false,
    activityLoading: true,
    activityTypePickerShow: false,
    activityTypeList: null,
    activityTypeValue: [0],
    activityType: '全部类型',
    joining: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.autoLogin();
    this.getActivity();
    this.getTeamList();
  },
  autoLogin() {
    this.setData({
      logining: true
    })
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
          res.data.forEach(item=>{
            item.overdue = new Date().valueOf() > item.endTime ? 1 : 0
          })
          res.data.sort((a,b)=>{
            return a.overdue - b.overdue;
          })
          this.setData({
            [`teamListArr[${this.data.dayType}]`]: res.data,
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
    // app.globalData.teamDetail = e.currentTarget.dataset.item;
    // wx.navigateTo({
    //   url: './pages/detail/detail?_id=' + e.currentTarget.dataset.item._id,
    // })
  },
  handleClickAdd(e) {
    if (e.detail.userInfo) {
      if (!this.data.userInfo) { //未登录
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
  getActivity() {
    db.collection('activities')
      .get()
      .then(res => {
        const activityTypeList = [...['全部类型'], ...res.data.map(item => {
          return item.activityName
        })]
        this.setData({
          activityLoading: false,
          activityTypeList
        })
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        });
      })
  },
  showActivityTypePicker() {
    this.setData({
      activityTypePickerShow: true
    })
  },
  closeActivityTypePicker() {
    this.setData({
      activityTypePickerShow: false
    })
  },
  pickerStart() {
    this.pickerChanging = true;
  },
  pickerEnd() {
    this.pickerChanging = false;
  },
  bindActivityTypeChange(e) {
    this.setData({
      activityTypeValue: e.detail.value
    })
  },
  confirmActivityType() {
    if (this.pickerChanging) return;
    this.setData({
      activityTypePickerShow: false
    });
    if (this.data.activityType !== this.data.activityTypeList[this.data.activityTypeValue[0]]) {
      this.setData({
        activityType: this.data.activityTypeList[this.data.activityTypeValue[0]]
      })
    }
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
    const teamListArr = this.data.teamListArr;
    const team = teamListArr[this.data.dayType].find((item)=>{
      return item._id === e.currentTarget.dataset.team_id
    })
    team.participant[e.currentTarget.dataset.index] = {
      joining: true
    };
    this.setData({
      teamListArr
    })
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
          const { userInfo } = this.data;
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