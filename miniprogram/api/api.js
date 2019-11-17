const app = getApp();
const login = (type,userInfo) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'login',
      data: {
        type,
        userInfo
      }
    })
      .then(res => {
        if(res.result.code === 1000) app.globalData.userInfo = res.result.data.userInfo;
        resolve(res);
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