const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    detail: null,
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(options)
    const detail = {
      teamName: options.teamName,
      remarks: options.remarks,
      startTime: +options.startTime,
      endTime: +options.endTime,
      activity: {
        activityIcon: options.activityIcon
      }
    }
    this.setData({
      detail,
      userInfo: app.globalData.userInfo
    })
    this.team_id = options.team_id;
    this.getTeamDetail();
  },

  getTeamDetail() {
    return new Promise((resolve, rejcet) => {
      db.collection('teams')
        .where({
          _id: this.team_id
        })
        .get()
        .then(res => {
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