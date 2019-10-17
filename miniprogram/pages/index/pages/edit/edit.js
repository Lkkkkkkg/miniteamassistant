const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    gameTypeList: ['CSGO'],
    gameTypeIndex: 0,
    maxNumList: [2, 3, 4, 5],
    maxNumIndex: 3,
    startTime: '12:01'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

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
    wx.cloud.callFunction({
      name: 'addTeam',
      data: {
        gameIcon: 'https://img.csgo.com.cn/csgo/82/bb/82bbb711e3f041a6e043bdce1d98f5741568276051.jpg',
        gameType: this.data.gameTypeList[this.data.gameTypeIndex],
        maxNum: this.data.maxNumList[this.data.maxNumIndex],
        startTime: this.data.startTime
      }
    })
    .then(res=>{
      console.log('[云函数] [addTeam] 调用成功', res);
      wx.navigateBack();
    })
    .catch(err=>{
      console.log('[云函数] [addTeam] 调用失败', err);
      wx.showToast({
        icon: 'none',
        title: '云函数调用失败'
      })
      console.log(err)
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