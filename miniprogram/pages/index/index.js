const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    teamList: null,
    loginDialogShow: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.getTeamList();
  },
  getTeamList() {
    db.collection('teams')
      .get()
      .then(res => {
        this.setData({
          teamList: res.data
        })
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
      })
  },
  closeLoginDialog() {
    this.setData({
      loginDialogShow: false
    })
  },
  handleClickAdd() {
    if (app.globalData.userInfo) {
      wx.navigateTo({
        url: './pages/edit/edit'
      })
    } else {
      this.setData({
        loginDialogShow: true
      })
    }
  },
  handleClickJoin(e) {
    if (app.globalData.userInfo) {
      const teamList = this.data.teamList;
      const teamItem = teamList.find(item => {
        return item._id === e.currentTarget.dataset._id
      })
      const findParticipant = teamItem.participant.find(item => {
        return item === app.globalData.userInfo._id
      })
      if (findParticipant) {
        wx.showToast({
          icon: 'none',
          title: '你已加入该队伍'
        })
      } else {
        teamItem.joining = true;
        this.setData({
          teamList
        })
        //队伍添加参队人员
        const p1 = wx.cloud.callFunction({
          name: 'joinTeam',
          data: {
            _id: e.currentTarget.dataset._id,
            user_id: app.globalData.userInfo._id
          }
        });
        //用户添加参与队伍
        const p2 = db.collection('users').doc(app.globalData.userInfo._id).update({
          data: {
            teams: db.command.push(teamItem._id)
          }
        });
        Promise.all([p1,p2])
          .then(res => {
            //本地数组添加组队人员
            teamItem.participant.push(app.globalData.userInfo._id);
            teamItem.joining = false;
            this.setData({
              teamList
            })
            wx.showToast({
              icon: 'none',
              title: '加入队伍成功'
            })
          })
          .catch(err => {
            teamItem.joining = false;
            this.setData({
              teamList
            })
            wx.showToast({
              icon: 'none',
              title: '更新记录失败'
            })
          })
      }
    } else {
      this.setData({
        loginDialogShow: true
      })
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

  }
})