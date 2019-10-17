const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    teamList: null,
    loginDialogShow: false,
    joining: false
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
        console.log('[数据库: teams] [查询记录] 成功：', res);
        this.setData({
          teamList: res.data
        })
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: '查询记录失败'
        })
        console.error('[数据库: teams] [查询记录] 失败：', err)
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
      const findParticipant = e.currentTarget.dataset.item.participant.find(item => {
        return item === app.globalData.userInfo._id
      })
      if (findParticipant) {
        wx.showToast({
          icon: 'none',
          title: '你已加入该队伍'
        })
      } else {
        this.setData({
          joining: true
        })
        //云函数添加组队人员
        wx.cloud.callFunction({
            name: 'joinTeam',
            data: {
              _id: e.currentTarget.dataset.item._id,
              user_id: app.globalData.userInfo._id
            }
          })
          .then(res => {
            //本地数组添加组队人员
            const teamList = this.data.teamList;
            teamList.find(item => {
              return item._id === e.currentTarget.dataset.item._id
            }).participant.push(app.globalData.userInfo._id);
            this.setData({
              teamList
            })
            wx.showToast({
              icon: 'none',
              title: '加入队伍成功'
            })
            console.log('[数据库: teams] [更新记录] 成功：', res);
          })
          .catch(err => {
            wx.showToast({
              icon: 'none',
              title: '更新记录失败'
            })
            console.error('[数据库: teams] [更新记录] 失败：', err)
          })
          .finally(()=>{
            this.setData({
              joining: false
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