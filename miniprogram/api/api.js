const app = getApp();
const login = (userInfo) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'login',
      data: {
        userInfo
      }
    })
      .then(res => {
        if (res.result.code === 1000) {
          app.globalData.userInfo = res.result.data.userInfo;
          //缓存用户信息
          wx.setStorage({
            key: "userInfo",
            data: res.result.data.userInfo
          })
          resolve();
        }
      })
      .catch(err => {
        wx.showToast({
          icon: 'none',
          title: err
        });
        reject(err);
      })
  })
}


module.exports = {
  login
}