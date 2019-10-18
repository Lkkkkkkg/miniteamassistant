const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    teamName: '',
    gameTypeList: ['CSGO'],
    gameTypeIndex: 0,
    maxNumList: [2, 3, 4, 5],
    maxNumIndex: 3,
    startTime: '00:00',
    submiting: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
  },
  handleTeamNameInput(e) {
    this.setData({
      teamName: e.detail.value
    })
  },
  bindTypeChange(e) {
    this.setData({
      gameTypeIndex: e.detail.value
    })
  },
  bindMaxNumChange(e) {
    this.setData({
      maxNumIndex: e.detail.value
    })
  },
  bindStartTimeChange(e) {
    this.setData({
      startTime: e.detail.value
    })
  },
  submit() {
    if(!this.data.teamName) {
      wx.showToast({
        icon: 'none',
        title: '请输入队伍名'
      });
      return;
    }
    this.setData({
      submiting: true
    })
    db.collection('teams').add({
        data: {
          teamName: this.data.teamName,
          gameIcon: 'https://img.csgo.com.cn/csgo/82/bb/82bbb711e3f041a6e043bdce1d98f5741568276051.jpg',
          gameType: this.data.gameTypeIndex,
          maxNum: this.data.maxNumList[this.data.maxNumIndex],
          startTime: this.data.startTime,
          creator_id: app.globalData.userInfo._id,
          participant: [app.globalData.userInfo],
          createTime: new Date().getTime()
        }
      })
      .then(res => {
        db.collection('users').doc(app.globalData.userInfo._id).update({
            data: {
              teams: db.command.push(res._id)
            }
          }).then(res1 => {
            //本地修改用户信息
            app.globalData.userInfo.teams.push(res._id);
            //缓存用户信息
            wx.setStorageSync('userInfo', app.globalData.userInfo);
            wx.navigateBack({
              success() {
                setTimeout(()=>{
                  wx.startPullDownRefresh()
                },350);
              }
            });
          })
          .catch(err1 => {
            wx.showToast({
              icon: 'none',
              title: '更新记录失败'
            })
          })
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: '添加记录失败'
        })
      })
      .finally(() => {
        this.setData({
          submiting: false
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